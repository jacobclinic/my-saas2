import { SupabaseClient } from '@supabase/supabase-js';

export async function generateMonthlyInvoices(
  client: SupabaseClient,
  year: number,
  month: number
): Promise<void> {
  try {
    // Format month as 'YYYY-MM'
    const invoicePeriod = `${year}-${month.toString().padStart(2, '0')}`;
    const invoiceDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const dueDate = `${year}-${month.toString().padStart(2, '0')}-15`;

    // Get all student-class enrollments
    const { data: enrollments, error: enrollError } = await client
      .from('student_class_enrollments')
      .select(`
        student_id,
        class_id,
        class:classes!class_id (
          fee,
          name
        )
      `)
      .returns<Enrollment[]>();

    if (enrollError) {
      throw new Error(`Error fetching enrollments: ${enrollError.message}`);
    }

    if (!enrollments) {
      return;
    }

    const invoicesToInsert = [];

    for (const enrollment of enrollments) {
      const { student_id, class_id, class: classData } = enrollment;

      // Check if invoice already exists
      const { data: existingInvoice } = await client
        .from('invoices')
        .select('id')
        .eq('student_id', student_id)
        .eq('class_id', class_id)
        .eq('invoice_period', invoicePeriod)
        .single();

      if (!existingInvoice) {
        invoicesToInsert.push({
          student_id,
          class_id,
          invoice_no: `INV-${year}-${month.toString().padStart(2, '0')}-${student_id}-${class_id}`,
          invoice_period: invoicePeriod,
          amount: classData.fee ?? 0,
          invoice_date: invoiceDate,
          due_date: dueDate,
          status: 'issued',
        });
      }
    }

    // Bulk insert new invoices
    if (invoicesToInsert.length > 0) {
      const { error: insertError } = await client
        .from('invoices')
        .insert(invoicesToInsert);

      if (insertError) {
        throw new Error(`Error inserting invoices: ${insertError.message}`);
      }
    }
  } catch (error) {
    console.error('Failed to generate invoices:', error);
    throw error;
  }
}