import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/database.types';
import { CLASSES_TABLE, USERS_TABLE, STUDENT_PAYMENTS_TABLE } from '~/lib/db-tables';
import { withSession } from '~/core/generic/actions-utils';
import { Payment, PaymentStatus } from '~/lib/payments/types/admin-payments';

type Client = SupabaseClient<Database>;

/**
 * @description Fetch all student payments with related data
 * @param client - Supabase client instance
 */
export async function getAllStudentPayments(client: Client): Promise<Payment[]> {
  try {
    // Fetch payments with related data
    const { data, error } = await client
      .from(STUDENT_PAYMENTS_TABLE)
      .select(`
        *,
        student:${USERS_TABLE}!student_id (
          id,
          first_name,
          last_name,
          email
        ),
        class:${CLASSES_TABLE}!class_id (
          id,
          name,
          tutor_id,
          tutor:${USERS_TABLE}!tutor_id (
            id,
            first_name,
            last_name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data for frontend
    const formattedPayments = data.map(payment => {
      // Handle possible array returns from Supabase joins
      const student = Array.isArray(payment.student) ? payment.student[0] : payment.student;
      const classData = Array.isArray(payment.class) ? payment.class[0] : payment.class;
      const tutor = classData?.tutor && (Array.isArray(classData.tutor) ? classData.tutor[0] : classData.tutor);

      return {
        id: payment.id,
        studentId: payment.student_id ?? '',
        studentName: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
        classId: payment.class_id ?? '',
        className: classData?.name ?? 'Unknown Class',
        tutorId: classData?.tutor_id ?? '',
        tutorName: tutor ? `${tutor.first_name} ${tutor.last_name}` : 'Unknown Tutor',
        amount: payment.amount || 0,
        period: payment.payment_period || '',
        submittedDate: payment.created_at,
        status: payment.status as PaymentStatus,
        paymentProofUrl: payment.payment_proof_url ?? '',
      };
    });

    return formattedPayments;
  } catch (error) {
    console.error('Error fetching student payments:', error);
    throw new Error('Failed to fetch student payments. Please try again.');
  }
}

/**
 * @description Fetch a specific student payment by ID
 * @param client - Supabase client instance
 * @param paymentId - ID of the payment to fetch
 */
export async function getStudentPaymentById(client: Client, paymentId: string): Promise<Payment | null> {
  try {
    const { data, error } = await client
      .from(STUDENT_PAYMENTS_TABLE)
      .select(`
        *,
        student:${USERS_TABLE}!student_id (
          id,
          first_name,
          last_name,
          email
        ),
        class:${CLASSES_TABLE}!class_id (
          id,
          name,
          tutor_id,
          tutor:${USERS_TABLE}!tutor_id (
            id,
            first_name,
            last_name
          )
        )
      `)
      .eq('id', paymentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        return null;
      }
      throw error;
    }

    // Handle possible array returns from Supabase joins
    const student = Array.isArray(data.student) ? data.student[0] : data.student;
    const classData = Array.isArray(data.class) ? data.class[0] : data.class;
    const tutor = classData?.tutor && (Array.isArray(classData.tutor) ? classData.tutor[0] : classData.tutor);

    return {
      id: data.id,
      studentId: data.student_id ?? '',
      studentName: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
      classId: data.class_id ?? '',
      className: classData?.name ?? 'Unknown Class',
      tutorId: classData?.tutor_id ?? '',
      tutorName: tutor ? `${tutor.first_name} ${tutor.last_name}` : 'Unknown Tutor',
      amount: data.amount || 0,
      period: data.payment_period || '',
      submittedDate: data.created_at,
      status: data.status as PaymentStatus,
      paymentProofUrl: data.payment_proof_url ?? '',
    };
  } catch (error) {
    console.error('Error fetching payment by id:', error);
    throw new Error('Failed to fetch payment details. Please try again.');
  }
}

/**
 * @description Get pending payments count for notification badges
 * @param client - Supabase client instance
 */
export async function getPendingPaymentsCount(client: Client): Promise<number> {
  try {
    const { count, error } = await client
      .from(STUDENT_PAYMENTS_TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('status', PaymentStatus.PENDING);

    if (error) throw error;
    
    return count || 0;
  } catch (error) {
    console.error('Error fetching pending payments count:', error);
    return 0; // Return 0 instead of throwing error for notifications
  }
}
