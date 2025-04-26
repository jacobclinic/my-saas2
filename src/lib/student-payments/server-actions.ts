'use server';

import { revalidatePath } from 'next/cache';
import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { uploadPaymentSlip } from '../utils/upload-material-utils';
import { PAYMENT_STATUS } from './constant';

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

      // First, find the invoice for this student, class, and period
      const { data: invoice, error: invoiceError } = await client
        .from('invoices')
        .select('id, amount')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .eq('invoice_period', paymentPeriod)
        .single();

      if (invoiceError) {
        console.error('Error finding invoice:', invoiceError);
        throw invoiceError;
      }

      // Create or update payment record in student_payments table
      const { error: dbError } = await client.from('student_payments').insert({
        student_id: studentId,
        class_id: classId,
        invoice_id: invoice.id,
        payment_proof_url: url,
        payment_period: paymentPeriod,
        amount: invoice.amount,
        status: PAYMENT_STATUS.PENDING_VERIFICATION,
        created_at: new Date().toISOString(),
        payment_date: new Date().toISOString(), // Using payment_date instead of updated_at
      });

      if (dbError) throw dbError;

      // Don't update the invoice status - it should remain "issued"
      // The admin will mark it as "paid" when they verify the payment

      revalidatePath('/dashboard');
      return { success: true, url };
    } catch (error: any) {
      console.error('Server error:', error);
      return { success: false, error: error.message };
    }
  },
);
