'use server';

import { revalidatePath } from 'next/cache';
import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { uploadTutorPaymentSlip } from '../utils/upload-material-utils';
import { TUTOR_INVOICES_TABLE } from '../db-tables';

export const uploadTutorPaymentProofAction = withSession(
  async ({
    tutorId,
    invoiceId,
    file: { name, type, size, buffer },
    csrfToken,
  }: {
    tutorId: string;
    invoiceId: string;
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
      // First, verify the invoice exists and belongs to the tutor
      const { data: invoice, error: invoiceError } = await client
        .from(TUTOR_INVOICES_TABLE)
        .select('id, tutor_id, class_id, payment_period')
        .eq('id', invoiceId)
        .eq('tutor_id', tutorId)
        .single();

      if (invoiceError || !invoice) {
        throw new Error('Invoice not found or access denied');
      }

      // Upload the payment proof file
      const { url, error: uploadError } = await uploadTutorPaymentSlip(
        client,
        {
          name,
          type,
          buffer,
        },
        tutorId,
        invoice.class_id,
        invoice.payment_period,
      );

      if (uploadError) throw uploadError;

      // Update the tutor invoice with the payment proof URL
      const { error: updateError } = await client
        .from(TUTOR_INVOICES_TABLE)
        .update({
          payment_url: url,
          status: 'proof_uploaded',
        })
        .eq('id', invoiceId);

      if (updateError) {
        console.error('Error updating invoice with payment URL:', updateError);
        throw new Error('Failed to save payment proof URL');
      }

      revalidatePath('/admin/payments');
      revalidatePath('/dashboard');

      return {
        success: true,
        url,
        message: 'Payment proof uploaded successfully',
      };
    } catch (error: any) {
      console.error('Server error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload payment proof',
      };
    }
  },
);

export const updateTutorInvoiceStatusAction = withSession(
  async ({
    invoiceId,
    status,
    csrfToken,
  }: {
    invoiceId: string;
    status: 'issued' | 'paid' | 'proof_uploaded';
    csrfToken: string;
  }) => {
    const client = getSupabaseServerActionClient();

    try {
      // Get current invoice to preserve payment proof URL if it exists
      const { data: currentInvoice, error: fetchError } = await client
        .from(TUTOR_INVOICES_TABLE)
        .select('status, payment_url')
        .eq('id', invoiceId)
        .single();

      if (fetchError) throw fetchError;

      let newStatus = status;
      let paymentUrl = currentInvoice?.payment_url;

      // If we're updating to 'paid' and a payment proof URL exists, preserve the URL
      if (status === 'paid' && paymentUrl) {
        newStatus = 'paid';
      }

      const { error } = await client
        .from(TUTOR_INVOICES_TABLE)
        .update({ status: newStatus, payment_url: paymentUrl })
        .eq('id', invoiceId);

      if (error) throw error;

      revalidatePath('/admin/payments');

      return {
        success: true,
        message: `Invoice status updated to ${status === 'paid' && newStatus !== status ? 'paid (with proof)' : status}`,
      };
    } catch (error: any) {
      console.error('Error updating invoice status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update invoice status',
      };
    }
  },
);
