import { generateMonthlyInvoices } from './mutations';
import { SupabaseClient } from '@supabase/supabase-js';



export async function getMonthlyInvoices(
  client: SupabaseClient,
  year: number,
  month: number,
): Promise<Invoice[]> {
  try {
    // Generate invoices first
    await generateMonthlyInvoices(client, year, month);

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
