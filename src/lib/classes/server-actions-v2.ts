'use server';

import { revalidatePath } from 'next/cache';
import {
  createClass,
  deleteClass,
  getClassById,
  updateClass,
} from '~/lib/classes/database/mutations-v2';
import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { ClassType, NewClassData, TimeSlot } from './types/class-v2';
import { getUpcomingOccurrences } from '../utils/date-utils';
import { CLASSES_TABLE, SESSIONS_TABLE, USERS_TABLE } from '../db-tables';
import verifyCsrfToken from '~/core/verify-csrf-token';
import { getClassDataByIdwithNextSession } from './database/queries';
import { getAllUpcommingSessionsData } from '../sessions/database/queries';

import { generateRegistrationLinkAction } from '~/app/actions/registration-link';
import { format as dateFnsFormat } from 'date-fns';
import { sendSingleSMS } from '../notifications/sms/sms.notification.service';
import { EmailService } from '~/core/email/send-email-mailtrap';
import { getStudentInvitationToClass } from '~/core/email/templates/emailTemplate';
import { isAdminOrCLassTutor } from '../user/database/queries';
import { createInvoiceForNewClass } from '../invoices/database/mutations';
import { generateWeeklyOccurrences, RecurrenceInput } from '../utils/recurrence-utils';
import { isEqual } from '../utils/lodash-utils';
import { zoomService } from '../zoom/v2/zoom.service';

type CreateClassParams = {
  classData: NewClassData;
  csrfToken: string;
};

type UpdateClassParams = {
  classId: string;
  classData: Partial<Omit<ClassType, 'id'>>;
  csrfToken: string;
};

type DeleteClassParams = {
  classId: string;
  csrfToken: string;
};

export const createClassAction = withSession(
  async (params: CreateClassParams) => {
    console.log("Create class action called", params);
    // 
    try {
      const zoomMeeting = await zoomService.createZoomUserMeeting();
      console.log('Zoom meeting created:', zoomMeeting);
    } catch (error) {
      console.error('Error creating zoom meeting:', error);
      throw error;
    }
    // 
    const { classData, csrfToken } = params;
    const client = getSupabaseServerActionClient();

    // Create the class
    const classResult = await createClass(client, classData);

    // Get tutor's email (for Zoom meeting setup)
    const { data: tutorData } = await client
      .from('users')
      .select('email')
      .eq('id', classData.tutorId)
      .single(); // Generate initial sessions for the month and create one Zoom meeting per time slot

    const occurrences = [];
    const yearEndDate = new Date(new Date().getFullYear(), 11, 31)
      .toISOString()
      .split('T')[0]

    for (const slot of classData.timeSlots) {
      console.log("Slot", slot);
      const recurrenceInputPayload: RecurrenceInput = {
        startDate: classData.startDate,
        endDate: yearEndDate,
        timeSlot: slot,
        dayOfWeek: slot.day
      }
      try {
        const weeklyOccurences = generateWeeklyOccurrences(recurrenceInputPayload);
        occurrences.push(...weeklyOccurences);
      } catch (error) {
        console.error('Error generating weekly occurrences:', error);
        throw error;
      }
    }

    // TODO: Create a zoom meeting for the first occurrence.
      try {
        const zoomMeeting = await zoomService.createZoomUserMeeting();
        console.log('Zoom meeting created:', zoomMeeting);
      } catch (error) {
        console.error('Error creating zoom meeting:', error);
        throw error;
      }
    // 

    const sessions = occurrences.map((occurrence, index) => ({
      class_id: classResult?.id,
      start_time: new Date(occurrence.startTime).toISOString(),
      end_time: new Date(occurrence.endTime).toISOString(),
      meeting_url: '',
      zoom_meeting_id: '',
      status: 'scheduled',
      created_at: new Date().toISOString(),
    }));

    // TODO: Replace the below logic with the actual logic to generate the zoom.

    // const initialSessions = await Promise.all(
    //   classData.timeSlots.map(async (timeSlot) => {
    //     // Get end date for this year (December 31st)
    //     const endDate = new Date(new Date().getFullYear(), 11, 31)
    //       .toISOString()
    //       .split('T')[0]; // Get all upcoming occurrences for year
    //     const nextOccurrences = getUpcomingOccurrences(
    //       timeSlot,
    //       classData.startDate,
    //       endDate,
    //     ); // Take the first occurrence

    //     // Take the first occurrence for Zoom meeting creation
    //     const firstOccurrence = nextOccurrences[0];

    //     // Create a single Zoom meeting for the first occurrence
    //     const zoomMeeting = await createZoomMeeting(
    //       classResult?.id,
    //       {
    //         name: classData.name || 'Class',
    //         subject: classData.subject || 'Subject',
    //         description: classData.description || 'Description',
    //         yearGrade: classData.yearGrade || '',
    //         monthlyFee: classData.monthlyFee || '',
    //         startDate: classData.startDate || '',
    //         timeSlots: [timeSlot],
    //         tutorId: classData.tutorId || '',
    //       },
    //       {
    //         startTime: new Date(firstOccurrence.startTime),
    //         endTime: new Date(firstOccurrence.endTime),
    //       },
    //     );

    //     // Map all occurrences to session objects, with only the first having a meeting_url
    //     const sessions = nextOccurrences.map((occurrence, index) => ({
    //       class_id: classResult?.id,
    //       start_time: new Date(occurrence.startTime).toISOString(),
    //       end_time: new Date(occurrence.endTime).toISOString(),
    //       meeting_url: index === 0 ? zoomMeeting?.zoomMeeting.join_url : '', // Only first session gets the Zoom URL
    //       zoom_meeting_id: zoomMeeting?.zoomMeeting.id,
    //       status: 'scheduled',
    //       created_at: new Date().toISOString(),
    //     }));

    //     return sessions;
    //   }),
    // );

    // Insert all initial sessions into the database
    const { error: sessionError } = await client
      .from(SESSIONS_TABLE)
      .insert(sessions.flat());

    if (sessionError) throw sessionError;

    // Create an invoice for the newly created class
    if (classResult?.id) {
      const invoiceId = await createInvoiceForNewClass(client, classResult.id);
      if (!invoiceId) {
        console.error(
          'Failed to create invoice for new class:',
          classResult.id,
        );
        // Continue with class creation even if invoice creation fails
        // The invoice can be generated later with the monthly job
      }
    }

    // Revalidate paths
    revalidatePath('/classes');
    revalidatePath('/(app)/classes');

    return {
      success: true,
      class: classResult,
    };
  },
);

export const updateClassAction = withSession(
  async (params: UpdateClassParams) => {

    const client = getSupabaseServerActionClient();
    console.log("Update class action called", params);

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await client.auth.getSession();
    if (sessionError || !session?.user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const userId = session.user.id;

    // Check if the user has permission to update this class
    const hasPermission = await isAdminOrCLassTutor(
      client,
      userId,
      params.classId,
    );
    if (!hasPermission) {
      return {
        success: false,
        error: "You don't have permissions to update this class",
      };
    }

    const originalClass = await getClassById(client, params.classId);
    // Update the class data
    const result = await updateClass(client, params.classId, params.classData);

    if (!result) {
      return {
        success: false,
        error: 'There was an error updating the class. Please try again',
      };
    }

    // Compare to check if the original slots have been changed.
    if (!isEqual(originalClass.time_slots, params.classData.time_slots)) {
      // Slots have been changed and needs to generate the new occurrences.
      const currentTime = new Date().toISOString();
      const { error: deleteSessionsError } = await client
        .from(SESSIONS_TABLE)
        .delete()
        .eq('class_id', params.classId)
        .gt('start_time', currentTime);

      if (deleteSessionsError) {
        throw deleteSessionsError;
      }

      const nextOccurrences = generateAllWeeklyOccurrencesForYear({
        startDate: new Date().toISOString().split('T')[0],
        timeSlots: params.classData.time_slots as TimeSlot[],
      });

      const sessions = nextOccurrences.map((occurrence, index) => ({
        class_id: params.classId,
        start_time: new Date(occurrence.startTime).toISOString(),
        end_time: new Date(occurrence.endTime).toISOString(),
        meeting_url: '',
        zoom_meeting_id: '',
        status: 'scheduled',
        created_at: new Date().toISOString(),
      }));

      const { error: sessionError } = await client
        .from(SESSIONS_TABLE)
        .insert(sessions.flat());

      if (sessionError) throw sessionError;

    }

    // If time slots were updated, delete existing upcoming sessions and create new ones
    // if (params.classData.time_slots) {
    //   // Delete all upcoming sessions for this class


    //   // Get the updated class details to create new sessions
    //   const { data: classDetails } = await client
    //     .from(CLASSES_TABLE)
    //     .select('*')
    //     .eq('id', params.classId)
    //     .single();

    //   if (!classDetails) {
    //     throw new Error('Failed to fetch updated class data');
    //   }

    //   // Create new sessions with the updated time slots
    //   const initialSessions = await Promise.all(
    //     (params.classData.time_slots as unknown as TimeSlot[]).map(
    //       async (timeSlot) => {
    //         // Get all upcoming occurrences for the year
    //         const nextOccurrences = getUpcomingOccurrences(
    //           timeSlot,
    //           classDetails.starting_date ||
    //           new Date().toISOString().split('T')[0],
    //           new Date(new Date().getFullYear(), 11, 31)
    //             .toISOString()
    //             .split('T')[0],
    //         );

    //         // Take the first occurrence for Zoom meeting creation
    //         const firstOccurrence = nextOccurrences[0];

    //         // Create a single Zoom meeting for the first occurrence
    //         const zoomMeeting = await createZoomMeeting(
    //           params.classId,
    //           {
    //             name: classDetails.name || 'Class',
    //             subject: classDetails.subject || 'Subject',
    //             description: classDetails.description || 'Description',
    //             yearGrade: classDetails.grade || '',
    //             monthlyFee: String(classDetails.fee) || '',
    //             startDate: classDetails.starting_date || '',
    //             timeSlots: [timeSlot],
    //             tutorId: classDetails.tutor_id || '',
    //           },
    //           {
    //             startTime: new Date(firstOccurrence.startTime),
    //             endTime: new Date(firstOccurrence.endTime),
    //           },
    //         );

    //         // Map all occurrences to session objects, with only the first having a meeting_url
    //         const sessions = nextOccurrences.map((occurrence, index) => ({
    //           class_id: params.classId,
    //           start_time: new Date(occurrence.startTime).toISOString(),
    //           end_time: new Date(occurrence.endTime).toISOString(),
    //           meeting_url: index === 0 ? zoomMeeting?.zoomMeeting.join_url : '', // Only first session gets the Zoom URL
    //           zoom_meeting_id: zoomMeeting?.zoomMeeting.id,
    //           status: 'scheduled',
    //           created_at: new Date().toISOString(),
    //         }));

    //         return sessions;
    //       },
    //     ),
    //   );

    //   // Insert all new sessions into the database
    //   const { error: sessionError } = await client
    //     .from(SESSIONS_TABLE)
    //     .insert(sessions.flat());

    //   if (sessionError) throw sessionError;
    // }

    revalidatePath('/classes');
    revalidatePath(`/classes/${result?.id}`);
    revalidatePath('/(app)/classes');

    return {
      success: true,
      class: result,
    };
  },
);

export const deleteClassAction = withSession(
  async (params: DeleteClassParams) => {
    const { classId, csrfToken } = params;
    const client = getSupabaseServerActionClient();

    await verifyCsrfToken(csrfToken);

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await client.auth.getSession();
    if (sessionError || !session?.user) {
      return {
        success: false,
        error: 'User not authenticated',
      };
    }

    const userId = session.user.id;

    // Check user role and permissions
    const havePermission = await isAdminOrCLassTutor(client, userId, classId);
    console.log('havePermission', havePermission);
    if (!havePermission) {
      return {
        success: false,
        error: `You don't have permissions to delete the class`,
      };
    }
    //Proceed with class deletion
    const result = await deleteClass(client, classId);
    if (!result) {
      return {
        success: false,
        error: 'Failed to delete class',
      };
    }

    //Revalidate paths
    revalidatePath('/classes');
    revalidatePath('/(app)/classes');

    return {
      success: true,
      classId: result,
    };
  },
);
// const createZoomMeetingsBatch = async (
//   classId: string,
//   classData: NewClassData,
//   occurrences: { startTime: Date; endTime: Date }[],
// ) => {
//   const results = [];

//   for (let i = 0; i < occurrences.length; i++) {
//     const occurrence = occurrences[i];

//     const start_time = occurrence.startTime.toISOString();
//     const end_time = occurrence.endTime.toISOString();

//     try {
//       // Create Zoom meeting
//       const zoomMeeting = await zoomService.createMeeting(
//         {
//           topic: `${classData.name}_${start_time}`,
//           start_time,
//           duration:
//             (new Date(occurrence.endTime).getTime() -
//               new Date(occurrence.startTime).getTime()) /
//             (1000 * 60),
//           timezone: 'Asia/Colombo',
//           type: 2,
//         },
//         '',
//       );

//       if (!zoomMeeting) {
//         throw new Error('Failed to initialize Zoom session');
//       }

//       results.push({
//         class_id: classId,
//         start_time,
//         end_time,
//         zoom_meeting_id: zoomMeeting?.id,
//       });

//       // Introduce a delay after every 9 requests
//       if ((i + 1) % 9 === 0) {
//         console.log('Rate limit reached, waiting for 1 second...');
//         await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
//       }
//     } catch (error) {
//       console.error(
//         `Error creating Zoom meeting for occurrence ${i + 1}:`,
//         error,
//       );
//     }
//   }

//   return results;
// };

// export const createZoomMeeting = async (
//   classId: string,
//   classData: NewClassData,
//   occurrence: { startTime: Date; endTime: Date },
// ) => {
//   const start_time = occurrence.startTime.toISOString();
//   const end_time = occurrence.endTime.toISOString();
//   try {
//     // Create Zoom meeting
//     const zoomMeeting = await zoomService.createMeeting(
//       {
//         topic: `${classData.name}_${start_time}`,
//         start_time,
//         duration:
//           (new Date(occurrence.endTime).getTime() -
//             new Date(occurrence.startTime).getTime()) /
//           (1000 * 60),
//         timezone: 'Asia/Colombo',
//         type: 2,
//       },
//       '',
//     );
//     if (!zoomMeeting) {
//       throw new Error('Failed to initialize Zoom session');
//     }
//     return {
//       zoomMeeting: zoomMeeting,
//       class_id: classId,
//       start_time,
//       end_time,
//       zoom_meeting_id: zoomMeeting?.id,
//     };
//   } catch (error) {
//     console.error(`Error creating Zoom meeting`, error);
//   }
// };

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

    const registrationLink =
      await generateRegistrationLinkAction(registrationData);
    const emailContent = getStudentInvitationToClass({
      studentName: name,
      email: email,
      className: classData.name,
      loginUrl: registrationLink,
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


function generateAllWeeklyOccurrencesForYear(classData: { startDate: string; timeSlots: TimeSlot[] }) {
  const occurrences = [];
  const yearEndDate = new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0];

  for (const slot of classData.timeSlots) {
    const recurrenceInputPayload: RecurrenceInput = {
      startDate: classData.startDate,
      endDate: yearEndDate,
      timeSlot: slot,
      dayOfWeek: slot.day,
    };

    try {
      const weeklyOccurrences = generateWeeklyOccurrences(recurrenceInputPayload);
      occurrences.push(...weeklyOccurrences);
    } catch (error) {
      console.error(`Error generating weekly occurrences for slot: ${JSON.stringify(slot)}`, error);
      throw error;
    }
  }

  return occurrences;
}