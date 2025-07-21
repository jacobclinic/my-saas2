'use server';

import { revalidatePath } from 'next/cache';
import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { uploadPaymentSlip } from '../utils/upload-material-utils';
import { PAYMENT_STATUS } from './constant';
import {
  findInvoiceByStudentAndClass,
  findExistingPayments,
  updateExistingPayment,
  createNewPayment,
} from './database/mutation';

export const uploadPaymentSlipAction = withSession(
  async ({
    studentId,
    classId,
    paymentPeriod,
    file: { name, type, size, buffer },
    csrfToken,
  }: {
    studentId: string;
    classId: string;
    paymentPeriod: string;
    file: {
      name: string;
      type: string;
      size: number;
      buffer: number[];
    };
    csrfToken: string;
  }) => {
    const client = getSupabaseServerActionClient();

    try {
      const { url, error } = await uploadPaymentSlip(
        client,
        {
          name,
          type,
          buffer,
        },
        studentId,
        classId,
        paymentPeriod,
      );

      if (error) throw error;

      // Find the invoice for this student, class, and period
      const invoice = await findInvoiceByStudentAndClass(
        client,
        studentId,
        classId,
        paymentPeriod,
      );

      // Check if there's an existing payment record (especially a rejected one)
      const existingPayments = await findExistingPayments(client, invoice.id);

      // If we have existing payments, update the most recent one
      if (existingPayments && existingPayments.length > 0) {
        const mostRecentPayment = existingPayments[0];
        const wasRejected =
          mostRecentPayment.status === PAYMENT_STATUS.REJECTED;

        await updateExistingPayment(
          client,
          mostRecentPayment.id,
          url,
          wasRejected,
        );
      } else {
        // Create a new payment record if none exists
        await createNewPayment(client, {
          studentId,
          classId,
          invoiceId: invoice.id,
          paymentProofUrl: url,
          paymentPeriod,
          amount: invoice.amount,
        });
      }
      revalidatePath('/dashboard');
      return { success: true, url };
    } catch (error: any) {
      console.error('Server error:', error);
      return { success: false, error: error.message };
    }
  },
);
