'use server';

import { revalidatePath } from 'next/cache';
import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { STUDENT_PAYMENTS_TABLE, USERS_TABLE, CLASSES_TABLE } from '~/lib/db-tables';
import { PaymentStatus } from '~/lib/payments/types/admin-payments';
import { 
  getAllStudentPayments, 
  getStudentPaymentById 
} from '~/lib/payments/database/queries';
import { 
  approveStudentPayment, 
  rejectStudentPayment 
} from '~/lib/payments/database/mutations';

/**
 * Server action to fetch all student payments with related data
 */
export const getAllStudentPaymentsAction = withSession(
  async ({ csrfToken }: { csrfToken: string }) => {
    const client = getSupabaseServerActionClient();
    
    try {
      const payments = await getAllStudentPayments(client);
      return { success: true, payments };
    } catch (error: any) {
      console.error('Error fetching student payments:', error);
      return { success: false, error: error.message };
    }
  }
);

/**
 * Server action to fetch a specific student payment by ID
 */
export const getStudentPaymentByIdAction = withSession(
  async ({ 
    paymentId,
    csrfToken
  }: { 
    paymentId: string,
    csrfToken: string 
  }) => {
    const client = getSupabaseServerActionClient();
    
    try {
      const payment = await getStudentPaymentById(client, paymentId);
      return { success: true, payment };
    } catch (error: any) {
      console.error('Error fetching payment details:', error);
      return { success: false, error: error.message };
    }
  }
);

/**
 * Server action to approve a student payment
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
 * Server action to reject a student payment with reason
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

/**
 * Server action to get pending payments count (for notifications)
 */
export const getPendingPaymentsCountAction = withSession(
  async ({ csrfToken }: { csrfToken: string }) => {
    const client = getSupabaseServerActionClient();
    
    try {
      const { count, error } = await client
        .from(STUDENT_PAYMENTS_TABLE)
        .select('*', { count: 'exact', head: true })
        .in('status', [PaymentStatus.PENDING, PaymentStatus.PENDING_VERIFICATION]);

      if (error) throw error;
      
      return { success: true, count: count || 0 };
    } catch (error: any) {
      console.error('Error fetching pending payments count:', error);
      return { success: false, error: error.message, count: 0 };
    }
  }
);

/**
 * Server action to update the payment status directly
 */
export const updatePaymentStatusAction = withSession(
  async ({ 
    paymentId,
    status,
    notes,
    csrfToken
  }: { 
    paymentId: string,
    status: PaymentStatus,
    notes?: string,
    csrfToken: string 
  }) => {
    const client = getSupabaseServerActionClient();
    
    try {
      const updateData: Record<string, any> = {
        status,
        updated_at: new Date().toISOString()
      };
      
      // Add status-specific fields
      if (status === PaymentStatus.VERIFIED) {
        updateData.verified_date = new Date().toISOString();
      } else if (status === PaymentStatus.REJECTED) {
        updateData.rejected_date = new Date().toISOString();
        if (notes) updateData.notes = notes;
      }
      
      const { error } = await client
        .from(STUDENT_PAYMENTS_TABLE)
        .update(updateData)
        .eq('id', paymentId);

      if (error) throw error;
      
      // Revalidate related paths
      revalidatePath('/admin/payments');
      revalidatePath('/dashboard');
      
      return { success: true };
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      return { success: false, error: error.message };
    }
  }
);

/**
 * Server action to get payment summary statistics for admin dashboard
 */
export const getPaymentSummaryAction = withSession(
  async ({ csrfToken }: { csrfToken: string }) => {
    const client = getSupabaseServerActionClient();
    
    try {
      // Instead of using group by, we'll fetch all payment statuses and count them in JavaScript
      const { data: allPayments, error: statusError } = await client
        .from(STUDENT_PAYMENTS_TABLE)
        .select('status');
        
      if (statusError) throw statusError;

      // Count payments by status
      const statusCounts = allPayments.reduce((acc: Record<string, number>, payment) => {
        const status = payment.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // Get total payment amount
      const { data: amountData, error: amountError } = await client
        .from(STUDENT_PAYMENTS_TABLE)
        .select('amount')
        .eq('status', PaymentStatus.VERIFIED);
        
      if (amountError) throw amountError;
      
      // Calculate total verified amount
      const totalVerifiedAmount = amountData.reduce((sum: number, item) => 
        sum + (Number(item.amount) || 0), 0);
        
      // Create summary object
      const summary = {
        total: allPayments.length,
        pending: statusCounts[PaymentStatus.PENDING] || 0,
        pendingVerification: statusCounts[PaymentStatus.PENDING_VERIFICATION] || 0,
        verified: statusCounts[PaymentStatus.VERIFIED] || 0,
        rejected: statusCounts[PaymentStatus.REJECTED] || 0,
        totalVerifiedAmount
      };
      
      return { success: true, summary };
    } catch (error: any) {
      console.error('Error fetching payment summary:', error);
      return { success: false, error: error.message };
    }
  }
);