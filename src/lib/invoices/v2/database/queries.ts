import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';
import { INVOICES_TABLE } from '~/lib/db-tables';
import { Result, success, failure } from '~/lib/shared/result';
import { AppError } from '~/lib/shared/errors';
import { ErrorCodes } from '~/lib/shared/error-codes';
import { Logger } from 'pino';
import { Invoice } from '../types/invoice';
import { DatabaseError } from '~/lib/shared/errors';

export async function getInvoiceByStudentClassAndPeriod(
    client: SupabaseClient<Database>,
    logger: Logger,
    studentId: string,
    classId: string,
    paymentPeriod: string
): Promise<Result<Invoice, AppError>> {
    try {
        const { data, error } = await client
            .from(INVOICES_TABLE)
            .select('*')
            .eq('student_id', studentId)
            .eq('class_id', classId)
            .eq('invoice_period', paymentPeriod)
            .maybeSingle();

        if (error) {
            logger.error(`Error fetching invoice for student ${studentId} in class ${classId}: ${error.message}`);
            return failure(new AppError(error.message, ErrorCodes.DATABASE_ERROR));
        }

        if (!data) {
            return failure(new AppError("Invoice not found", ErrorCodes.NO_RECORDS_FOUND));
        }

        return success(data);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Unexpected error fetching invoice for student ${studentId} in class ${classId}: ${errorMessage}`);
        return failure(new AppError("An unexpected error occurred while fetching the invoice.", ErrorCodes.INTERNAL_SERVER_ERROR));
    }
}

export async function getInvoicesByPeriod(
  supabaseClient: SupabaseClient,
  invoicePeriod: string,
  logger: Logger,
): Promise<Result<Pick<Invoice, 'id' | 'student_id' | 'class_id' | 'invoice_period'>[], DatabaseError>> {
  try {
    const { data: existingInvoices, error } = await supabaseClient
      .from(INVOICES_TABLE)
      .select('id, student_id, class_id, invoice_period')
      .eq('invoice_period', invoicePeriod);

    if (error) {
      logger.error('Error fetching existing invoices for period.', {
        invoicePeriod: invoicePeriod,
        error: error,
      });
      return failure(
        new DatabaseError('Error fetching existing invoices for period.'),
      );
    }

    return success(existingInvoices || []);
  } catch (error) {
    logger.error(
      'An unexpected error occurred while fetching invoices by period.',
      { error },
    );
    return failure(
      new DatabaseError(
        'An unexpected error occurred while fetching invoices by period.',
      ),
    );
  }
}

export async function getInvoiceByDetails(
  supabaseClient: SupabaseClient,
  studentId: string,
  classId: string,
  invoicePeriod: string,
  logger: Logger
): Promise<Result<Invoice | null, DatabaseError>> {
  try {
    const { data: existingInvoice, error } = await supabaseClient
      .from(INVOICES_TABLE)
      .select('*')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .eq('invoice_period', invoicePeriod)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching existing invoice by details.', { error });
      return failure(new DatabaseError('Error fetching existing invoice by details.'));
    }

    return success(existingInvoice);
  } catch (error) {
    logger.error('An unexpected error occurred while fetching invoice by details.', { error });
    return failure(new DatabaseError('An unexpected error occurred while fetching invoice by details.'));
  }
}