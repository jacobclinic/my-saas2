import { SupabaseClient } from '@supabase/supabase-js';
import { Logger } from 'pino';
import { TUTOR_INVOICES_TABLE } from '~/lib/db-tables';
import { DatabaseError } from '~/lib/shared/errors';
import { failure, Result, success } from '~/lib/shared/result';
import { TutorInvoice } from '../types/tutor-invoice';

export async function getTutorInvoiceByDetails(
  supabaseClient: SupabaseClient,
  tutorId: string,
  classId: string,
  paymentPeriod: string,
  logger: Logger
): Promise<Result<TutorInvoice | null, DatabaseError>> {
  try {
    const { data: existingInvoice, error } = await supabaseClient
      .from(TUTOR_INVOICES_TABLE)
      .select('*')
      .eq('tutor_id', tutorId)
      .eq('class_id', classId)
      .eq('payment_period', paymentPeriod)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching existing tutor invoice.', { error });
      return failure(new DatabaseError('Error fetching existing tutor invoice.'));
    }

    return success(existingInvoice);
  } catch (error) {
    logger.error('An unexpected error occurred while fetching tutor invoice.', { error });
    return failure(new DatabaseError('An unexpected error occurred while fetching tutor invoice.'));
  }
}

export async function getTutorInvoicesByClassAndPeriod(
  supabaseClient: SupabaseClient,
  classId: string,
  paymentPeriod: string,
  logger: Logger
): Promise<Result<Pick<TutorInvoice, 'id' | 'tutor_id' | 'class_id'>[], DatabaseError>> {
  try {
    const { data: existingInvoices, error } = await supabaseClient
      .from(TUTOR_INVOICES_TABLE)
      .select('id, tutor_id, class_id')
      .eq('class_id', classId)
      .eq('payment_period', paymentPeriod);

    if (error) {
      logger.error('Error fetching existing tutor invoices.', { classId, paymentPeriod, error });
      return failure(new DatabaseError('Error fetching existing tutor invoices.'));
    }

    return success(existingInvoices || []);
  } catch (error) {
    logger.error('An unexpected error occurred while fetching tutor invoices.', { error });
    return failure(new DatabaseError('An unexpected error occurred while fetching tutor invoices.'));
  }
}
