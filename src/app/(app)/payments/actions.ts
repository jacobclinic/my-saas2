'use server';

import { getPaymentSummaryAction } from '~/lib/payments/admin-payment-actions';
import { getAllStudentPayments } from '~/lib/payments/database/queries';
import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
import { Payment } from '~/lib/payments/types/admin-payments';

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
): Promise<{ success: boolean; payments?: Payment[]; error?: string }> {
  try {
    const client = getSupabaseServerComponentClient();
    const payments = await getAllStudentPayments(client, period);
    return { success: true, payments };
  } catch (error) {
    console.error('Error fetching payments for period:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch payments. Please try again.',
    };
  }
}
