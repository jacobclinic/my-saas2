import { SupabaseClient } from '@supabase/supabase-js';
import {
  CLASSES_TABLE,
  INVOICES_TABLE,
  STUDENT_CLASS_ENROLLMENTS_TABLE,
  TUTOR_INVOICES_TABLE,
} from '~/lib/db-tables';
import { checkUpcomingSessionAvailabilityForClass } from '~/lib/sessions/database/queries';
import { Enrollment } from '../types/types';

export async function generateMonthlyInvoicesStudents(
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
      .from(STUDENT_CLASS_ENROLLMENTS_TABLE)
      .select(
        `
        student_id,
        class_id,
        class:${CLASSES_TABLE}!class_id (
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
          invoice_no: `${year.toString().slice(-2)}${month.toString().padStart(2, '0')}${student_id.substring(0, 4)}${class_id.substring(0, 4)}`,
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
      .from(CLASSES_TABLE)
      .select('fee, name')
      .eq('id', classId)
      .single();

    if (classError) {
      console.error('Error fetching class data:', classError.message);
      return null;
    }

    // Check if an invoice already exists for this student-class-period combination
    const { data: existingInvoice } = await client
      .from(INVOICES_TABLE)
      .select('id')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .eq('invoice_period', invoicePeriod)
      .single();

    // If invoice already exists, return its ID
    if (existingInvoice) {
      return existingInvoice.id;
    }

    // Create invoice number with exactly 12 characters: YY + MM + 4 chars from studentId + 4 chars from classId
    const invoiceNo = `${year.toString().slice(-2)}${month.toString().padStart(2, '0')}${studentId.substring(0, 4)}${classId.substring(0, 4)}`;

    // Create the invoice
    const { data: invoice, error: insertError } = await client
      .from(INVOICES_TABLE)
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

/**
 * Generates monthly invoices for tutors based on paid student invoices
 * @param client Supabase client instance
 * @param year The year for which to generate invoices
 * @param month The month for which to generate invoices
 * @returns Promise<void>
 */
export async function generateMonthlyInvoicesTutor(
  client: SupabaseClient,
  year: number,
  month: number,
): Promise<void> {
  try {
    // Format month as 'YYYY-MM'
    const invoicePeriod = `${year}-${month.toString().padStart(2, '0')}`;

    // Get all tutors with their classes
    const { data: tutorClasses, error: tutorClassesError } = await client
      .from(CLASSES_TABLE)
      .select(
        `
        id,
        fee,
        tutor_id,
        name
      `,
      )
      .eq('status', 'active');

    if (tutorClassesError) {
      throw new Error(
        `Error fetching tutor classes: ${tutorClassesError.message}`,
      );
    }

    if (!tutorClasses || tutorClasses.length === 0) {
      console.log('No active classes found');
      return;
    }

    // Group classes by tutor
    const classesByTutor = tutorClasses.reduce(
      (acc, classData) => {
        if (!acc[classData.tutor_id]) {
          acc[classData.tutor_id] = [];
        }
        acc[classData.tutor_id].push(classData);
        return acc;
      },
      {} as Record<string, typeof tutorClasses>,
    );

    const tutorInvoicesToInsert = [];

    // Process each tutor
    for (const [tutorId, classes] of Object.entries(classesByTutor)) {
      for (const classData of classes) {
        // Check if tutor invoice already exists for this class and period
        const { data: existingTutorInvoice } = await client
          .from(TUTOR_INVOICES_TABLE)
          .select('id')
          .eq('tutor_id', tutorId)
          .eq('class_id', classData.id)
          .eq('payment_period', invoicePeriod)
          .single();

        if (existingTutorInvoice) {
          continue;
        } // Get all paid student invoices for this class in the given period
        const { data: paidStudentInvoices, error: paidInvoicesError } =
          await client
            .from(INVOICES_TABLE)
            .select('amount')
            .eq('class_id', classData.id)
            .eq('invoice_period', invoicePeriod)
            .eq('status', 'paid');

        if (paidInvoicesError) {
          console.error(
            `Error fetching paid invoices for class ${classData.id}:`,
            paidInvoicesError,
          );
          continue;
        }

        // Calculate tutor payment: number of paid invoices × class fee
        const numberOfPaidInvoices = paidStudentInvoices?.length || 0;
        const classFee = classData.fee || 0;
        const tutorPayment = numberOfPaidInvoices * classFee;

        // Create invoice number with exactly 12 characters: YY + MM + 4 chars from tutorId + 4 chars from classId
        const invoiceNo = `${year.toString().slice(-2)}${month.toString().padStart(2, '0')}${tutorId.substring(0, 4)}${classData.id.substring(0, 4)}`;

        // Always create tutor invoice for active classes, even if amount is 0
        tutorInvoicesToInsert.push({
          tutor_id: tutorId,
          class_id: classData.id,
          invoice_no: invoiceNo,
          payment_period: invoicePeriod,
          amount: tutorPayment,
          status: 'issued',
        });
      }
    }

    // Bulk insert new tutor invoices
    if (tutorInvoicesToInsert.length > 0) {
      const { error: insertError } = await client
        .from(TUTOR_INVOICES_TABLE)
        .insert(tutorInvoicesToInsert);

      if (insertError) {
        throw new Error(
          `Error inserting tutor invoices: ${insertError.message}`,
        );
      }
    } else {
      console.log(
        `No active classes found to generate tutor invoices for ${invoicePeriod}`,
      );
    }
  } catch (error) {
    console.error('Failed to generate tutor invoices:', error);
    throw error;
  }
}

export async function createInvoiceForNewClass(
  client: SupabaseClient,
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

    // Get class details to determine the fee and other info
    const { data: classData, error: classError } = await client
      .from(CLASSES_TABLE)
      .select('fee, name')
      .eq('id', classId)
      .single();

    if (classError) {
      console.error('Error fetching class data:', classError.message);
      return null;
    }

    // Check if an invoice already exists for this class-period combination
    // For class-level invoices, we'll use a special student_id of null or empty
    const { data: existingInvoice } = await client
      .from(INVOICES_TABLE)
      .select('id')
      .is('student_id', null) // Class-level invoice has no specific student
      .eq('class_id', classId)
      .eq('invoice_period', invoicePeriod)
      .single();

    // If invoice already exists, return its ID
    if (existingInvoice) {
      return existingInvoice.id;
    }

    // Create invoice number with exactly 12 characters: YY + MM + 8 chars from classId
    const invoiceNo = `${year.toString().slice(-2)}${month.toString().padStart(2, '0')}${classId.substring(0, 8)}`;

    // Create the invoice with amount 0 initially (no students enrolled yet)
    const { data: invoice, error: insertError } = await client
      .from(INVOICES_TABLE)
      .insert({
        student_id: null, // Class-level invoice, not tied to specific student
        class_id: classId,
        invoice_no: invoiceNo,
        invoice_period: invoicePeriod,
        amount: 0, // Start with 0 since no students are enrolled yet
        invoice_date: invoiceDate,
        due_date: dueDateStr,
        status: 'issued', // Initial status of the invoice
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating class invoice:', insertError.message);
      return null;
    }

    console.log(`Class invoice created successfully for class ${classId}`);
    return invoice.id;
  } catch (error) {
    console.error('Failed to create class invoice:', error);
    return null;
  }
}
