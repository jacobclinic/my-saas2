import { SupabaseClient } from '@supabase/supabase-js';
import { Logger } from 'pino';
import {
  CLASSES_TABLE,
  STUDENT_CLASS_ENROLLMENTS_TABLE,
} from '~/lib/db-tables';
import { DatabaseError } from '~/lib/shared/errors';
import { failure, Result, success } from '~/lib/shared/result';
import { EnrollmentWithClass } from '~/lib/class-enrollments/types/enrollment';

export async function getAllEnrollmentsWithClass(
  supabaseClient: SupabaseClient,
  logger: Logger
): Promise<Result<EnrollmentWithClass[], DatabaseError>> {
  try {
    const { data: enrollments, error: enrollError } = await supabaseClient
      .from(STUDENT_CLASS_ENROLLMENTS_TABLE)
      .select(
        `
        student_id,
        class_id,
        class:${CLASSES_TABLE}!class_id (
          fee,
          name
        )
      `
      )
      .returns<EnrollmentWithClass[]>();

    if (enrollError) {
      logger.error('Error fetching enrollments with class details.', {
        error: enrollError,
      });
      return failure(
        new DatabaseError('Error fetching enrollments with class details.')
      );
    }

    if (!enrollments) {
      return success([]);
    }

    return success(enrollments);
  } catch (error) {
    logger.error(
      'An unexpected error occurred while fetching enrollments.',
      error
    );
    return failure(
      new DatabaseError('An unexpected error occurred while fetching enrollments.')
    );
  }
}
