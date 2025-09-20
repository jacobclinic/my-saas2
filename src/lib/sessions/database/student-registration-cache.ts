import { SupabaseClient } from '@supabase/supabase-js';
import { Logger } from 'pino';
import { Database } from '~/database.types';
import { failure, Result, success } from '~/lib/shared/result';
import { DatabaseError } from '~/lib/shared/errors';

type Client = SupabaseClient<Database>;

export interface StudentRegistrationData {
  student_id: string;
  session_id: string;
  meeting_id: string;
  registrant_id: string;
  join_url: string;
  registrant_status?: 'approved' | 'pending' | 'denied';
}

export interface CachedRegistration {
  id: string;
  student_id: string;
  session_id: string;
  meeting_id: string;
  registrant_id: string;
  join_url: string;
  registrant_status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Store a student's Zoom registration in the cache
 */
export async function storeCachedRegistration(
  client: Client,
  logger: Logger,
  data: StudentRegistrationData
): Promise<Result<CachedRegistration, DatabaseError>> {
  try {
    const { data: registration, error } = await client
      .from('student_zoom_registrations')
      .upsert({
        student_id: data.student_id,
        session_id: data.session_id,
        meeting_id: data.meeting_id,
        registrant_id: data.registrant_id,
        join_url: data.join_url,
        registrant_status: data.registrant_status || 'approved'
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to store cached registration', {
        error: error.message,
        studentId: data.student_id,
        sessionId: data.session_id
      });
      return failure(new DatabaseError('Failed to store registration in cache'));
    }

    logger.info('Stored registration in cache', {
      registrationId: registration.id,
      studentId: data.student_id,
      sessionId: data.session_id,
      registrantId: data.registrant_id
    });

    return success(registration);

  } catch (error) {
    logger.error('Error storing cached registration', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      studentId: data.student_id,
      sessionId: data.session_id
    });
    return failure(new DatabaseError('Failed to store registration in cache'));
  }
}

/**
 * Get a student's cached registration for a session
 */
export async function getCachedStudentRegistration(
  client: Client,
  logger: Logger,
  studentId: string,
  sessionId: string
): Promise<Result<CachedRegistration | null, DatabaseError>> {
  try {
    const { data: registration, error } = await client
      .from('student_zoom_registrations')
      .select('*')
      .eq('student_id', studentId)
      .eq('session_id', sessionId)
      .single();

    if (error) {
      // PGRST116 means no rows found, which is not an error in this case
      if (error.code === 'PGRST116') {
        logger.info('No cached registration found', {
          studentId,
          sessionId
        });
        return success(null);
      }

      logger.error('Failed to get cached registration', {
        error: error.message,
        studentId,
        sessionId
      });
      return failure(new DatabaseError('Failed to get cached registration'));
    }

    logger.info('Retrieved cached registration', {
      registrationId: registration.id,
      studentId,
      sessionId,
      registrantId: registration.registrant_id
    });

    return success(registration);

  } catch (error) {
    logger.error('Error getting cached registration', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      studentId,
      sessionId
    });
    return failure(new DatabaseError('Failed to get cached registration'));
  }
}

/**
 * Update a cached registration with new data
 */
export async function updateCachedRegistration(
  client: Client,
  logger: Logger,
  registrationId: string,
  updates: Partial<Pick<StudentRegistrationData, 'join_url' | 'registrant_status'>>
): Promise<Result<CachedRegistration, DatabaseError>> {
  try {
    const { data: registration, error } = await client
      .from('student_zoom_registrations')
      .update(updates)
      .eq('id', registrationId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update cached registration', {
        error: error.message,
        registrationId,
        updates
      });
      return failure(new DatabaseError('Failed to update cached registration'));
    }

    logger.info('Updated cached registration', {
      registrationId,
      updates
    });

    return success(registration);

  } catch (error) {
    logger.error('Error updating cached registration', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      registrationId,
      updates
    });
    return failure(new DatabaseError('Failed to update cached registration'));
  }
}

/**
 * Get the fallback join URL from zoom_sessions table
 */
export async function getSessionFallbackUrl(
  client: Client,
  logger: Logger,
  sessionId: string
): Promise<Result<string | null, DatabaseError>> {
  try {
    const { data: zoomSession, error } = await client
      .from('zoom_sessions')
      .select('join_url')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        logger.warn('No zoom session found for fallback URL', {
          sessionId
        });
        return success(null);
      }

      logger.error('Failed to get fallback join URL', {
        error: error.message,
        sessionId
      });
      return failure(new DatabaseError('Failed to get fallback join URL'));
    }

    logger.info('Retrieved fallback join URL', {
      sessionId,
      hasJoinUrl: !!zoomSession.join_url
    });

    return success(zoomSession.join_url);

  } catch (error) {
    logger.error('Error getting fallback join URL', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      sessionId
    });
    return failure(new DatabaseError('Failed to get fallback join URL'));
  }
}

/**
 * Clean up old cached registrations (for maintenance)
 */
export async function cleanupExpiredRegistrations(
  client: Client,
  logger: Logger,
  olderThanDays: number = 30
): Promise<Result<number, DatabaseError>> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { error, count } = await client
      .from('student_zoom_registrations')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      logger.error('Failed to cleanup expired registrations', {
        error: error.message,
        cutoffDate: cutoffDate.toISOString()
      });
      return failure(new DatabaseError('Failed to cleanup expired registrations'));
    }

    logger.info('Cleaned up expired registrations', {
      deletedCount: count || 0,
      cutoffDate: cutoffDate.toISOString()
    });

    return success(count || 0);

  } catch (error) {
    logger.error('Error cleaning up expired registrations', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      olderThanDays
    });
    return failure(new DatabaseError('Failed to cleanup expired registrations'));
  }
}