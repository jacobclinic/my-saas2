import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/database.types';
import {
  CLASSES_TABLE,
  USERS_TABLE,
  STUDENT_PAYMENTS_TABLE,
  INVOICES_TABLE,
} from '~/lib/db-tables';
import {
  PaymentWithDetails,
  PaymentStatus,
  PaymentSummary,
} from '~/lib/payments/types/admin-payments';
import { isUserAdmin } from '~/lib/user/actions.server';

type Client = SupabaseClient<Database>;

/**
 * @description Fetch all student payments with related data
 * @param client - Supabase client instance
 */
// export async function getAllStudentPayments(client: Client): Promise<Payment[]> {
//   try {
//     // Fetch payments with related data
//     const { data, error } = await client
//       .from(STUDENT_PAYMENTS_TABLE)
//       .select(`
//         *,
//         student:${USERS_TABLE}!student_id (
//           id,
//           first_name,
//           last_name,
//           email
//         ),
//         class:${CLASSES_TABLE}!class_id (
//           id,
//           name,
//           tutor_id,
//           tutor:${USERS_TABLE}!tutor_id (
//             id,
//             first_name,
//             last_name
//           )
//         )
//       `)
//       .order('created_at', { ascending: false });

//     if (error) throw error;

//     // Transform data for frontend
//     const formattedPayments = data.map(payment => {
//       // Handle possible array returns from Supabase joins
//       const student = Array.isArray(payment.student) ? payment.student[0] : payment.student;
//       const classData = Array.isArray(payment.class) ? payment.class[0] : payment.class;
//       const tutor = classData?.tutor && (Array.isArray(classData.tutor) ? classData.tutor[0] : classData.tutor);

//       return {
//         id: payment.id,
//         studentId: payment.student_id ?? '',
//         studentName: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
//         classId: payment.class_id ?? '',
//         className: classData?.name ?? 'Unknown Class',
//         tutorId: classData?.tutor_id ?? '',
//         tutorName: tutor ? `${tutor.first_name} ${tutor.last_name}` : 'Unknown Tutor',
//         amount: payment.amount || 0,
//         period: payment.payment_period || '',
//         submittedDate: payment.created_at,
//         status: payment.status as PaymentStatus,
//         paymentProofUrl: payment.payment_proof_url ?? '',
//       };
//     });

//     return formattedPayments;
//   } catch (error) {
//     console.error('Error fetching student payments:', error);
//     throw new Error('Failed to fetch student payments. Please try again.');
//   }
// }

export async function getAllStudentPayments(
  client: SupabaseClient,
  invoicePeriod?: string,
): Promise<{ paymentData: PaymentWithDetails[]; error: any }> {
  // Check if user is admin
  const adminCheck = await isUserAdmin(client);
  if (!adminCheck) {
    return { paymentData: [], error: 'User is not an admin' };
  }
  try {
    const query = client
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
        status,
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
        ),
        payment:${STUDENT_PAYMENTS_TABLE}!fk_student_payments_invoice_id (
          id,
          status,
          payment_proof_url,
          created_at,
          notes
        )
      `,
      )
      .order('invoice_date', { ascending: false });

    // Filter by invoice period if provided
    if (invoicePeriod) {
      query.eq('invoice_period', invoicePeriod);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching student payments:', error);
      return { paymentData: [], error: error.message };
    }

    // Transform data for frontend
    const formattedPayments = data.map((item) => {
      // Handle possible array returns from Supabase joins
      const student = Array.isArray(item.student)
        ? item.student[0]
        : item.student;
      const classData = Array.isArray(item.class) ? item.class[0] : item.class;
      const tutor =
        classData?.tutor &&
        (Array.isArray(classData.tutor) ? classData.tutor[0] : classData.tutor);
      const payment = Array.isArray(item.payment)
        ? item.payment[0]
        : item.payment;

      // Determine payment status more accurately
      let status = PaymentStatus.NOT_PAID;
      if (payment) {
        if (payment.status === 'verified') {
          status = PaymentStatus.VERIFIED;
        } else if (payment.status === 'pending_verification') {
          status = PaymentStatus.PENDING_VERIFICATION;
        } else if (payment.status === 'pending' || item.status === 'pending') {
          status = PaymentStatus.PENDING;
        } else if (payment.status === 'rejected') {
          status = PaymentStatus.REJECTED;
        }
      } else if (item.status === 'pending') {
        // Invoice is marked as pending but no payment record yet
        status = PaymentStatus.PENDING;
      }

      return {
        id: item.id, // Use invoice ID as primary identifier
        studentId: item.student_id ?? '',
        studentName: student
          ? `${student.first_name} ${student.last_name}`.trim()
          : 'Unknown Student',
        classId: item.class_id ?? '',
        className: classData?.name ?? 'Unknown Class',
        tutorId: classData?.tutor_id ?? '',
        tutorName: tutor
          ? `${tutor.first_name} ${tutor.last_name}`
          : 'Unknown Tutor',
        amount: item.amount || 0,
        period: item.invoice_period || '',
        submittedDate: payment?.created_at || item.invoice_date,
        status: status,
        paymentProofUrl: payment?.payment_proof_url ?? '',
        invoiceNo: item.invoice_no ?? '',
        invoiceDate: item.invoice_date,
        notes: payment?.notes,
      };
    });

    return { paymentData: formattedPayments, error: null };
  } catch (error) {
    console.error('Error fetching student payments:', error);
    return { paymentData: [], error: error };
  }
}

/**
 * @description Fetch a specific student payment by ID
 * @param client - Supabase client instance
 * @param paymentId - ID of the payment to fetch
 */
export async function getStudentPaymentById(
  client: Client,
  paymentId: string,
): Promise<PaymentWithDetails | null> {
  // Check if user is admin
  const adminCheck = await isUserAdmin(client);
  if (!adminCheck) {
    throw new Error('User is not an admin');
  }
  try {
    const { data, error } = await client
      .from(STUDENT_PAYMENTS_TABLE)
      .select(
        `
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
      `,
      )
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
    const student = Array.isArray(data.student)
      ? data.student[0]
      : data.student;
    const classData = Array.isArray(data.class) ? data.class[0] : data.class;
    const tutor =
      classData?.tutor &&
      (Array.isArray(classData.tutor) ? classData.tutor[0] : classData.tutor);

    return {
      id: data.id,
      studentId: data.student_id ?? '',
      studentName: student
        ? `${student.first_name} ${student.last_name}`
        : 'Unknown Student',
      classId: data.class_id ?? '',
      className: classData?.name ?? 'Unknown Class',
      tutorId: classData?.tutor_id ?? '',
      tutorName: tutor
        ? `${tutor.first_name} ${tutor.last_name}`
        : 'Unknown Tutor',
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
  // Check if user is admin
  const adminCheck = await isUserAdmin(client);
  if (!adminCheck) {
    return 0; // Return 0 for non-admin users
  }
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

export async function getPaymentSummary(
  client: SupabaseClient,
  invoicePeriod: string,
): Promise<PaymentSummary> {
  // Check if user is admin
  const adminCheck = await isUserAdmin(client);
  if (!adminCheck) {
    throw new Error('User is not an admin');
  }
  try {
    // Ensure invoices are generated for the period
    // const [year, month] = invoicePeriod.split('-').map(Number);
    // await generateMonthlyInvoices(client, year, month);

    // Fetch invoices with optional payments
    const { data, error } = await client
      .from('invoices')
      .select(
        `
        id,
        amount,
        invoice_period,
        payment:student_payments!fk_student_payments_invoice_id (
          id,
          status,
          amount
        )
      `,
      )
      .eq('invoice_period', invoicePeriod);

    if (error) throw error;

    // Initialize summary
    const summary: PaymentSummary = {
      totalAmount: 0,
      verifiedAmount: 0,
      pendingAmount: 0,
      notPaidAmount: 0,
      rejectedAmount: 0,
      totalInvoices: 0,
      verifiedCount: 0,
      pendingCount: 0,
      notPaidCount: 0,
      rejectedCount: 0,
    };

    // Aggregate data
    for (const item of data) {
      const payment = Array.isArray(item.payment)
        ? item.payment[0]
        : item.payment;
      const invoiceAmount = item.amount || 0;
      summary.totalAmount += invoiceAmount;
      summary.totalInvoices += 1;

      if (!payment || !payment.status) {
        // No payment record exists
        summary.notPaidAmount += invoiceAmount;
        summary.notPaidCount += 1;
      } else {
        switch (payment.status) {
          case 'verified':
            summary.verifiedAmount += invoiceAmount;
            summary.verifiedCount += 1;
            break;
          case 'pending':
          case 'pending_verification':
            summary.pendingAmount += invoiceAmount;
            summary.pendingCount += 1;
            break;
          case 'rejected':
            summary.rejectedAmount += invoiceAmount;
            summary.rejectedCount += 1;
            break;
          default:
            summary.notPaidAmount += invoiceAmount;
            summary.notPaidCount += 1;
        }
      }
    }

    return summary;
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    throw new Error('Failed to fetch payment summary. Please try again.');
  }
}
/**
 * @description Get payment summary for admin dashboard
 * @param client - Supabase client instance
 * @param invoicePeriod - Invoice period to get summary for
 */
export async function getPaymentSummaryForAdmin(
  client: Client,
  invoicePeriod: string,
): Promise<{
  success: boolean;
  summary?: {
    total: number;
    pending: number;
    pendingVerification: number;
    verified: number;
    rejected: number;
    notPaid: number;
    totalVerifiedAmount: number;
    totalAmount: number;
  };
  error?: string;
}> {
  // Check if user is admin
  const adminCheck = await isUserAdmin(client);
  if (!adminCheck) {
    return { success: false, error: 'User is not an admin' };
  }
  try {
    // Fetch all invoices with payment status
    const { data: invoices, error: invoiceError } = await client
      .from(INVOICES_TABLE)
      .select(
        `
        id,
        amount,
        invoice_period,
        payment:${STUDENT_PAYMENTS_TABLE}!fk_student_payments_invoice_id (
          status,
          amount
        )
      `,
      )
      .eq('invoice_period', invoicePeriod);

    if (invoiceError) throw invoiceError;

    // Initialize summary
    const summary = {
      total: 0,
      pending: 0,
      pendingVerification: 0,
      verified: 0,
      rejected: 0,
      notPaid: 0,
      totalVerifiedAmount: 0,
      totalAmount: 0,
    };

    // Aggregate data
    for (const invoice of invoices) {
      const payment = Array.isArray(invoice.payment)
        ? invoice.payment[0]
        : invoice.payment;
      const invoiceAmount = invoice.amount || 0;
      summary.total += 1;
      summary.totalAmount += invoiceAmount;

      if (!payment || !payment.status) {
        summary.notPaid += 1;
      } else {
        switch (payment.status) {
          case PaymentStatus.PENDING:
            summary.pending += 1;
            break;
          case PaymentStatus.PENDING_VERIFICATION:
            summary.pendingVerification += 1;
            break;
          case PaymentStatus.VERIFIED:
            summary.verified += 1;
            summary.totalVerifiedAmount += invoiceAmount;
            break;
          case PaymentStatus.REJECTED:
            summary.rejected += 1;
            break;
          default:
            summary.notPaid += 1;
        }
      }
    }

    return { success: true, summary };
  } catch (error: any) {
    console.error('Error fetching payment summary for admin:', error);
    return { success: false, error: error.message };
  }
}

/**
 * USAGE EXAMPLES FOR PAGES:
 *
 * // In a page.tsx file, you can directly use these functions:
 *
 * import getSupabaseServerComponentClient from '~/core/supabase/server-component-client';
 * import { getAllStudentPayments, getPaymentSummaryForAdmin } from '~/lib/payments/database/queries';
 * import { getAllTutorInvoices } from '~/lib/invoices/database/queries';
 *
 * export default async function PaymentsPage({ searchParams }: { searchParams: { period?: string } }) {
 *   const client = getSupabaseServerComponentClient();
 *   const period = searchParams.period || '2024-01';
 *
 *   // Fetch data directly - authorization is handled inside the functions
 *   const { paymentData, error } = await getAllStudentPayments(client, period);
 *   const summaryResult = await getPaymentSummaryForAdmin(client, period);
 *   const tutorInvoices = await getAllTutorInvoices(client, period);
 *
 *   if (error) {
 *     return <div>Error: {error}</div>;
 *   }
 *
 *   return (
 *     <div>
 *       <h1>Payments Dashboard</h1>
 *       {summaryResult.success && <PaymentSummary summary={summaryResult.summary} />}
 *       <PaymentsList payments={paymentData} />
 *       <TutorInvoicesList invoices={tutorInvoices} />
 *     </div>
 *   );
 * }
 */
