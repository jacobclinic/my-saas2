'use server';

import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import {
  generateMonthlyInvoicesStudents,
  generateMonthlyInvoicesTutor,
} from '../invoices/database/mutations';
import { isUserAdmin } from '../user/actions.server';
import { getPaymentSummaryForAdmin } from './database/queries';
import {
  approveStudentPaymentByInvoice,
  rejectStudentPaymentByInvoice,
  markTutorInvoiceAsPaid,
  markTutorInvoiceAsIssued,
} from './database/mutations';

export const approveStudentPaymentAction = withSession(
  async ({
    paymentId,
    csrfToken,
  }: {
    paymentId: string;
    csrfToken: string;
  }) => {
    const client = getSupabaseServerActionClient();
    return await approveStudentPaymentByInvoice(client, paymentId);
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
    return await rejectStudentPaymentByInvoice(client, paymentId, reason);
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

    return await getPaymentSummaryForAdmin(client, invoicePeriod);
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

// Actions for updating tutor invoice status
export const markTutorInvoiceAsPaidAction = withSession(
  async ({ invoiceId }: { invoiceId: string }) => {
    const client = getSupabaseServerActionClient();
    const adminCheck = await isUserAdmin(client);

    if (!adminCheck) {
      return { success: false, error: 'User is not an admin' };
    }

    return await markTutorInvoiceAsPaid(client, invoiceId);
  },
);

export const markTutorInvoiceAsIssuedAction = withSession(
  async ({ invoiceId }: { invoiceId: string }) => {
    const client = getSupabaseServerActionClient();
    const adminCheck = await isUserAdmin(client);

    if (!adminCheck) {
      return { success: false, error: 'User is not an admin' };
    }

    return await markTutorInvoiceAsIssued(client, invoiceId);
  },
);
