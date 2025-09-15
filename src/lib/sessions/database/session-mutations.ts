import { SupabaseClient } from '@supabase/supabase-js';
import {
  STUDENT_SESSION_ATTENDANCE_TABLE,
  ZOOM_SESSIONS_TABLE,
} from '~/lib/db-tables';
import { DatabaseError } from '~/lib/shared/errors';
import { failure, Result, success } from '~/lib/shared/result';
import { Database } from '~/database.types';
import getLogger from '~/core/logger';

const logger = getLogger();

type Client = SupabaseClient<Database>;

/**
 * Updates student session attendance status based on meeting activity
 * This tracks session participation for waiting room and one-session policy
 */
export async function updateStudentSessionStatus(
  client: Client,
  params: {
    email: string;
    meetingId: string;
    status: 'Not Joined' | 'In Waiting Room' | 'In Meeting' | 'Left Meeting'
  }
): Promise<Result<boolean, DatabaseError>> {
  try {
    logger.info('Updating student session status', {
      email: params.email,
      meetingId: params.meetingId,
      status: params.status
    });

    // Use direct database queries for better error handling
    return await updateStudentSessionStatusDirect(client, params);

  } catch (error) {
    logger.error('Error updating student session status', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      params
    });
    return failure(new DatabaseError('Failed to update student session status'));
  }
}

/**
 * Alternative direct implementation (fallback if database function fails)
 */
export async function updateStudentSessionStatusDirect(
  client: Client,
  params: {
    email: string;
    meetingId: string;
    status: 'Not Joined' | 'In Waiting Room' | 'In Meeting' | 'Left Meeting'
  }
): Promise<Result<boolean, DatabaseError>> {
  try {
    logger.info('Direct update of student session status', params);

    // First, find the session associated with this meeting
    const { data: zoomSession, error: zoomError } = await client
      .from(ZOOM_SESSIONS_TABLE)
      .select('session_id')
      .eq('meeting_id', params.meetingId)
      .single();

    if (zoomError || !zoomSession) {
      logger.error('Session not found for meeting ID', {
        meetingId: params.meetingId,
        error: zoomError
      });
      return success(true); // Don't fail for this
    }

    // Find the student by email
    const { data: user, error: userError } = await client
      .from('users')
      .select('id, first_name, last_name')
      .eq('email', params.email)
      .eq('user_role', 'student')
      .single();

    if (userError || !user) {
      // Return failure to make error visible in webhook response
      return failure(new DatabaseError(`Student lookup failed: ${userError?.message || 'No user found'} for email: ${params.email}`));
    }

    // Check if attendance record exists
    const { data: existingAttendance, error: attendanceCheckError } = await client
      .from(STUDENT_SESSION_ATTENDANCE_TABLE)
      .select('id')
      .eq('student_id', user.id)
      .eq('session_id', zoomSession.session_id)
      .single();

    if (existingAttendance) {
      // Update existing record
      const { error: updateError } = await client
        .from(STUDENT_SESSION_ATTENDANCE_TABLE)
        .update({
          join_status: params.status,
          join_time: params.status === 'In Meeting' ? new Date().toISOString() : undefined,
          leave_time: params.status === 'Left Meeting' ? new Date().toISOString() : undefined,
        })
        .eq('id', existingAttendance.id);

      if (updateError) {
        logger.error('Failed to update session attendance', {
          error: updateError,
          attendanceId: existingAttendance.id,
          status: params.status
        });
        return failure(new DatabaseError('Failed to update session attendance'));
      }
    } else {
      // Create new attendance record
      const { error: insertError } = await client
        .from(STUDENT_SESSION_ATTENDANCE_TABLE)
        .insert({
          student_id: user.id,
          session_id: zoomSession.session_id,
          join_status: params.status,
          join_time: ['In Meeting', 'In Waiting Room'].includes(params.status)
            ? new Date().toISOString()
            : null,
          leave_time: params.status === 'Left Meeting'
            ? new Date().toISOString()
            : null,
          created_at: new Date().toISOString(),
          time: new Date().toISOString(),
          email: params.email,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        });

      if (insertError) {
        logger.error('Failed to create session attendance record', {
          error: insertError,
          userId: user.id,
          sessionId: zoomSession.session_id,
          status: params.status
        });
        return failure(new DatabaseError('Failed to create session attendance'));
      }
    }

    logger.info('Successfully updated student session status directly', {
      userId: user.id,
      sessionId: zoomSession.session_id,
      status: params.status
    });

    return success(true);

  } catch (error) {
    logger.error('Error in direct session status update', {
      error: error instanceof Error ? error.message : String(error),
      params
    });
    return failure(new DatabaseError('Failed to update student session status'));
  }
}