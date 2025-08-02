'use server';

import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import {
  PaymentStatus,
  PaymentWithDetails,
} from '~/lib/payments/types/admin-payments';
import {
  generateMonthlyInvoicesStudents,
  generateMonthlyInvoicesTutor,
} from '../invoices/database/mutations';
import { isAdmin as isUserAdmin } from '../user/actions.server';
import { getAllStudentPayments } from './database/queries';
import {
  INVOICES_TABLE,
  STUDENT_PAYMENTS_TABLE,
  TUTOR_INVOICES_TABLE,
} from '../db-tables';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { getAllTutorInvoices } from '../invoices/database/queries';
import { TutorInvoice } from '../invoices/types/types';

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
  async ({ invoicePeriod }: { invoicePeriod: string }) => {
    const client = getSupabaseServerActionClient();

    const isAdmin = await isUserAdmin(client);
    if (!isAdmin) {
      return { success: false, error: 'User is not an admin' };
    }

    try {
      // Fetch all invoices with payment status
      const { data: invoices, error: invoiceError } = await client
        .from(INVOICES_TABLE)
        .select(
          `
          id,
          amount,
          invoice_period,
          payment:${STUDENT_PAYMENTS_TABLE}!fk_student_payments_invoice_id (
            status,
            amount
          )
        `,
        )
        .eq('invoice_period', invoicePeriod);

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

export const generateInvoicesAction = withSession(
  async ({
    csrfToken,
    invoicePeriod,
  }: {
    csrfToken: string;
    invoicePeriod: string;
  }) => {
    const client = getSupabaseServerActionClient();

    try {
      const [year, month] = invoicePeriod.split('-').map(Number);

      // Start timing the operation
      const startTime = performance.now();

      // Generate the invoices
      await generateMonthlyInvoicesStudents(client, year, month);

      // Calculate how long it took
      const endTime = performance.now();
      const executionTime = Math.round((endTime - startTime) / 1000);

      return {
        success: true,
        message: `Invoices successfully generated for ${invoicePeriod}`,
        executionTime,
      };
    } catch (error: any) {
      console.error('Error generating invoices:', error);
      return {
        success: false,
        message: `Failed to generate invoices: ${error.message}`,
      };
    }
  },
);

export const generateTutorInvoicesAction = withSession(
  async ({ invoicePeriod }: { csrfToken: string; invoicePeriod: string }) => {
    const client = getSupabaseServerActionClient();

    const isAdmin = await isUserAdmin(client);
    if (!isAdmin) {
      return { success: false, error: 'User is not an admin' };
    }

    try {
      const [year, month] = invoicePeriod.split('-').map(Number);

      // Start timing the operation
      const startTime = performance.now();

      // Generate the tutor invoices
      await generateMonthlyInvoicesTutor(client, year, month);

      // Calculate how long it took
      const endTime = performance.now();
      const executionTime = Math.round((endTime - startTime) / 1000);

      return {
        success: true,
        message: `Tutor invoices successfully generated for ${invoicePeriod}`,
        executionTime,
      };
    } catch (error: any) {
      console.error('Error generating tutor invoices:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate tutor invoices',
      };
    }
  },
);

export const generateAllInvoicesAction = withSession(
  async ({ invoicePeriod }: { invoicePeriod: string }) => {
    const client = getSupabaseServerActionClient();

    const isAdmin = await isUserAdmin(client);
    if (!isAdmin) {
      return { success: false, error: 'User is not an admin' };
    }

    try {
      const [year, month] = invoicePeriod.split('-').map(Number);

      // Start timing the operation
      const startTime = performance.now();

      // Generate both student and tutor invoices
      await Promise.all([
        generateMonthlyInvoicesStudents(client, year, month),
        generateMonthlyInvoicesTutor(client, year, month),
      ]);
      // await generateMonthlyInvoicesStudents(client, year, month);
      // await generateMonthlyInvoicesTutor(client, year, month);

      // Calculate how long it took
      const endTime = performance.now();
      const executionTime = Math.round((endTime - startTime) / 1000);

      return {
        success: true,
        message: `All invoices successfully generated for ${invoicePeriod}`,
        executionTime,
      };
    } catch (error: any) {
      console.error('Error generating all invoices:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate invoices',
      };
    }
  },
);

export const getAllStudentPaymentsAction = withSession(
  async (
    invoicePeriod: string,
  ): Promise<{ paymentData: PaymentWithDetails[]; error: any }> => {
    const client = getSupabaseServerActionClient();
    const adminCheck = await isUserAdmin(client);
    if (!adminCheck) {
      return { paymentData: [], error: 'User is not an admin' };
    }

    const { paymentData, error } = await getAllStudentPayments(
      client,
      invoicePeriod,
    );

    return { paymentData, error };
  },
);

export const getPaymentsForPeriod = withSession(
  async (
    invoicePeriod: string,
  ): Promise<{
    success: boolean;
    payments?: PaymentWithDetails[];
    error?: string;
  }> => {
    const client = getSupabaseServerActionClient();
    const adminCheck = await isUserAdmin(client);

    if (!adminCheck) {
      return {
        success: false,
        error: 'User is not an admin',
      };
    }

    try {
      const { paymentData, error } = await getAllStudentPayments(
        client,
        invoicePeriod,
      );

      if (error) {
        return {
          success: false,
          error: error.message || 'Failed to fetch payments',
        };
      }

      return {
        success: true,
        payments: paymentData,
      };
    } catch (error: any) {
      console.error('Error fetching payments for period:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch payments',
      };
    }
  },
);

export const getPaymentSummaryForPage = withSession(
  async (
    invoicePeriod: string,
  ): Promise<{
    success: boolean;
    summary?: {
      total: number;
      pending: number;
      pendingVerification: number;
      verified: number;
      rejected: number;
      notPaid: number;
      totalVerifiedAmount: number;
      totalAmount: number;
    };
    error?: string;
  }> => {
    const client = getSupabaseServerActionClient();

    const isAdmin = await isUserAdmin(client);
    if (!isAdmin) {
      return { success: false, error: 'User is not an admin' };
    }

    try {
      // Fetch all invoices with payment status
      const { data: invoices, error: invoiceError } = await client
        .from('invoices')
        .select(
          `
          id,
          amount,
          invoice_period,
          payment:${STUDENT_PAYMENTS_TABLE}!fk_student_payments_invoice_id (
            status,
            amount
          )
        `,
        )
        .eq('invoice_period', invoicePeriod);

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
      console.error('Error fetching payment summary for page:', error);
      return { success: false, error: error.message };
    }
  },
);

export const getAllTutorInvoicesAction = withSession(
  async (
    invoicePeriod?: string,
  ): Promise<{
    success: boolean;
    invoices?: TutorInvoice[];
    error?: string;
  }> => {
    const client = getSupabaseServerActionClient();
    const adminCheck = await isUserAdmin(client);

    if (!adminCheck) {
      return {
        success: false,
        error: 'User is not an admin',
      };
    }

    try {
      const invoices = await getAllTutorInvoices(client, invoicePeriod);
      return {
        success: true,
        invoices,
      };
    } catch (error: any) {
      console.error('Error fetching tutor invoices:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch tutor invoices',
      };
    }
  },
);

export const getTutorInvoicesForPeriod = withSession(
  async (
    invoicePeriod: string,
  ): Promise<{
    success: boolean;
    invoices?: TutorInvoice[];
    error?: string;
  }> => {
    const client = getSupabaseServerActionClient();
    const adminCheck = await isUserAdmin(client);

    if (!adminCheck) {
      return {
        success: false,
        error: 'User is not an admin',
      };
    }

    try {
      const invoices = await getAllTutorInvoices(client, invoicePeriod);
      return {
        success: true,
        invoices,
      };
    } catch (error: any) {
      console.error('Error fetching tutor invoices for period:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch tutor invoices',
      };
    }
  },
);

// Actions for updating tutor invoice status
export const markTutorInvoiceAsPaidAction = withSession(
  async ({ invoiceId }: { invoiceId: string }) => {
    const client = getSupabaseServerActionClient();
    const adminCheck = await isUserAdmin(client);

    if (!adminCheck) {
      return { success: false, error: 'User is not an admin' };
    }

    try {
      const { error } = await client
        .from(TUTOR_INVOICES_TABLE)
        .update({ status: 'paid' })
        .eq('id', invoiceId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error marking tutor invoice as paid:', error);
      return { success: false, error: error.message };
    }
  },
);

export const markTutorInvoiceAsIssuedAction = withSession(
  async ({ invoiceId }: { invoiceId: string }) => {
    const client = getSupabaseServerActionClient();
    const adminCheck = await isUserAdmin(client);

    if (!adminCheck) {
      return { success: false, error: 'User is not an admin' };
    }

    try {
      const { error } = await client
        .from(TUTOR_INVOICES_TABLE)
        .update({ status: 'issued' })
        .eq('id', invoiceId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error marking tutor invoice as issued:', error);
      return { success: false, error: error.message };
    }
  },
);
