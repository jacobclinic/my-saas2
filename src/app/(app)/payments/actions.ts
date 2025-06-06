'use server';

import { getPaymentSummaryAction } from '~/lib/payments/admin-payment-actions';
import { getAllStudentPayments } from '~/lib/payments/database/queries';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { PaymentWithDetails } from '~/lib/payments/types/admin-payments';

export async function getPaymentSummaryForPage(searchParams?: {
  month?: string;
}) {
  const invoicePeriod = searchParams?.month || '2025-01'; // Default to 2025-01
  const result = await getPaymentSummaryAction({
    csrfToken: 'server-side',
    invoicePeriod,
  });
  return result;
}

export async function getPaymentsForPeriod(
  period: string,
): Promise<{
  success: boolean;
  payments?: PaymentWithDetails[];
  error?: string;
}> {
    const client = getSupabaseServerComponentClient();
    
    const { paymentData, error } = await getAllStudentPayments(client, period);
    if (error) {
      console.error('Error fetching payments:', error);
      return { success: false, error: error.message };
    }
    return { success: true, payments: paymentData };
 
}
