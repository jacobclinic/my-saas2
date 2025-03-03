import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/database.types';
import { STUDENT_PAYMENTS_TABLE } from '~/lib/db-tables';
import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { PaymentStatus } from '~/lib/payments/types/admin-payments';

type Client = SupabaseClient<Database>;

/**
 * @description Approve a student payment
 * @param client - Supabase client instance
 * @param paymentId - ID of the payment to approve
 */
export async function approveStudentPayment(client: Client, paymentId: string): Promise<boolean> {
  try {
    // Update payment status to verified
    const { error } = await client
      .from(STUDENT_PAYMENTS_TABLE)
      .update({
        status: PaymentStatus.VERIFIED,
        verified_date: new Date().toISOString()
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
export async function rejectStudentPayment(client: Client, paymentId: string, reason: string): Promise<boolean> {
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
        rejected_date: new Date().toISOString()
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
 * Server action wrapper for approveStudentPayment
 */
export const approveStudentPaymentAction = withSession(
  async ({ 
    paymentId,
    csrfToken
  }: { 
    paymentId: string,
    csrfToken: string 
  }) => {
    const client = getSupabaseServerActionClient();

    try {
      await approveStudentPayment(client, paymentId);
      
      // Revalidate related paths to refresh data
      revalidatePath('/admin/payments');
      revalidatePath('/dashboard');
      
      return { success: true };
    } catch (error: any) {
      console.error('Error approving payment:', error);
      return { success: false, error: error.message };
    }
  }
);

/**
 * Server action wrapper for rejectStudentPayment
 */
export const rejectStudentPaymentAction = withSession(
  async ({ 
    paymentId,
    reason,
    csrfToken
  }: { 
    paymentId: string,
    reason: string,
    csrfToken: string 
  }) => {
    const client = getSupabaseServerActionClient();

    try {
      await rejectStudentPayment(client, paymentId, reason);
      
      // Revalidate related paths to refresh data
      revalidatePath('/admin/payments');
      revalidatePath('/dashboard');
      
      return { success: true };
    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      return { success: false, error: error.message || 'Failed to reject payment' };
    }
  }
);