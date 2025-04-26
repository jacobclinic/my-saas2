'use server';

import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { PaymentStatus } from '~/lib/payments/types/admin-payments';
import { generateMonthlyInvoices } from '../invoices/database/mutations';

export const approveStudentPaymentAction = withSession(
  async ({
    paymentId,
    csrfToken,
  }: {
    paymentId: string;
    csrfToken: string;
  }) => {
    const client = getSupabaseServerActionClient();

    try {
      // Get invoice details
      const { data: invoice, error: invoiceError } = await client
        .from('invoices')
        .select('id, student_id, class_id, invoice_period, amount')
        .eq('id', paymentId)
        .single();

      if (invoiceError) throw invoiceError;

      // Check if payment exists
      const { data: payment, error: paymentError } = await client
        .from('student_payments')
        .select('id')
        .eq('invoice_id', paymentId)
        .single();

      if (paymentError && paymentError.code !== 'PGRST116') {
        throw paymentError;
      }

      if (payment) {
        // Update existing payment
        const { error } = await client
          .from('student_payments')
          .update({
            status: 'verified',
            verified_date: new Date().toISOString(),
            rejected_date: null,
            payment_date: new Date().toISOString(), // Using payment_date instead of updated_at
          })
          .eq('id', payment.id);

        if (error) throw error;
      } else {
        // Create new payment
        const { error } = await client.from('student_payments').insert({
          invoice_id: invoice.id,
          student_id: invoice.student_id,
          class_id: invoice.class_id,
          payment_period: invoice.invoice_period,
          amount: invoice.amount,
          status: 'verified',
          verified_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          payment_date: new Date().toISOString(), // Using payment_date instead of updated_at
        });

        if (error) throw error;
      }

      // Update invoice status
      const { error: invoiceUpdateError } = await client
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', paymentId);

      if (invoiceUpdateError) throw invoiceUpdateError;

      return { success: true };
    } catch (error) {
      console.error('Error approving payment:', error);
      return { success: false, error: error };
    }
  },
);

export const rejectStudentPaymentAction = withSession(
  async ({
    paymentId,
    reason,
    csrfToken,
  }: {
    paymentId: string;
    reason: string;
    csrfToken: string;
  }) => {
    const client = getSupabaseServerActionClient();

    try {
      // Get invoice details
      const { data: invoice, error: invoiceError } = await client
        .from('invoices')
        .select('id, student_id, class_id, invoice_period, amount')
        .eq('id', paymentId)
        .single();

      if (invoiceError) throw invoiceError;

      // Check if payment exists
      const { data: payment, error: paymentError } = await client
        .from('student_payments')
        .select('id')
        .eq('invoice_id', paymentId)
        .single();

      if (paymentError && paymentError.code !== 'PGRST116') {
        throw paymentError;
      }

      if (payment) {
        // Update existing payment
        const { error } = await client
          .from('student_payments')
          .update({
            status: 'rejected',
            rejected_date: new Date().toISOString(),
            verified_date: null,
            notes: reason,
            payment_date: new Date().toISOString(), // Using payment_date instead of updated_at
          })
          .eq('id', payment.id);

        if (error) throw error;
      } else {
        // Create new payment
        const { error } = await client.from('student_payments').insert({
          invoice_id: invoice.id,
          student_id: invoice.student_id,
          class_id: invoice.class_id,
          payment_period: invoice.invoice_period,
          amount: invoice.amount,
          status: 'rejected',
          rejected_date: new Date().toISOString(),
          notes: reason,
          created_at: new Date().toISOString(),
          payment_date: new Date().toISOString(), // Using payment_date instead of updated_at
        });

        if (error) throw error;
      }

      // Update invoice status
      const { error: invoiceUpdateError } = await client
        .from('invoices')
        .update({ status: 'issued' })
        .eq('id', paymentId);

      if (invoiceUpdateError) throw invoiceUpdateError;

      return { success: true };
    } catch (error) {
      console.error('Error rejecting payment:', error);
      return { success: false, error: error };
    }
  },
);

// Other actions unchanged...

export const getPaymentSummaryAction = withSession(
  async ({
    csrfToken,
    invoicePeriod,
  }: {
    csrfToken: string;
    invoicePeriod?: string;
  }) => {
    const client = getSupabaseServerActionClient();

    try {
      // Generate invoices if period is provided
      if (invoicePeriod) {
        const [year, month] = invoicePeriod.split('-').map(Number);
        await generateMonthlyInvoices(client, year, month);
      }

      // Fetch all invoices with payment status
      const { data: invoices, error: invoiceError } = await client
        .from('invoices')
        .select(
          `
          id,
          amount,
          invoice_period,
          payment:student_payments!fk_student_payments_invoice_id (
            status,
            amount
          )
        `,
        )
        .eq('invoice_period', invoicePeriod ?? '');

      if (invoiceError) throw invoiceError;

      // Initialize summary
      const summary = {
        total: 0,
        pending: 0,
        pendingVerification: 0,
        verified: 0,
        rejected: 0,
        notPaid: 0,
        totalVerifiedAmount: 0,
        totalAmount: 0,
      };

      // Aggregate data
      for (const invoice of invoices) {
        const payment = Array.isArray(invoice.payment)
          ? invoice.payment[0]
          : invoice.payment;
        const invoiceAmount = invoice.amount || 0;
        summary.total += 1;
        summary.totalAmount += invoiceAmount;

        if (!payment || !payment.status) {
          summary.notPaid += 1;
        } else {
          switch (payment.status) {
            case PaymentStatus.PENDING:
              summary.pending += 1;
              break;
            case PaymentStatus.PENDING_VERIFICATION:
              summary.pendingVerification += 1;
              break;
            case PaymentStatus.VERIFIED:
              summary.verified += 1;
              summary.totalVerifiedAmount += invoiceAmount;
              break;
            case PaymentStatus.REJECTED:
              summary.rejected += 1;
              break;
            default:
              summary.notPaid += 1;
          }
        }
      }

      return { success: true, summary };
    } catch (error: any) {
      console.error('Error fetching payment summary:', error);
      return { success: false, error: error.message };
    }
  },
);
