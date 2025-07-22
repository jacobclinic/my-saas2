import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/database.types';
import {
  STUDENT_PAYMENTS_TABLE,
  INVOICES_TABLE,
  TUTOR_INVOICES_TABLE,
} from '~/lib/db-tables';
import { PaymentStatus } from '~/lib/payments/types/admin-payments';

type Client = SupabaseClient<Database>;

/**
 * @description Approve a student payment
 * @param client - Supabase client instance
 * @param paymentId - ID of the payment to approve
 */
export async function approveStudentPayment(
  client: Client,
  paymentId: string,
): Promise<boolean> {
  try {
    // Update payment status to verified
    const { error } = await client
      .from(STUDENT_PAYMENTS_TABLE)
      .update({
        status: PaymentStatus.VERIFIED,
        verified_date: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .throwOnError();

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error approving payment:', error);
    throw new Error('Failed to approve payment. Please try again.');
  }
}

/**
 * @description Reject a student payment with a reason
 * @param client - Supabase client instance
 * @param paymentId - ID of the payment to reject
 * @param reason - Reason for rejection
 */
export async function rejectStudentPayment(
  client: Client,
  paymentId: string,
  reason: string,
): Promise<boolean> {
  try {
    // Validate input
    if (!reason.trim()) {
      throw new Error('Please provide a reason for the rejection');
    }

    // Update payment status to rejected with reason
    const { error } = await client
      .from(STUDENT_PAYMENTS_TABLE)
      .update({
        status: PaymentStatus.REJECTED,
        notes: reason,
        rejected_date: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .throwOnError();

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error rejecting payment:', error);
    throw error;
  }
}

/**
 * @description Approve a student payment by invoice ID
 * @param client - Supabase client instance
 * @param invoiceId - ID of the invoice to approve payment for
 */
export async function approveStudentPaymentByInvoice(
  client: Client,
  invoiceId: string,
): Promise<{ success: boolean; error?: any }> {
  try {
    // Get invoice details
    const { data: invoice, error: invoiceError } = await client
      .from(INVOICES_TABLE)
      .select('id, student_id, class_id, invoice_period, amount')
      .eq('id', invoiceId)
      .single();

    if (invoiceError) throw invoiceError;

    // Check if payment exists
    const { data: payment, error: paymentError } = await client
      .from(STUDENT_PAYMENTS_TABLE)
      .select('id')
      .eq('invoice_id', invoiceId)
      .single();

    if (paymentError && paymentError.code !== 'PGRST116') {
      throw paymentError;
    }

    if (payment) {
      // Update existing payment
      const { error } = await client
        .from(STUDENT_PAYMENTS_TABLE)
        .update({
          status: 'verified',
          verified_date: new Date().toISOString(),
          rejected_date: null,
          payment_date: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (error) throw error;
    } else {
      // Create new payment
      const { error } = await client.from(STUDENT_PAYMENTS_TABLE).insert({
        invoice_id: invoice.id,
        student_id: invoice.student_id,
        class_id: invoice.class_id,
        payment_period: invoice.invoice_period,
        amount: invoice.amount,
        status: 'verified',
        verified_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        payment_date: new Date().toISOString(),
      });

      if (error) throw error;
    }

    // Update invoice status
    const { error: invoiceUpdateError } = await client
      .from(INVOICES_TABLE)
      .update({ status: 'paid' })
      .eq('id', invoiceId);

    if (invoiceUpdateError) throw invoiceUpdateError;

    return { success: true };
  } catch (error) {
    console.error('Error approving payment:', error);
    return { success: false, error: error };
  }
}

/**
 * @description Reject a student payment by invoice ID
 * @param client - Supabase client instance
 * @param invoiceId - ID of the invoice to reject payment for
 * @param reason - Reason for rejection
 */
export async function rejectStudentPaymentByInvoice(
  client: Client,
  invoiceId: string,
  reason: string,
): Promise<{ success: boolean; error?: any }> {
  try {
    // Get invoice details
    const { data: invoice, error: invoiceError } = await client
      .from(INVOICES_TABLE)
      .select('id, student_id, class_id, invoice_period, amount')
      .eq('id', invoiceId)
      .single();

    if (invoiceError) throw invoiceError;

    // Check if payment exists
    const { data: payment, error: paymentError } = await client
      .from(STUDENT_PAYMENTS_TABLE)
      .select('id')
      .eq('invoice_id', invoiceId)
      .single();

    if (paymentError && paymentError.code !== 'PGRST116') {
      throw paymentError;
    }

    if (payment) {
      // Update existing payment
      const { error } = await client
        .from(STUDENT_PAYMENTS_TABLE)
        .update({
          status: 'rejected',
          rejected_date: new Date().toISOString(),
          verified_date: null,
          notes: reason,
          payment_date: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (error) throw error;
    } else {
      // Create new payment
      const { error } = await client.from(STUDENT_PAYMENTS_TABLE).insert({
        invoice_id: invoice.id,
        student_id: invoice.student_id,
        class_id: invoice.class_id,
        payment_period: invoice.invoice_period,
        amount: invoice.amount,
        status: 'rejected',
        rejected_date: new Date().toISOString(),
        notes: reason,
        created_at: new Date().toISOString(),
        payment_date: new Date().toISOString(),
      });

      if (error) throw error;
    }

    // Update invoice status
    const { error: invoiceUpdateError } = await client
      .from(INVOICES_TABLE)
      .update({ status: 'issued' })
      .eq('id', invoiceId);

    if (invoiceUpdateError) throw invoiceUpdateError;

    return { success: true };
  } catch (error) {
    console.error('Error rejecting payment:', error);
    return { success: false, error: error };
  }
}

/**
 * @description Mark tutor invoice as paid
 * @param client - Supabase client instance
 * @param invoiceId - ID of the tutor invoice to mark as paid
 */
export async function markTutorInvoiceAsPaid(
  client: Client,
  invoiceId: string,
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await client
      .from(TUTOR_INVOICES_TABLE)
      .update({ status: 'paid' })
      .eq('id', invoiceId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error marking tutor invoice as paid:', error);
    return { success: false, error: error };
  }
}

/**
 * @description Mark tutor invoice as issued
 * @param client - Supabase client instance
 * @param invoiceId - ID of the tutor invoice to mark as issued
 */
export async function markTutorInvoiceAsIssued(
  client: Client,
  invoiceId: string,
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error } = await client
      .from(TUTOR_INVOICES_TABLE)
      .update({ status: 'issued' })
      .eq('id', invoiceId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error marking tutor invoice as issued:', error);
    return { success: false, error: error };
  }
}
