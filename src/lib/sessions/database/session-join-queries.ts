import { SupabaseClient } from '@supabase/supabase-js';
import {
  CLASSES_TABLE,
  STUDENT_CLASS_ENROLLMENTS_TABLE,
  SESSIONS_TABLE,
  STUDENT_PAYMENTS_TABLE,
  ZOOM_SESSIONS_TABLE,
  STUDENT_SESSION_ATTENDANCE_TABLE,
} from '~/lib/db-tables';
import { DatabaseError } from '~/lib/shared/errors';
import { failure, Result, success } from '~/lib/shared/result';
import { Database } from '~/database.types';
import getLogger from '~/core/logger';
import { isFirstWeekOfMonth } from '~/lib/utils/date-utils';

const logger = getLogger();

type Client = SupabaseClient<Database>;

export interface StudentPaymentVerificationData {
  isEnrolled: boolean;
  paymentStatus: string;
}

export interface SessionDetailsData {
  session_id: string;
  class_id: string;
  zoom_meeting_id: string | null;
  start_time: string;
  end_time: string;
  class_name: string;
  session_title: string;
}

export interface PaymentVerificationByEmailData {
  isEligible: boolean;
  reason: string;
}

/**
 * Verifies if a student has paid for the specific session and is enrolled in the class
 */
export async function verifyStudentPaymentForSession(
  client: Client,
  params: {
    userId: string;
    sessionId: string;
  }
): Promise<Result<StudentPaymentVerificationData, DatabaseError>> {
  try {
    const { data: session, error: sessionError } = await client
      .from(SESSIONS_TABLE)
      .select(`
        id,
        class_id,
        start_time,
        class:${CLASSES_TABLE}!class_id (
          id,
          name
        )
      `)
      .eq('id', params.sessionId)
      .single();

    if (sessionError || !session || !session.class_id) {
      logger.error('Session not found', { sessionId: params.sessionId, error: sessionError });
      return failure(new DatabaseError('Session not found'));
    }

    // Check if student is enrolled in the class
    const { data: enrollment, error: enrollmentError } = await client
      .from(STUDENT_CLASS_ENROLLMENTS_TABLE)
      .select('*')
      .eq('student_id', params.userId)
      .eq('class_id', session.class_id)
      .single();

    if (enrollmentError || !enrollment) {
      logger.error('Student not enrolled in class', {
        userId: params.userId,
        classId: session.class_id,
        error: enrollmentError
      });
      return success({
        isEnrolled: false,
        paymentStatus: 'not_enrolled'
      });
    }

    // Check payment status for the session month
    if (!session.start_time) {
      logger.error('Session start time missing', { sessionId: params.sessionId });
      return failure(new DatabaseError('Session start time not found'));
    }

    const sessionDate = new Date(session.start_time);
    const paymentPeriod = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}`;

    const { data: payment, error: paymentError } = await client
      .from(STUDENT_PAYMENTS_TABLE)
      .select('status')
      .eq('student_id', params.userId)
      .eq('class_id', session.class_id)
      .eq('payment_period', paymentPeriod)
      .single();

    const paymentStatus = payment?.status || 'pending';

    return success({
      isEnrolled: true,
      paymentStatus,
    });

  } catch (error) {
    logger.error('Error verifying student payment for session', {
      error: error instanceof Error ? error.message : String(error),
      params
    });
    return failure(new DatabaseError('Failed to verify payment status'));
  }
}

/**
 * Checks if student is already in another session (one-session policy)
 */
export async function getStudentEnrollmentStatus(
  client: Client,
  params: {
    userId: string;
    sessionId: string;
  }
): Promise<Result<string | null, DatabaseError>> {
  try {
    // Check if student is currently in any other session
    const { data: activeAttendance, error } = await client
      .from(STUDENT_SESSION_ATTENDANCE_TABLE)
      .select('session_id, join_status')
      .eq('student_id', params.userId)
      .eq('join_status', 'In Meeting')
      .neq('session_id', params.sessionId);

    if (error) {
      logger.error('Error checking student session status', { error, params });
      return failure(new DatabaseError('Failed to check session status'));
    }

    if (activeAttendance && activeAttendance.length > 0) {
      logger.warn('Student already in another session', {
        userId: params.userId,
        currentSessionId: params.sessionId,
        activeSessions: activeAttendance
      });
      return success('In Meeting');
    }

    return success(null);

  } catch (error) {
    logger.error('Error checking enrollment status', {
      error: error instanceof Error ? error.message : String(error),
      params
    });
    return failure(new DatabaseError('Failed to check enrollment status'));
  }
}

/**
 * Gets session details including Zoom meeting information
 */
export async function getSessionDetails(
  client: Client,
  sessionId: string
): Promise<Result<SessionDetailsData, DatabaseError>> {
  try {
    const { data: session, error } = await client
      .from(SESSIONS_TABLE)
      .select(`
        id,
        class_id,
        start_time,
        end_time,
        title,
        class:${CLASSES_TABLE}!class_id (
          id,
          name
        ),
        zoom_sessions:${ZOOM_SESSIONS_TABLE} (
          meeting_id
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      logger.error('Session not found', { sessionId, error });
      return failure(new DatabaseError('Session not found'));
    }

    // Ensure required fields are present
    if (!session.class_id || !session.start_time || !session.end_time) {
      logger.error('Session missing required fields', { sessionId, session });
      return failure(new DatabaseError('Session data incomplete'));
    }

    // Handle zoom_sessions array properly
    const zoomSessions = session.zoom_sessions as Array<{ meeting_id: string }> | null;
    const zoomMeetingId = zoomSessions && zoomSessions.length > 0 ? zoomSessions[0].meeting_id : null;

    // Handle class relation properly (it could be an array or object)
    const classData = Array.isArray(session.class) ? session.class[0] : session.class;

    return success({
      session_id: session.id,
      class_id: session.class_id,
      zoom_meeting_id: zoomMeetingId,
      start_time: session.start_time,
      end_time: session.end_time,
      class_name: classData?.name || 'Unknown Class',
      session_title: session.title || 'Untitled Session',
    });

  } catch (error) {
    logger.error('Error getting session details', {
      error: error instanceof Error ? error.message : String(error),
      sessionId
    });
    return failure(new DatabaseError('Failed to get session details'));
  }
}

/**
 * Verifies payment eligibility by email and meeting ID for session webhook processing
 */
export async function verifyStudentPaymentByEmailForSession(
  client: Client,
  params: {
    userEmail: string;
    meetingId: string;
  }
): Promise<Result<PaymentVerificationByEmailData, DatabaseError>> {
  try {
    // First, find the session associated with this meeting
    const { data: zoomSession, error: zoomError } = await client
      .from(ZOOM_SESSIONS_TABLE)
      .select(`
        session_id,
        sessions:${SESSIONS_TABLE} (
          id,
          class_id,
          start_time,
          title,
          class:${CLASSES_TABLE} (
            id,
            name
          )
        )
      `)
      .eq('meeting_id', params.meetingId)
      .single();

    if (zoomError || !zoomSession) {
      logger.error('Session not found for meeting ID', {
        meetingId: params.meetingId,
        error: zoomError
      });
      return success({
        isEligible: false,
        reason: 'Meeting not found'
      });
    }

    const session = zoomSession.sessions;
    if (!session || !session.class_id || !session.start_time) {
      return success({
        isEligible: false,
        reason: 'Session data incomplete'
      });
    }

    // Find the student by email
    const { data: user, error: userError } = await client
      .from('users')
      .select('id')
      .eq('email', params.userEmail)
      .eq('user_role', 'student')
      .single();

    if (userError || !user) {
      logger.error('Student not found by email', {
        email: params.userEmail,
        error: userError
      });
      return success({
        isEligible: false,
        reason: 'Student not found'
      });
    }

    // Check if student is enrolled in the class
    const { data: enrollment, error: enrollmentError } = await client
      .from(STUDENT_CLASS_ENROLLMENTS_TABLE)
      .select('*')
      .eq('student_id', user.id)
      .eq('class_id', session.class_id)
      .single();

    if (enrollmentError || !enrollment) {
      logger.info('Student not enrolled in class for session', {
        userId: user.id,
        classId: session.class_id,
        email: params.userEmail,
        sessionId: session.id
      });
      return success({
        isEligible: false,
        reason: 'Not enrolled in class'
      });
    }

    // Check payment status for the session month
    const sessionDate = new Date(session.start_time);
    const paymentPeriod = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}`;

    const { data: payment, error: paymentError } = await client
      .from(STUDENT_PAYMENTS_TABLE)
      .select('status')
      .eq('student_id', user.id)
      .eq('class_id', session.class_id)
      .eq('payment_period', paymentPeriod)
      .single();

    // Check if it's free first week
    const isFreeFirstWeek = isFirstWeekOfMonth(session.start_time);
    const paymentStatus = payment?.status || 'pending';
    const isPaymentValid = ['verified', 'paid'].includes(paymentStatus);

    if (isFreeFirstWeek || isPaymentValid) {
      return success({
        isEligible: true,
        reason: isFreeFirstWeek ? 'Free first week' : 'Payment verified'
      });
    }

    return success({
      isEligible: false,
      reason: `Payment ${paymentStatus}`
    });

  } catch (error) {
    logger.error('Error verifying student payment by email for session', {
      error: error instanceof Error ? error.message : String(error),
      params
    });
    return failure(new DatabaseError('Failed to verify payment by email'));
  }
}