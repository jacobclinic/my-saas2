import { NextRequest, NextResponse } from 'next/server';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import getLogger from '~/core/logger';
import { SessionService } from '~/lib/sessions/session.service';
import { notifyStudentsAfterClassScheduleUpdate } from '~/lib/notifications/email/email.notification.service';
import { notifyStudentsAfterClassScheduleUpdateSMS } from '~/lib/notifications/sms/sms.notification.service';
import { TimeSlot } from '~/lib/classes/types/class-v2';

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