import { SupabaseClient } from '@supabase/supabase-js';
import { Logger } from 'pino';
import { INVOICES_TABLE } from '~/lib/db-tables';
import { DatabaseError } from '~/lib/shared/errors';
import { failure, Result, success } from '~/lib/shared/result';
import { InvoiceInsert } from '~/lib/invoices/v2/types/invoice';

export async function createInvoices(
  supabaseClient: SupabaseClient,
  invoices: InvoiceInsert[],
  logger: Logger,
): Promise<Result<void, DatabaseError>> {
  try {
    if (invoices.length === 0) {
      return success(undefined);
    }

    const { error: insertError } = await supabaseClient
      .from(INVOICES_TABLE)
      .insert(invoices);

    if (insertError) {
      logger.error('Error inserting invoices.', { error: insertError });
      return failure(new DatabaseError('Error inserting invoices.'));
    }

    return success(undefined);
  } catch (error) {
    logger.error(
      'An unexpected error occurred while creating invoices.',
      error,
    );
    return failure(
      new DatabaseError('An unexpected error occurred while creating invoices.'),
    );
  }
}

export async function createSingleInvoice(
  supabaseClient: SupabaseClient,
  invoiceData: InvoiceInsert,
  logger: Logger
): Promise<Result<InvoiceInsert, DatabaseError>> {
  try {
    const { data: newInvoice, error: insertError } = await supabaseClient
      .from(INVOICES_TABLE)
      .insert(invoiceData)
      .select()
      .single();

    if (insertError) {
      logger.error('Error creating single invoice.', { error: insertError });
      return failure(new DatabaseError('Error creating single invoice.'));
    }

    return success(newInvoice);
  } catch (error) {
    logger.error('An unexpected error occurred while creating single invoice.', { error });
    return failure(new DatabaseError('An unexpected error occurred while creating single invoice.'));
  }
}
