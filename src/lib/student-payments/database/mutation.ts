import { SupabaseClient } from '@supabase/supabase-js';
import { PAYMENT_STATUS } from '../constant';

export async function findInvoiceByStudentAndClass(
  client: SupabaseClient,
  studentId: string,
  classId: string,
  paymentPeriod: string,
) {
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

  return invoice;
}

export async function findExistingPayments(
  client: SupabaseClient,
  invoiceId: string,
) {
  const { data: existingPayments, error: existingPaymentError } = await client
    .from('student_payments')
    .select('id, status')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false });

  if (existingPaymentError) {
    console.error('Error checking existing payment:', existingPaymentError);
    throw existingPaymentError;
  }

  return existingPayments;
}

export async function updateExistingPayment(
  client: SupabaseClient,
  paymentId: string,
  paymentProofUrl: string,
  wasRejected: boolean,
) {
  const { error: updateError } = await client
    .from('student_payments')
    .update({
      payment_proof_url: paymentProofUrl,
      status: PAYMENT_STATUS.PENDING_VERIFICATION,
      payment_date: new Date().toISOString(),
      notes: wasRejected ? 'Resubmitted after rejection' : undefined,
    })
    .eq('id', paymentId);

  if (updateError) {
    console.error('Error updating payment:', updateError);
    throw updateError;
  }
}

export async function createNewPayment(
  client: SupabaseClient,
  {
    studentId,
    classId,
    invoiceId,
    paymentProofUrl,
    paymentPeriod,
    amount,
  }: {
    studentId: string;
    classId: string;
    invoiceId: string;
    paymentProofUrl: string;
    paymentPeriod: string;
    amount: number;
  },
) {
  const { error: dbError } = await client.from('student_payments').insert({
    student_id: studentId,
    class_id: classId,
    invoice_id: invoiceId,
    payment_proof_url: paymentProofUrl,
    payment_period: paymentPeriod,
    amount: amount,
    status: PAYMENT_STATUS.PENDING_VERIFICATION,
    created_at: new Date().toISOString(),
    payment_date: new Date().toISOString(),
  });

  if (dbError) throw dbError;
}
