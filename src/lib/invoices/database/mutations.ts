import { SupabaseClient } from '@supabase/supabase-js';
import { checkUpcomingSessionAvailabilityForClass } from '~/lib/sessions/database/queries';

export async function generateMonthlyInvoices(
  client: SupabaseClient,
  year: number,
  month: number,
): Promise<void> {
  try {
    // Format month as 'YYYY-MM'
    const invoicePeriod = `${year}-${month.toString().padStart(2, '0')}`;
    const invoiceDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const dueDate = `${year}-${month.toString().padStart(2, '0')}-15`;

    // Get all student-class enrollments
    const { data: enrollments, error: enrollError } = await client
      .from('student_class_enrollments')
      .select(
        `
        student_id,
        class_id,
        class:classes!class_id (
          fee,
          name
        )
      `,
      )
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

      // Check if there are upcoming sessions for this class
      const hasUpcomingSessions =
        await checkUpcomingSessionAvailabilityForClass(client, class_id);

      // Only create invoice if there are upcoming sessions and no existing invoice
      if (!existingInvoice && hasUpcomingSessions) {
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

/**
 * Generates an invoice for a student when they register for a class
 * @param client Supabase client instance
 * @param studentId ID of the student
 * @param classId ID of the class the student registered for
 * @returns The created invoice ID or null if creation failed
 */
export async function createInvoiceForNewStudent(
  client: SupabaseClient,
  studentId: string,
  classId: string,
): Promise<string | null> {
  try {
    // Get the current date and use it for invoice generation
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JavaScript months are 0-indexed

    // Format month as 'YYYY-MM'
    const invoicePeriod = `${year}-${month.toString().padStart(2, '0')}`;
    const invoiceDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Set due date to 15 days from now
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 15);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // Get class details to determine the fee
    const { data: classData, error: classError } = await client
      .from('classes')
      .select('fee, name')
      .eq('id', classId)
      .single();

    if (classError) {
      console.error('Error fetching class data:', classError.message);
      return null;
    }

    // Check if an invoice already exists for this student-class-period combination
    const { data: existingInvoice } = await client
      .from('invoices')
      .select('id')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .eq('invoice_period', invoicePeriod)
      .single();

    // If invoice already exists, return its ID
    if (existingInvoice) {
      return existingInvoice.id;
    }

    // Create invoice number in the format: INV-YYYY-MM-studentId-classId
    const invoiceNo = `INV-${year}-${month.toString().padStart(2, '0')}-${studentId.substring(0, 6)}-${classId.substring(0, 6)}`;

    // Create the invoice
    const { data: invoice, error: insertError } = await client
      .from('invoices')
      .insert({
        student_id: studentId,
        class_id: classId,
        invoice_no: invoiceNo,
        invoice_period: invoicePeriod,
        amount: classData.fee ?? 0,
        invoice_date: invoiceDate,
        due_date: dueDateStr,
        status: 'issued', // Initial status of the invoice
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating invoice:', insertError.message);
      return null;
    }

    console.log(
      `Invoice created successfully for student ${studentId} in class ${classId}`,
    );
    return invoice.id;
  } catch (error) {
    console.error('Failed to create invoice:', error);
    return null;
  }
}
