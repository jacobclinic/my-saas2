import { SupabaseClient } from '@supabase/supabase-js';
import { Logger } from 'pino';
import { Database } from '~/database.types';
import { ZoomService } from '~/lib/zoom/v2/zoom.service';
import { failure, Result, success } from '~/lib/shared/result';
import { DatabaseError, ServiceError } from '~/lib/shared/errors';
import { ErrorCodes } from '~/lib/shared/error-codes';
import {
  verifyStudentPaymentForSession,
  getStudentEnrollmentStatus,
  getSessionDetails,
  verifyStudentPaymentByEmailForSession
} from '../database/session-join-queries';
import { isFirstWeekOfMonth } from '~/lib/utils/date-utils';
import { updateStudentSessionStatus } from '../database/session-mutations';

type Client = SupabaseClient<Database>;

export class StudentSessionService {
  private zoomService: ZoomService;

  constructor(
    private client: Client,
    private logger: Logger
  ) {
    this.zoomService = new ZoomService(client);
  }

  /**
   * Generates a secure, unique join URL for a student session at click-time
   * This performs just-in-time registration with Zoom API and all security checks
   */
  async generateSecureSessionJoinUrl(params: {
    userId: string;
    sessionId: string;
    userEmail: string;
    userFirstName: string;
    userLastName: string;
  }): Promise<Result<{ joinUrl: string }, ServiceError>> {
    try {
      this.logger.info('Starting secure session join URL generation', {
        userId: params.userId,
        sessionId: params.sessionId,
        userEmail: params.userEmail
      });

      // Step 1: Verify payment and enrollment for this specific session
      const paymentResult = await verifyStudentPaymentForSession(this.client, {
        userId: params.userId,
        sessionId: params.sessionId
      });

      if (!paymentResult.success) {
        this.logger.error('Failed to verify payment', { error: paymentResult.error });
        return failure(new ServiceError('Unable to verify enrollment status'));
      }

      const { isEnrolled, paymentStatus } = paymentResult.data;

      // Check if student is enrolled in the class
      if (!isEnrolled) {
        this.logger.warn('Student not enrolled in class for this session', {
          userId: params.userId,
          sessionId: params.sessionId
        });
        return failure(new ServiceError('You are not enrolled in this class'));
      }

      // Step 2: Get session details and check payment requirements
      this.logger.info(`Fetching session details for sessionId: ${params.sessionId}`);
      const sessionResult = await getSessionDetails(this.client, params.sessionId);

      if (!sessionResult.success) {
        this.logger.error(`Failed to get session details for ${params.sessionId}: ${sessionResult.error.message}`);
        return failure(new ServiceError('Session not found'));
      }

      const sessionDetails = sessionResult.data;
      this.logger.info(`Session details retrieved - SessionID: ${params.sessionId}, HasZoomMeetingID: ${!!sessionDetails.zoom_meeting_id}, ZoomMeetingID: ${sessionDetails.zoom_meeting_id || 'NULL'}`);
      const sessionDate = new Date(sessionDetails.start_time);
      const isFreeFirstWeek = isFirstWeekOfMonth(sessionDate.toISOString().split('T')[0]);

      // Check if payment is required
      const paymentRequired = !isFreeFirstWeek && ['pending', 'rejected', 'not_paid'].includes(paymentStatus);

      if (paymentRequired) {
        this.logger.warn('Payment required for session access', {
          userId: params.userId,
          sessionId: params.sessionId,
          paymentStatus,
          isFreeFirstWeek
        });
        return failure(new ServiceError('Payment required to join this session'));
      }

      // Step 3: Check one-session policy (is student already in another session?)
      const enrollmentStatusResult = await getStudentEnrollmentStatus(this.client, {
        userId: params.userId,
        sessionId: params.sessionId
      });

      if (!enrollmentStatusResult.success) {
        this.logger.error('Failed to check student enrollment status', {
          error: enrollmentStatusResult.error,
          userId: params.userId,
          sessionId: params.sessionId
        });
        return failure(new ServiceError('Unable to verify session status'));
      }

      if (enrollmentStatusResult.data === 'In Meeting') {
        this.logger.warn('Student already in a session from another device', {
          userId: params.userId,
          sessionId: params.sessionId
        });
        return failure(new ServiceError('You are already in a session from another device'));
      }

      // Step 4: Verify Zoom meeting exists
      this.logger.info(`Zoom meeting check - SessionID: ${params.sessionId}, MeetingID: ${sessionDetails.zoom_meeting_id || 'NULL'}`);

      if (!sessionDetails.zoom_meeting_id) {
        this.logger.error(`No Zoom meeting found for session ${params.sessionId} - zoom_meeting_id is ${sessionDetails.zoom_meeting_id}`);
        return failure(new ServiceError('Meeting not available yet. Please try again later.'));
      }

      // Step 5: Smart registration with Zoom (checks existing registrations first)
      this.logger.info('Registering participant with Zoom for session using improved batch approach', {
        meetingId: sessionDetails.zoom_meeting_id,
        participantEmail: params.userEmail,
        sessionId: params.sessionId
      });

      // Import the enhanced zoom service that has batch registration
      const { zoomService } = await import('~/lib/zoom/zoom.service');
      const registrationResult = await zoomService.joinMeetingAsStudent(
        sessionDetails.zoom_meeting_id,
        {
          email: params.userEmail,
          first_name: params.userFirstName,
          last_name: params.userLastName,
        }
      );

      this.logger.info('Zoom registration successful for session', {
        meetingId: sessionDetails.zoom_meeting_id,
        participantEmail: params.userEmail,
        sessionId: params.sessionId,
        joinUrl: registrationResult.join_url ? 'generated' : 'not_generated'
      });

      return success({ joinUrl: registrationResult.join_url });

    } catch (error) {
      this.logger.error('Unexpected error generating session join URL', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        params
      });
      return failure(new ServiceError('Unable to generate join link. Please try again.'));
    }
  }

  /**
   * Processes Zoom webhook events for automated session waiting room management
   */
  async processSessionWebhookEvent(event: string, payload: any): Promise<Result<boolean, ServiceError>> {
    try {
      const meetingId = payload.object?.id?.toString();
      const participant = payload.object?.participant;
      const userEmail = participant?.email?.toString();
      const registrantId = participant?.registrant_id?.toString();

      if (!meetingId || !participant || !userEmail) {
        this.logger.warn('Missing required data in session webhook payload', {
          event,
          meetingId,
          hasParticipant: !!participant,
          userEmail,
          registrantId: registrantId || 'Missing'
        });
        return success(true); // Not an error, just incomplete data
      }

      this.logger.info('Processing session webhook event', {
        event,
        meetingId,
        userEmail,
        registrantId: registrantId || 'Not provided',
        participantName: participant.user_name,
        joinTime: participant.join_time || participant.leave_time
      });

      switch (event) {
        case 'meeting.participant_joined_waiting_room':
          return await this.handleSessionWaitingRoomJoin(meetingId, userEmail, registrantId, participant);

        case 'meeting.participant_joined':
          return await this.handleSessionParticipantJoined(meetingId, userEmail, participant);

        case 'meeting.participant_left':
          return await this.handleSessionParticipantLeft(meetingId, userEmail, participant);

        default:
          this.logger.warn('Unhandled session webhook event', { event, meetingId });
          return success(true);
      }

    } catch (error) {
      this.logger.error('Failed to process session webhook event', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        event,
        payload
      });
      return failure(new ServiceError('Session webhook processing failed'));
    }
  }

  /**
   * Handles when a participant joins the waiting room for a session
   */
  private async handleSessionWaitingRoomJoin(
    meetingId: string,
    userEmail: string,
    registrantId: string | undefined,
    participant: any
  ): Promise<Result<boolean, ServiceError>> {
    try {
      this.logger.info('Participant joined session waiting room', {
        meetingId,
        userEmail,
        participantName: participant.user_name
      });

      // Update session attendance status
      const statusResult = await updateStudentSessionStatus(this.client, {
        email: userEmail,
        meetingId,
        status: 'In Waiting Room'
      });

      // Step 1: Check one-session policy - is student already in another session?
      // First, find the current session and student
      const { data: zoomSession, error: zoomError } = await this.client
        .from('zoom_sessions')
        .select('session_id')
        .eq('meeting_id', meetingId)
        .single();

      if (zoomError || !zoomSession) {
        this.logger.error('Session not found for meeting ID during webhook', {
          meetingId,
          error: zoomError
        });
        return success(true); // Don't fail webhook
      }

      const { data: user, error: userError } = await this.client
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .eq('user_role', 'student')
        .single();

      if (userError || !user) {
        // Return failure to make error visible in webhook logs
        this.logger.error(`Student lookup failed during webhook: ${userError?.message || 'No user found'} for email: ${userEmail}`);
        return failure(new ServiceError(`Student lookup failed: ${userError?.message || 'No user found'} for email: ${userEmail}`));
      }

      // Check if student is already in another session
      const enrollmentStatusResult = await getStudentEnrollmentStatus(this.client, {
        userId: user.id,
        sessionId: zoomSession.session_id
      });

      if (!enrollmentStatusResult.success) {
        this.logger.error('Failed to check student enrollment status during webhook', {
          error: enrollmentStatusResult.error,
          userId: user.id,
          sessionId: zoomSession.session_id,
          userEmail,
          meetingId
        });
        return success(true); // Don't fail webhook, but log the error
      }

      if (enrollmentStatusResult.data === 'In Meeting') {
        this.logger.warn('Student already in another session - denying waiting room access', {
          userId: user.id,
          currentSessionId: zoomSession.session_id,
          userEmail,
          meetingId
        });

        // Deny access and remove from waiting room
        await this.zoomService.updateRegistrantStatus(meetingId, {
          action: 'deny',
          registrants: registrantId
            ? [{ id: registrantId }]
            : [{ email: userEmail }] // fallback to email if no registrant_id
        });

        return success(true); // Don't fail webhook
      }

      // Step 2: Verify payment status by email for this session
      const paymentResult = await verifyStudentPaymentByEmailForSession(this.client, {
        userEmail,
        meetingId
      });

      if (!paymentResult.success) {
        this.logger.error('Failed to verify payment status for session', {
          error: paymentResult.error.message,
          userEmail,
          meetingId
        });
        return success(true); // Don't fail the webhook, just don't approve
      }

      const { isEligible, reason } = paymentResult.data;

      if (isEligible) {
        // Automatically approve the student from waiting room
        this.logger.info('Auto-approving student from session waiting room', {
          userEmail,
          meetingId,
          reason: 'Payment verified for session'
        });

        await this.zoomService.updateRegistrantStatus(meetingId, {
          action: 'approve',
          registrants: registrantId
            ? [{ id: registrantId }]
            : [{ email: userEmail }] // fallback to email if no registrant_id
        });

        this.logger.info('Student auto-approved from session waiting room', {
          userEmail,
          meetingId,
          approved: true
        });

        return success(true);
      } else {
        this.logger.info('Student not approved from session waiting room', {
          userEmail,
          meetingId,
          reason,
          approved: false
        });

        return success(true); // Student stays in waiting room
      }

    } catch (error) {
      this.logger.error('Error handling session waiting room join', {
        error: error instanceof Error ? error.message : String(error),
        userEmail,
        meetingId
      });
      return failure(new ServiceError('Failed to process session waiting room join'));
    }
  }

  /**
   * Handles when a participant successfully joins the session
   */
  private async handleSessionParticipantJoined(
    meetingId: string,
    userEmail: string,
    participant: any
  ): Promise<Result<boolean, ServiceError>> {
    try {
      this.logger.info('Participant joined session', {
        meetingId,
        userEmail,
        participantName: participant.user_name,
        joinTime: participant.join_time
      });

      // Update student session status to 'In Meeting'
      const statusResult = await updateStudentSessionStatus(this.client, {
        email: userEmail,
        meetingId,
        status: 'In Meeting'
      });

      if (!statusResult.success) {
        this.logger.error('Failed to update student session status to In Meeting', {
          error: statusResult.error.message,
          userEmail,
          meetingId
        });
      }

      return success(true);

    } catch (error) {
      this.logger.error('Error handling session participant joined', {
        error: error instanceof Error ? error.message : String(error),
        userEmail,
        meetingId
      });
      return failure(new ServiceError('Failed to process session participant join'));
    }
  }

  /**
   * Handles when a participant leaves the session
   */
  private async handleSessionParticipantLeft(
    meetingId: string,
    userEmail: string,
    participant: any
  ): Promise<Result<boolean, ServiceError>> {
    try {
      this.logger.info('Participant left session', {
        meetingId,
        userEmail,
        participantName: participant.user_name,
        leaveTime: participant.leave_time
      });

      // Update student session status to 'Left Meeting'
      const statusResult = await updateStudentSessionStatus(this.client, {
        email: userEmail,
        meetingId,
        status: 'Left Meeting'
      });

      if (!statusResult.success) {
        this.logger.error('Failed to update student session status to Left Meeting', {
          error: statusResult.error.message,
          userEmail,
          meetingId
        });
      }

      return success(true);

    } catch (error) {
      this.logger.error('Error handling session participant left', {
        error: error instanceof Error ? error.message : String(error),
        userEmail,
        meetingId
      });
      return failure(new ServiceError('Failed to process session participant leave'));
    }
  }
}