import {
  CLASSES_TABLE,
  INVOICES_TABLE,
  STUDENT_PAYMENTS_TABLE,
  TUTOR_INVOICES_TABLE,
  USERS_TABLE,
  STUDENT_CLASS_ENROLLMENTS_TABLE,
} from '~/lib/db-tables';
import { generateMonthlyInvoicesStudents } from './mutations';
import { SupabaseClient } from '@supabase/supabase-js';
import type {
  Invoice,
  TutorInvoice,
  TutorInvoiceSummary,
} from '../types/types';

export async function getMonthlyInvoices(
  client: SupabaseClient,
  year: number,
  month: number,
): Promise<Invoice[]> {
  try {
    // Generate invoices first
    await generateMonthlyInvoicesStudents(client, year, month);

    const { data, error } = await client
      .from('invoices')
      .select(
        `
          id,
          student_id,
          class_id,
          invoice_no,
          invoice_period,
          amount,
          invoice_date,
          due_date,
          status,
          student:users!student_id (
            first_name,
            last_name
          ),
          class:classes!class_id (
            name
          ),
          payments:student_payments!invoice_id (
            status,
            payment_proof_url
          )
        `,
      )
      .ilike('invoice_period', `${year}%`)
      .order('invoice_period', { ascending: true });

    if (error) {
      throw new Error(`Error fetching invoices: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map((invoice) => {
      // Handle possible array returns from Supabase joins
      const student = Array.isArray(invoice.student)
        ? invoice.student[0]
        : invoice.student;
      const classData = Array.isArray(invoice.class)
        ? invoice.class[0]
        : invoice.class;
      const payment = Array.isArray(invoice.payments)
        ? invoice.payments[0]
        : invoice.payments;

      return {
        id: invoice.id,
        student_id: invoice.student_id,
        student_name:
          `${student?.first_name || ''} ${student?.last_name || ''}`.trim(),
        class_id: invoice.class_id,
        class_name: classData?.name || null,
        month: invoice.invoice_period,
        payment_status:
          payment?.status === 'verified'
            ? 'completed'
            : payment?.status === 'pending' || payment?.payment_proof_url
              ? 'pending'
              : 'not_paid',
        payment_proof_url: payment?.payment_proof_url || null,
        invoice_no: invoice.invoice_no || null,
        amount: invoice.amount || null,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date || null,
        status: invoice.status,
      };
    });
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    throw error;
  }
}

export async function getStudentInvoices(
  client: SupabaseClient,
  studentId: string,
  month?: string,
): Promise<Invoice[]> {
  try {
    let query = client
      .from(INVOICES_TABLE)
      .select(
        `
          id,
          student_id,
          class_id,
          invoice_no,
          invoice_period,
          amount,
          invoice_date,
          due_date,
          status,
          class:${CLASSES_TABLE}!class_id (
            name,
            subject
          ),
          payments:${STUDENT_PAYMENTS_TABLE}!invoice_id (
            status,
            payment_proof_url
          )
        `,
      )
      .eq('student_id', studentId);

    // Filter by month if provided
    if (month) {
      query = query.eq('invoice_period', month);
    }

    const { data, error } = await query.order('invoice_date', {
      ascending: false,
    });

    if (error) {
      throw new Error(`Error fetching student invoices: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map((invoice) => {
      // Handle possible array returns from Supabase joins
      const classData = Array.isArray(invoice.class)
        ? invoice.class[0]
        : invoice.class;
      const payment = Array.isArray(invoice.payments)
        ? invoice.payments[0]
        : invoice.payments;

      return {
        id: invoice.id,
        student_id: invoice.student_id,
        student_name: '', // Not needed for student view
        class_id: invoice.class_id,
        class_name: classData?.name || null,
        class_subject: classData?.subject || null,
        month: invoice.invoice_period,
        payment_status:
          payment?.status === 'verified'
            ? 'completed'
            : payment?.status === 'pending' || payment?.payment_proof_url
              ? 'pending'
              : 'not_paid',
        payment_proof_url: payment?.payment_proof_url || null,
        invoice_no: invoice.invoice_no || null,
        amount: invoice.amount || null,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date || null,
        status: invoice.status,
      };
    });
  } catch (error) {
    console.error('Failed to fetch student invoices:', error);
    throw error;
  }
}

/**
 * Get all tutor invoices for admin view
 * @param client Supabase client instance
 * @param invoicePeriod Optional filter by invoice period (YYYY-MM format)
 * @returns Array of tutor invoices with tutor and class details
 */
export async function getAllTutorInvoices(
  client: SupabaseClient,
  invoicePeriod?: string,
): Promise<TutorInvoice[]> {
  try {
    let query = client
      .from(TUTOR_INVOICES_TABLE)
      .select(
        `
          id,
          tutor_id,
          class_id,
          invoice_no,
          payment_period,
          amount,
          status,
          created_at,
          tutor:${USERS_TABLE}!tutor_id (
            id,
            first_name,
            last_name,
            email
          ),
          class:${CLASSES_TABLE}!class_id (
            id,
            name,
            subject,
            fee,
            ${STUDENT_CLASS_ENROLLMENTS_TABLE}(count)
          )
        `,
      )
      .order('created_at', { ascending: false });

    // Filter by invoice period if provided
    if (invoicePeriod) {
      query = query.eq('payment_period', invoicePeriod);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching tutor invoices: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map((invoice) => {
      // Handle possible array returns from Supabase joins
      const tutor = Array.isArray(invoice.tutor)
        ? invoice.tutor[0]
        : invoice.tutor;
      const classData = Array.isArray(invoice.class)
        ? invoice.class[0]
        : invoice.class;

      return {
        id: invoice.id,
        tutor_id: invoice.tutor_id,
        tutor_name: tutor
          ? `${tutor.first_name} ${tutor.last_name}`
          : 'Unknown Tutor',
        tutor_email: tutor?.email || '',
        class_id: invoice.class_id,
        class_name: classData?.name || 'Unknown Class',
        class_subject: classData?.subject || null,
        class_fee: classData?.fee || 0,
        invoice_no: invoice.invoice_no || null,
        payment_period: invoice.payment_period,
        amount: invoice.amount || 0,
        status: invoice.status,
        created_at: invoice.created_at,
        student_count:
          (classData as any)?.[STUDENT_CLASS_ENROLLMENTS_TABLE]?.[0]?.count ||
          0,
      };
    });
  } catch (error) {
    console.error('Failed to fetch tutor invoices:', error);
    throw error;
  }
}

/**
 * Get tutor invoices for a specific tutor
 * @param client Supabase client instance
 * @param tutorId ID of the tutor
 * @param invoicePeriod Optional filter by invoice period (YYYY-MM format)
 * @returns Array of tutor invoices for the specified tutor
 */
export async function getTutorInvoicesByTutorId(
  client: SupabaseClient,
  tutorId: string,
  invoicePeriod?: string,
): Promise<TutorInvoice[]> {
  try {
    let query = client
      .from(TUTOR_INVOICES_TABLE)
      .select(
        `
          id,
          tutor_id,
          class_id,
          invoice_no,
          payment_period,
          amount,
          status,
          created_at,
          class:${CLASSES_TABLE}!class_id (
            id,
            name,
            subject,
            fee,
            ${STUDENT_CLASS_ENROLLMENTS_TABLE}(count)
          )
        `,
      )
      .eq('tutor_id', tutorId)
      .order('created_at', { ascending: false });

    // Filter by invoice period if provided
    if (invoicePeriod) {
      query = query.eq('payment_period', invoicePeriod);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching tutor invoices: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // For each tutor invoice, get the count of students who have paid
    const tutorInvoicesWithPaidCount = await Promise.all(
      data.map(async (invoice) => {
        // Get count of students who have paid for this class and period
        const { count } = await client
          .from(INVOICES_TABLE)
          .select('id', { count: 'exact', head: true })
          .eq('class_id', invoice.class_id)
          .eq('invoice_period', invoice.payment_period)
          .eq('status', 'paid');

        // Handle possible array returns from Supabase joins
        const classData = Array.isArray(invoice.class)
          ? invoice.class[0]
          : invoice.class;

        // Get actual enrolled student count
        const studentEnrollments = (classData as any)?.[
          STUDENT_CLASS_ENROLLMENTS_TABLE
        ];
        const actualStudentCount = Array.isArray(studentEnrollments)
          ? studentEnrollments[0]?.count || 0
          : studentEnrollments?.count || 0;

        return {
          id: invoice.id,
          tutor_id: invoice.tutor_id,
          tutor_name: '', // Not needed for tutor view
          tutor_email: '',
          class_id: invoice.class_id,
          class_name: classData?.name || 'Unknown Class',
          class_subject: classData?.subject || null,
          class_fee: classData?.fee || 0,
          invoice_no: invoice.invoice_no || null,
          payment_period: invoice.payment_period,
          amount: invoice.amount || 0,
          status: invoice.status,
          created_at: invoice.created_at,
          student_count: actualStudentCount,
          paid_student_count: count || 0,
        };
      }),
    );

    return tutorInvoicesWithPaidCount;
  } catch (error) {
    console.error('Failed to fetch tutor invoices:', error);
    throw error;
  }
}

/**
 * Get tutor invoice summary for a specific period
 * @param client Supabase client instance
 * @param invoicePeriod Invoice period in YYYY-MM format
 * @returns Summary of tutor invoices for the period
 */
export async function getTutorInvoiceSummary(
  client: SupabaseClient,
  invoicePeriod: string,
): Promise<TutorInvoiceSummary> {
  try {
    const { data, error } = await client
      .from(TUTOR_INVOICES_TABLE)
      .select('amount, status')
      .eq('payment_period', invoicePeriod);

    if (error) {
      throw new Error(`Error fetching tutor invoice summary: ${error.message}`);
    }

    // Initialize summary
    const summary: TutorInvoiceSummary = {
      totalAmount: 0,
      issuedAmount: 0,
      paidAmount: 0,
      totalInvoices: 0,
      issuedCount: 0,
      paidCount: 0,
    };

    // Calculate summary
    for (const invoice of data) {
      const amount = invoice.amount || 0;
      summary.totalAmount += amount;
      summary.totalInvoices += 1;

      if (invoice.status === 'issued') {
        summary.issuedAmount += amount;
        summary.issuedCount += 1;
      } else if (invoice.status === 'paid') {
        summary.paidAmount += amount;
        summary.paidCount += 1;
      }
    }

    return summary;
  } catch (error) {
    console.error('Error fetching tutor invoice summary:', error);
    throw new Error('Failed to fetch tutor invoice summary. Please try again.');
  }
}
