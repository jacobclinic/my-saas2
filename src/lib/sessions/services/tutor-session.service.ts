import { SupabaseClient } from '@supabase/supabase-js';
import { Logger } from 'pino';
import { Database } from '~/database.types';
import { failure, Result, success } from '~/lib/shared/result';
import { ServiceError } from '~/lib/shared/errors';
import { getSessionDetails } from '../database/session-join-queries';

type Client = SupabaseClient<Database>;

export class TutorSessionService {
  constructor(
    private client: Client,
    private logger: Logger
  ) {}

  /**
   * Generates a direct start URL for tutors to host their sessions
   * This bypasses registration since tutors are the meeting hosts
   */
  async generateTutorSessionStartUrl(params: {
    userId: string;
    sessionId: string;
  }): Promise<Result<{ startUrl: string }, ServiceError>> {
    try {
      this.logger.info('Starting tutor session start URL generation', {
        userId: params.userId,
        sessionId: params.sessionId
      });

      // Step 1: Get session details and verify tutor ownership
      const sessionResult = await getSessionDetails(this.client, params.sessionId);
      if (!sessionResult.success) {
        this.logger.error('Failed to get session details for tutor', { error: sessionResult.error });
        return failure(new ServiceError('Session not found'));
      }

      const sessionDetails = sessionResult.data;

      // Step 2: Verify Zoom meeting exists
      if (!sessionDetails.zoom_meeting_id) {
        this.logger.error('No Zoom meeting found for tutor session', {
          sessionId: params.sessionId,
          sessionDetails
        });
        return failure(new ServiceError('Meeting not available yet. Please try again later.'));
      }

      // Step 3: Verify user is the tutor for this session
      const { data: session, error: verifyError } = await this.client
        .from('sessions')
        .select(`
          id,
          class:classes!class_id (
            tutor_id
          )
        `)
        .eq('id', params.sessionId)
        .single();

      if (verifyError || !session) {
        this.logger.error('Failed to verify session ownership', { error: verifyError });
        return failure(new ServiceError('Unable to verify session access'));
      }

      const classData = Array.isArray(session.class) ? session.class[0] : session.class;
      if (!classData || classData.tutor_id !== params.userId) {
        this.logger.warn('User is not the tutor for this session', {
          userId: params.userId,
          sessionId: params.sessionId,
          tutorId: classData?.tutor_id
        });
        return failure(new ServiceError('You are not authorized to start this session'));
      }

      // Step 4: Get the start_url from zoom_sessions table
      const { data: zoomSession, error: zoomError } = await this.client
        .from('zoom_sessions')
        .select('start_url')
        .eq('meeting_id', sessionDetails.zoom_meeting_id)
        .single();

      if (zoomError || !zoomSession) {
        this.logger.error('Failed to get Zoom session start URL', {
          error: zoomError,
          meetingId: sessionDetails.zoom_meeting_id
        });
        return failure(new ServiceError('Unable to get meeting start URL'));
      }

      this.logger.info('Successfully generated tutor start URL', {
        userId: params.userId,
        sessionId: params.sessionId,
        meetingId: sessionDetails.zoom_meeting_id
      });

      return success({ startUrl: zoomSession.start_url });

    } catch (error) {
      this.logger.error('Unexpected error generating tutor session start URL', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        params
      });
      return failure(new ServiceError('Unable to generate start link. Please try again.'));
    }
  }
}