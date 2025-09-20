import { NextRequest, NextResponse } from 'next/server';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import getLogger from '~/core/logger';
import { SessionService } from '~/lib/sessions/session.service';
import { notifyStudentsAfterClassScheduleUpdate } from '~/lib/notifications/email/email.notification.service';
import { notifyStudentsAfterClassScheduleUpdateSMS } from '~/lib/notifications/sms/sms.notification.service';
import { TimeSlot } from '~/lib/classes/types/class-v2';
import { Client } from '@upstash/qstash';

interface QStashClassUpdatePayload {
  classId: string;
  originalTimeSlots: any[];
  newTimeSlots: TimeSlot[];
  startingDate: string;
  newStartingDate?: string;
  className: string;
  operation: 'recreate_sessions_and_notify';
  requestedAt: string;
  userId: string;
}

export async function POST(request: NextRequest) {
  const logger = getLogger();

  try {
    const payload: QStashClassUpdatePayload = await request.json();
    logger.info('Processing class update via QStash', {
      classId: payload.classId,
      operation: payload.operation
    });

    const client = getSupabaseServerActionClient();
    const sessionService = new SessionService(client, logger);
    const qstashClient = new Client({ token: process.env.QSTASH_TOKEN! });

    // ✅ HEAVY: Delete old sessions
    logger.info(`Deleting old sessions for class ${payload.classId}`);
    const deleteSessionsResult = await sessionService.deleteSessions(payload.classId, payload.startingDate);
    if (!deleteSessionsResult.success) {
      logger.error(`Failed to delete sessions for class ${payload.classId}`, {
        error: deleteSessionsResult.error
      });
      throw new Error(`Failed to delete sessions: ${deleteSessionsResult.error.message}`);
    }

    // ✅ HEAVY: Create new sessions (could be hundreds)
    logger.info(`Creating new sessions for class ${payload.classId}`);
    const createSessionsResult = await sessionService.createRecurringSessions(
      payload.classId,
      payload.newTimeSlots,
      payload.newStartingDate || payload.startingDate
    );
    if (!createSessionsResult.success) {
      logger.error(`Failed to create sessions for class ${payload.classId}`, {
        error: createSessionsResult.error
      });
      throw new Error(`Failed to create sessions: ${createSessionsResult.error.message}`);
    }

    logger.info(`Sessions recreated successfully for class ${payload.classId}`, {
      sessionsCreated: createSessionsResult.data.length
    });

    // ✅ LIGHTWEIGHT: Queue batch registration jobs for new sessions
    logger.info(`Queuing batch registration jobs for new sessions in class ${payload.classId}`);

    try {
      // Get sessions that have Zoom meetings
      const { data: sessionsWithMeetings, error: sessionsFetchError } = await client
        .from('sessions')
        .select('id, zoom_meeting_id, title, start_time')
        .eq('class_id', payload.classId)
        .not('zoom_meeting_id', 'is', null)
        .gte('start_time', new Date().toISOString());

      if (sessionsFetchError) {
        logger.error('Error fetching sessions with Zoom meetings for batch registration:', sessionsFetchError);
      } else if (sessionsWithMeetings && sessionsWithMeetings.length > 0) {
        // Get enrolled students for this class
        const { data: enrollments, error: enrollmentError } = await client
          .from('student_class_enrollments')
          .select(`
            student:users (
              email,
              first_name,
              last_name
            )
          `)
          .eq('class_id', payload.classId);

        if (enrollmentError) {
          logger.error('Error fetching enrolled students for batch registration:', enrollmentError);
        } else if (enrollments && enrollments.length > 0) {
          const students = enrollments
            .filter(e => e.student && e.student.first_name && e.student.last_name && e.student.email)
            .map(e => ({
              first_name: e.student!.first_name!,
              last_name: e.student!.last_name!,
              email: e.student!.email!
            }));

          logger.info(`Found ${students.length} enrolled students and ${sessionsWithMeetings.length} sessions with Zoom meetings`);

          // Queue background jobs for each session instead of processing them here
          let queuedJobs = 0;
          for (const session of sessionsWithMeetings) {
            try {
              const jobId = `class-update-${payload.classId}-${session.id}-${Date.now()}`;
              const delaySeconds = Math.floor(Math.random() * 120); // 0-2 minutes stagger

              await qstashClient.publishJSON({
                url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/public/batch-register-students`,
                body: {
                  sessionId: session.id,
                  meetingId: session.zoom_meeting_id!,
                  sessionTitle: session.title || 'Updated Session',
                  students,
                  requestedAt: new Date().toISOString(),
                  jobId
                },
                retries: 3,
                delay: delaySeconds
              });

              logger.info(`Queued registration job for session ${session.id}`, {
                sessionTitle: session.title,
                studentCount: students.length,
                jobId,
                delaySeconds
              });

              queuedJobs++;

            } catch (queueError) {
              logger.error(`Failed to queue registration job for session ${session.id}:`, queueError);
            }
          }

          logger.info(`Successfully queued ${queuedJobs}/${sessionsWithMeetings.length} registration jobs for class ${payload.classId}`);
        }
      }
    } catch (batchRegError) {
      logger.error('Error in batch registration job queuing:', batchRegError);
      // Don't fail the entire operation, just log the error
    }

    // ✅ HEAVY: Send notifications to all enrolled students
    logger.info(`Sending notifications for class ${payload.classId} schedule update`);

    try {
      // Helper function to get the next occurrence of a specific day (copied from original)
      const getNextOccurrenceOfDay = (dayName: string): Date => {
        const daysOfWeek = [
          'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
        ];
        const targetDayIndex = daysOfWeek.indexOf(dayName.toLowerCase());

        if (targetDayIndex === -1) {
          throw new Error(`Invalid day name: ${dayName}`);
        }

        const today = new Date();
        const currentDayIndex = today.getDay();
        let daysUntilTarget = targetDayIndex - currentDayIndex;

        if (daysUntilTarget <= 0) {
          daysUntilTarget += 7;
        }

        const nextOccurrence = new Date(today);
        nextOccurrence.setDate(today.getDate() + daysUntilTarget);
        return nextOccurrence;
      };

      // Format the time slots for notification (copied from original)
      const scheduleInfo = payload.newTimeSlots
        .map((slot) => `${slot.day} ${slot.startTime}-${slot.endTime}`)
        .join(', ');

      const firstTimeSlot = payload.newTimeSlots[0];
      const nextSessionDate = getNextOccurrenceOfDay(firstTimeSlot.day).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Send both email and SMS notifications
      await Promise.all([
        notifyStudentsAfterClassScheduleUpdate(client, {
          classId: payload.classId,
          className: payload.className,
          updatedClassDay: firstTimeSlot.day,
          updatedStartTime: firstTimeSlot.startTime,
          updatedEndTime: scheduleInfo.includes(',') ? scheduleInfo : firstTimeSlot.endTime,
          nextClassDate: nextSessionDate,
        }),
        notifyStudentsAfterClassScheduleUpdateSMS(client, {
          classId: payload.classId,
          className: payload.className,
          updatedClassDay: firstTimeSlot.day,
          updatedStartTime: firstTimeSlot.startTime,
          updatedEndTime: scheduleInfo.includes(',') ? scheduleInfo : firstTimeSlot.endTime,
          nextClassDate: nextSessionDate,
        }),
      ]);

      logger.info(`Successfully sent schedule update notifications for class ${payload.classId}`);

    } catch (notificationError) {
      logger.error(`Failed to send notifications for class ${payload.classId}`, {
        error: notificationError instanceof Error ? notificationError.message : String(notificationError)
      });
      // Don't fail the entire operation for notification errors
    }

    logger.info(`Class update background processing completed successfully`, {
      classId: payload.classId,
      sessionsCreated: createSessionsResult.data.length
    });

    return NextResponse.json({
      success: true,
      classId: payload.classId,
      sessionsCreated: createSessionsResult.data.length,
      operation: payload.operation,
      completedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error in QStash class update processing', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}


export const maxDuration = 300; // 5 minutes for heavy operations