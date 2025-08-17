import { SupabaseClient } from '@supabase/supabase-js';
import { Logger } from 'pino';
import { TUTOR_INVOICES_TABLE } from '~/lib/db-tables';
import { DatabaseError } from '~/lib/shared/errors';
import { failure, Result, success } from '~/lib/shared/result';
import { TutorInvoice } from '../types/tutor-invoice';

export async function createTutorInvoice(
    supabaseClient: SupabaseClient,
    invoiceData: Omit<TutorInvoice, 'id' | 'created_at'>,
    logger: Logger): Promise<Result<TutorInvoice, DatabaseError>> {
    try {
        const { data: newInvoice, error: insertError } = await supabaseClient
            .from(TUTOR_INVOICES_TABLE)
            .insert(invoiceData)
            .select()
            .single();

        if (insertError) {
            logger.error('Error creating tutor invoice.', { error: insertError });
            return failure(new DatabaseError('Error creating tutor invoice.'));
        }

        return success(newInvoice);
    } catch (error) {
        logger.error('An unexpected error occurred while creating tutor invoice.', { error });
        return failure(new DatabaseError('An unexpected error occurred while creating tutor invoice.'));
    }
}

export async function updateTutorInvoice(
    supabaseClient: SupabaseClient,
    invoiceId: string,
    amount: number,
    logger: Logger
): Promise<Result<void, DatabaseError>> {
    try {
        const { error } = await supabaseClient
            .from(TUTOR_INVOICES_TABLE)
            .update({ amount })
            .eq('id', invoiceId);

        if (error) {
            logger.error('Error updating tutor invoice.', { invoiceId, amount, error });
            return failure(new DatabaseError('Error updating tutor invoice.'));
        }

        return success(undefined);
    } catch (error) {
        logger.error('An unexpected error occurred while updating tutor invoice.', { error });
        return failure(new DatabaseError('An unexpected error occurred while updating tutor invoice.'));
    }
}

export async function createTutorInvoices(
    supabaseClient: SupabaseClient,
    invoices: Omit<TutorInvoice, 'id' | 'created_at'>[],
    logger: Logger,
): Promise<Result<void, DatabaseError>> {
    try {
        if (invoices.length === 0) {
            return success(undefined);
        }

        const { error: insertError } = await supabaseClient
            .from(TUTOR_INVOICES_TABLE)
            .insert(invoices);

        if (insertError) {
            logger.error('Error inserting tutor invoices.', { error: insertError });
            return failure(new DatabaseError('Error inserting tutor invoices.'));
        }

        return success(undefined);
    } catch (error) {
        logger.error('An unexpected error occurred while creating tutor invoices.', { error });
        return failure(new DatabaseError('An unexpected error occurred while creating tutor invoices.'));
    }
}
