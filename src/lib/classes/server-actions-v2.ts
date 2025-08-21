'use server';

import { revalidatePath } from 'next/cache';
import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { createClassFailure, CreateClassParams, CreateClassResponse, createClassSuccess, TimeSlot, updateClassFailure, UpdateClassParams, updateClassSuccess, deleteClassSuccess, deleteClassFailure, DeleteClassResponse, ClassCreatedEvent } from './types/class-v2';
import { USERS_TABLE } from '../db-tables';
import verifyCsrfToken from '~/core/verify-csrf-token';
import { getClassByIdWithTutor, getClassDataByIdwithNextSession } from './database/queries';
import { getAllUpcommingSessionsData } from '../sessions/database/queries';

import { createShortUrlAction } from '../short-links/server-actions-v2';
import { format as dateFnsFormat } from 'date-fns';
import { sendSingleSMS } from '../notifications/sms/sms.notification.service';
import { EmailService } from '~/core/email/send-email-mailtrap';
import { getStudentInvitationToClass } from '~/core/email/templates/emailTemplate';
import { isAdminOrCLassTutor } from '../user/database/queries';
import { notifyStudentsAfterClassScheduleUpdate } from '../notifications/email/email.notification.service';
import { notifyStudentsAfterClassScheduleUpdateSMS } from '../notifications/sms/sms.notification.service';
import { generateWeeklyOccurrences, RecurrenceInput } from '../utils/recurrence-utils';
import { ZoomService } from '../zoom/v2/zoom.service';
import { ErrorCodes } from '../shared/error-codes';
import { ClassService } from './class.service';
import getLogger from '~/core/logger';
import { SessionService } from '../sessions/session.service';
import { isEqual } from '../utils/lodash-utils';
import { UpstashService } from '../upstash/upstash.service';


type DeleteClassParams = {
  classId: string;
  csrfToken: string;
};

export const createClassAction = withSession(
  async (params: CreateClassParams): Promise<CreateClassResponse> => {

    const { data, csrfToken } = params;
    const client = getSupabaseServerActionClient();
    const logger = getLogger();
    const zoomService = new ZoomService(client);
    const classService = new ClassService(client, logger);
    const sessionService = new SessionService(client, logger);
    try {

      await verifyCsrfToken(csrfToken);

      logger.info("Creating class", { classData: data });

      const zoomUserValidity = await zoomService.checkIfZoomUserValid(data.tutor_id);
      if (!zoomUserValidity.success) {
        return createClassFailure(zoomUserValidity.error.message, ErrorCodes.ZOOM_ERROR);
      }

      const classResult = await classService.createClass(params.data);

      if (!classResult.success) {
        return createClassFailure(classResult.error.message, ErrorCodes.SERVICE_LEVEL_ERROR);
      }

      const upstashService = UpstashService.getInstance(logger);
      const result = await upstashService.publishToUpstash<ClassCreatedEvent>({
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/public/class/async-create`,
        body: {
          classId: classResult.data.id,
          timeSlots: data.time_slots as unknown as TimeSlot[],
          tutorId: data.tutor_id,
          startDate: data.starting_date,
        },
      });
      if (!result.success) {
        return createClassFailure(result.error.message, ErrorCodes.SERVICE_LEVEL_ERROR);
      }

      // Revalidate paths
      revalidatePath('/classes');
      revalidatePath('/(app)/classes');
      return createClassSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Unexpected error in createClassAction', { error: errorMessage });
      return createClassFailure(errorMessage, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  },
);

export const updateClassAction = withSession(
  async (params: UpdateClassParams) => {
    const client = getSupabaseServerActionClient();
    const logger = getLogger();
    const zoomService = new ZoomService(client);
    const classService = new ClassService(client, logger);
    const sessionService = new SessionService(client, logger);
    try {
      const classWithTutorData = await getClassByIdWithTutor(client, params.classId);
      const tutorId = classWithTutorData?.tutor_id;
      const zoomUserValidity = await zoomService.checkIfZoomUserValid(tutorId!);
      if (!zoomUserValidity.success) {
        return updateClassFailure(zoomUserValidity.error.message, ErrorCodes.ZOOM_ERROR);
      }
      // Get the current user's session
      const {
        data: { session },
        error: sessionError,
      } = await client.auth.getSession();
      if (sessionError || !session?.user) {
        return updateClassFailure('User not authenticated', ErrorCodes.UNAUTHORIZED);
      }

      const userId = session.user.id;

      // Check if the user has permission to update this class
      const hasPermission = await isAdminOrCLassTutor(
        client,
        userId,
        params.classId,
      );
      if (!hasPermission) {
        return updateClassFailure("You don't have permissions to update this class", ErrorCodes.FORBIDDEN);
      }

      const originalClassResult = await classService.getClassById(params.classId);
      if (!originalClassResult.success) {
        return updateClassFailure(originalClassResult.error.message, ErrorCodes.SERVICE_LEVEL_ERROR);
      }

      const updateClassResult = await classService.updateClass(params.classId, params.classData, originalClassResult.data)

      if (!updateClassResult.success) {
        return updateClassFailure(updateClassResult.error.message, ErrorCodes.SERVICE_LEVEL_ERROR);
      }

      if (!isEqual(originalClassResult.data.time_slots, params.classData.time_slots)) {
        const deleteSessionsResult = await sessionService.deleteSessions(params.classId, originalClassResult.data.starting_date);
        if (!deleteSessionsResult.success) {
          return updateClassFailure(deleteSessionsResult.error.message, ErrorCodes.SERVICE_LEVEL_ERROR);
        }
        const createSessionsResult = await sessionService.createRecurringSessions(params.classId, params.classData.time_slots as unknown as TimeSlot[], params.classData.starting_date!);
        if (!createSessionsResult.success) {
          return updateClassFailure(createSessionsResult.error.message, ErrorCodes.SERVICE_LEVEL_ERROR);
        }

        await zoomService.createMeetingsForTomorrowSessions();

        // Todo : Refactor the notification service.
        if (!isEqual(originalClassResult.data.time_slots, params.classData.time_slots)) {
          try {
            // Helper function to get the next occurrence of a specific day
            const getNextOccurrenceOfDay = (dayName: string): Date => {
              const daysOfWeek = [
                'sunday',
                'monday',
                'tuesday',
                'wednesday',
                'thursday',
                'friday',
                'saturday',
              ];
              const targetDayIndex = daysOfWeek.indexOf(dayName.toLowerCase());

              if (targetDayIndex === -1) {
                throw new Error(`Invalid day name: ${dayName}`);
              }

              const today = new Date();
              const currentDayIndex = today.getDay();

              // Calculate days until the target day
              let daysUntilTarget = targetDayIndex - currentDayIndex;

              // If the target day is today or has passed this week, get it for next week
              if (daysUntilTarget <= 0) {
                daysUntilTarget += 7;
              }

              // Create the next occurrence date
              const nextOccurrence = new Date(today);
              nextOccurrence.setDate(today.getDate() + daysUntilTarget);

              return nextOccurrence;
            };

            // Format the time slots for notification - combine multiple slots if they exist
            const timeSlots = params.classData.time_slots as unknown as TimeSlot[];
            const scheduleInfo = timeSlots
              .map((slot) => `${slot.day} ${slot.startTime}-${slot.endTime}`)
              .join(', ');

            // Use the first time slot's day and combined time for the template
            const firstTimeSlot = timeSlots[0];

            // Calculate the next occurrence of the updated class day
            const nextSessionDate = getNextOccurrenceOfDay(
              firstTimeSlot.day,
            ).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

            await Promise.all([
              notifyStudentsAfterClassScheduleUpdate(client, {
                classId: params.classId,
                className: updateClassResult.data.name,
                updatedClassDay: firstTimeSlot.day,
                updatedStartTime: firstTimeSlot.startTime,
                updatedEndTime: scheduleInfo.includes(',')
                  ? scheduleInfo
                  : firstTimeSlot.endTime,
                nextClassDate: nextSessionDate,
              }),
              notifyStudentsAfterClassScheduleUpdateSMS(client, {
                classId: params.classId,
                className: updateClassResult.data.name,
                updatedClassDay: firstTimeSlot.day,
                updatedStartTime: firstTimeSlot.startTime,
                updatedEndTime: scheduleInfo.includes(',')
                  ? scheduleInfo
                  : firstTimeSlot.endTime,
                nextClassDate: nextSessionDate,
              }),
            ]);
            console.log(
              'Successfully sent schedule update notifications (email and SMS) to students',
            );
          } catch (notificationError) {
            console.error(
              'Failed to send schedule update notifications:',
              notificationError,
            );
            // Don't throw here - we don't want to fail the entire update if notifications fail
          }
        }
      }
      revalidatePath('/classes');
      revalidatePath(`/classes/${params.classId}`);
      revalidatePath('/(app)/classes');
      return updateClassSuccess();
    } catch (error) {
      return updateClassFailure(error instanceof Error ? error.message : String(error), ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  },
);

export const deleteClassAction = withSession(
  async (params: DeleteClassParams): Promise<DeleteClassResponse> => {
    const { classId, csrfToken } = params;
    const client = getSupabaseServerActionClient();
    const logger = getLogger();
    const classService = new ClassService(client, logger);

    try {
      await verifyCsrfToken(csrfToken);

      // Get the current user's session
      const {
        data: { session },
        error: sessionError,
      } = await client.auth.getSession();
      if (sessionError || !session?.user) {
        return deleteClassFailure('User not authenticated', ErrorCodes.UNAUTHORIZED);
      }

      const userId = session.user.id;

      logger.info('Deleting class', { classId, userId });

      const result = await classService.deleteClass(classId, userId);
      if (!result.success) {
        return deleteClassFailure(result.error.message, ErrorCodes.SERVICE_LEVEL_ERROR);
      }

      revalidatePath('/classes');
      revalidatePath('/(app)/classes');
      return deleteClassSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return deleteClassFailure(errorMessage, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }
);

export const getAllUpcominSessionsAdmin = withSession(async () => {
  const client = getSupabaseServerActionClient();
  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession();
  if (sessionError || !session?.user) {
    throw new Error('User not authenticated');
  }

  const userId = session.user.id;

  // Check user role and permissions
  const { data: userProfile, error: profileError } = await client
    .from(USERS_TABLE)
    .select('user_role')
    .eq('id', userId)
    .single();

  if (profileError || !userProfile) {
    throw new Error('Failed to fetch user profile');
  }

  const isAdmin = userProfile.user_role === 'admin';

  if (!isAdmin) {
    console.log('here...');
    throw new Error('Unauthorized to access this data');
  }

  const data = await getAllUpcommingSessionsData(client);
  if (!data) {
    throw new Error('Failed to fetch upcoming sessions data');
  }
  return data;
});

export const getClassDataByIdAction = withSession(async (classId: string) => {
  const client = getSupabaseServerActionClient();
  const data = await getClassDataByIdwithNextSession(client, classId);
  if (!data) {
    throw new Error('Failed to fetch class data');
  }
  return data;
});

export const sendEmailMSGToStudentAction = withSession(
  async (params: {
    name: string;
    phoneNumber: string;
    email: string;
    classId: string;
  }) => {
    const { name, phoneNumber, email, classId } = params;

    const classData = await getClassDataByIdAction(classId);
    // Send email logic here (e.g., using a third-party service)
    const schedule =
      classData?.time_slots?.reduce(
        (acc: string, slot: any, index: number, array) => {
          const timeSlotString = `${slot.day}, ${slot.startTime} - ${slot.endTime}`;
          // Add a separator for all except the last item
          return acc + timeSlotString + (index < array.length - 1 ? '; ' : '');
        },
        '',
      ) || 'No schedule available';

    const formattedDate = classData?.nextSession
      ? dateFnsFormat(new Date(classData.nextSession), 'EEE, MMM dd, yyyy')
      : 'No upcoming session';

    const registrationData = {
      classId,
      className: classData.name || '',
      nextSession: formattedDate,
      time: schedule || '',
      tutorName:
        classData.tutor.first_name + ' ' + classData.tutor.last_name || 'Tutor',
    };

    // Create URL with parameters
    const urlParams = new URLSearchParams({
      classId: registrationData.classId,
      className: registrationData.className,
      nextSession: registrationData.nextSession,
      time: registrationData.time,
      tutorName: registrationData.tutorName,
    });

    const registrationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/self-registration?${urlParams.toString()}`;

    const shortLinkResult = await createShortUrlAction({
      originalUrl: registrationUrl
    });

    const registrationLink =
      shortLinkResult.success && shortLinkResult.shortUrl
        ? shortLinkResult.shortUrl
        : registrationUrl;

    const emailContent = getStudentInvitationToClass({
      studentName: name,
      email: email,
      className: classData.name,
      registrationUrl: registrationLink,
    });
    const emailService = EmailService.getInstance();
    try {
      await Promise.all([
        emailService.sendEmail({
          from: process.env.EMAIL_SENDER!,
          to: email,
          subject: 'Welcome to Your Class - Login Credentials',
          html: emailContent.html,
          text: emailContent.text,
        }),
        // send welcome sms
        sendSingleSMS({
          phoneNumber: phoneNumber,
          message: `Welcome to ${classData.name}! Your are invited to join the class. Click on the link and Register with ${email}.
                      \n${registrationLink}
                      \n-Comma Education`,
        }),
      ]);
    } catch (error) {
      console.error('Error sending email:', error);
    }

    return {
      success: true,
      message: 'Email sent successfully',
    };
  },
);

function generateAllWeeklyOccurrencesForYear(classData: {
  startDate: string;
  timeSlots: TimeSlot[];
}) {
  const occurrences = [];
  const yearEndDate = new Date(new Date().getFullYear(), 11, 31)
    .toISOString()
    .split('T')[0];

  for (const slot of classData.timeSlots) {
    const recurrenceInputPayload: RecurrenceInput = {
      startDate: classData.startDate,
      endDate: yearEndDate,
      timeSlot: slot,
      dayOfWeek: slot.day,
    };

    try {
      const weeklyOccurrences = generateWeeklyOccurrences(
        recurrenceInputPayload,
      );
      occurrences.push(...weeklyOccurrences);
    } catch (error) {
      console.error(
        `Error generating weekly occurrences for slot: ${JSON.stringify(slot)}`,
        error,
      );
      throw error;
    }
  }

  return occurrences;
}
