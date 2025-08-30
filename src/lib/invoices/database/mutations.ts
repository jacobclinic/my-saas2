import { SupabaseClient } from '@supabase/supabase-js';
import {
  CLASSES_TABLE,
  INVOICES_TABLE,
  STUDENT_CLASS_ENROLLMENTS_TABLE,
  TUTOR_INVOICES_TABLE,
} from '~/lib/db-tables';
import { checkUpcomingSessionAvailabilityForClass } from '~/lib/sessions/database/queries';
import { Enrollment } from '../types/types';
import { TUTOR_PAYOUT_RATE } from '~/lib/constants-v2';
import getLogger from '~/core/logger';

const logger = getLogger();

/**
 * @deprecated Use InvoiceService.generateMonthlyStudentInvoices instead.
 */
export async function generateMonthlyInvoicesStudents(
  client: SupabaseClient,
  year: number,
  month: number,
): Promise<void> {
  const startTime = performance.now();
  try {
    logger.info(
      `[Student Invoices] Starting generation for ${year}-${month.toString().padStart(2, '0')}`,
    );

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

    if (!enrollments || enrollments.length === 0) {
      logger.info(
        '[Student Invoices] No enrollments found for student invoice generation',
      );
      return;
    }

    logger.info(
      `[Student Invoices] Found ${enrollments.length} enrollments to process`,
    );

    // Get all existing invoices for this period in bulk
    const { data: existingInvoices, error: existingError } = await client
      .from(INVOICES_TABLE)
      .select('student_id, class_id')
      .eq('invoice_period', invoicePeriod);

    if (existingError) {
      throw new Error(
        `Error fetching existing invoices: ${existingError.message}`,
      );
    }

    logger.info(
      `[Student Invoices] Found ${existingInvoices?.length || 0} existing invoices for ${invoicePeriod}`,
    );

    // Create a Set for faster lookups of existing invoices
    const existingInvoiceKeys = new Set(
      existingInvoices?.map((inv) => `${inv.student_id}-${inv.class_id}`) || [],
    );

    const invoicesToInsert = [];

    // Process enrollments in smaller batches to avoid memory issues
    const BATCH_SIZE = 50;
    for (let i = 0; i < enrollments.length; i += BATCH_SIZE) {
      const batch = enrollments.slice(i, i + BATCH_SIZE);
      const batchClassIds = Array.from(new Set(batch.map((e) => e.class_id)));

      // Check sessions for all classes in this batch at once
      const sessionsPromises = batchClassIds.map((classId) =>
        checkUpcomingSessionAvailabilityForClass(client, classId),
      );
      const sessionsResults = await Promise.all(sessionsPromises);
      const classesWithSessions = new Set(
        batchClassIds.filter((_, index) => sessionsResults[index]),
      );

      // Process enrollments in this batch
      for (const enrollment of batch) {
        const { student_id, class_id, class: classData } = enrollment;
        const enrollmentKey = `${student_id}-${class_id}`;

        // Only create invoice if there are upcoming sessions and no existing invoice
        if (
          !existingInvoiceKeys.has(enrollmentKey) &&
          classesWithSessions.has(class_id)
        ) {
          invoicesToInsert.push({
            student_id,
            class_id,
            invoice_no: `${year.toString().slice(-2)}${month.toString().padStart(2, '0')}${student_id.substring(0, 6)}${class_id.substring(0, 6)}`,
            invoice_period: invoicePeriod,
            amount: classData.fee ?? 0,
            invoice_date: invoiceDate,
            due_date: dueDate,
            status: 'issued',
          });
        }
      }
    }

    // Bulk insert new invoices in smaller batches to avoid timeout
    if (invoicesToInsert.length > 0) {

      const INSERT_BATCH_SIZE = 100;
      for (let i = 0; i < invoicesToInsert.length; i += INSERT_BATCH_SIZE) {
        const insertBatch = invoicesToInsert.slice(i, i + INSERT_BATCH_SIZE);
        const { error: insertError } = await client
          .from(INVOICES_TABLE)
          .insert(insertBatch);

        if (insertError) {
          throw new Error(
            `Error inserting student invoices batch ${i / INSERT_BATCH_SIZE + 1}: ${insertError.message}`,
          );
        }
      }
    } else {
      logger.info(
        `[Student Invoices] No new student invoices to create for ${invoicePeriod}`,
      );
    }

    const endTime = performance.now();
    logger.info(
      `[Student Invoices] Completed in ${Math.round((endTime - startTime) / 1000)}s`,
    );
  } catch (error) {
    logger.error(
      '[Student Invoices] Failed to generate student invoices:',
      error,
    );
    throw error;
  }
}

/**
 * Generates an invoice for a student when they register for a class
 * @param client Supabase client instance
 * @param studentId ID of the student
 * @param classId ID of the class the student registered for
 * @returns The created invoice ID or null if creation failed
 * @deprecated Use InvoiceService.createInvoiceForNewEnrollment instead.
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

    // Create invoice number with exactly 16 characters: YY + MM + 6 chars from studentId + 6 chars from classId
    const invoiceNo = `${year.toString().slice(-2)}${month.toString().padStart(2, '0')}${studentId.substring(0, 6)}${classId.substring(0, 6)}`;

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
 * @deprecated Use InvoiceService.generateMonthlyTutorInvoices instead
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
  const startTime = performance.now();
  try {
    logger.info(
      `[Tutor Invoices] Starting generation for ${year}-${month.toString().padStart(2, '0')}`,
    );

    // Format month as 'YYYY-MM'
    const invoicePeriod = `${year}-${month.toString().padStart(2, '0')}`;

    // Get all tutors with their classes in one query
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
      logger.info(
        '[Tutor Invoices] No active classes found for tutor invoice generation',
      );
      return;
    }

    logger.info(
      `[Tutor Invoices] Found ${tutorClasses.length} active classes to process`,
    );

    // Get all existing tutor invoices for this period in one query
    const { data: existingTutorInvoices, error: existingTutorError } =
      await client
        .from(TUTOR_INVOICES_TABLE)
        .select('id, tutor_id, class_id')
        .eq('payment_period', invoicePeriod);

    if (existingTutorError) {
      throw new Error(
        `Error fetching existing tutor invoices: ${existingTutorError.message}`,
      );
    }

    logger.info(
      `[Tutor Invoices] Found ${existingTutorInvoices?.length || 0} existing tutor invoices for ${invoicePeriod}`,
    );

    // Create lookup map for existing tutor invoices
    const existingTutorInvoiceMap = new Map();
    existingTutorInvoices?.forEach((invoice) => {
      const key = `${invoice.tutor_id}-${invoice.class_id}`;
      existingTutorInvoiceMap.set(key, invoice);
    });

    // Get all paid student invoices for this period in one query
    const classIds = tutorClasses.map((c) => c.id);
    const { data: paidInvoices, error: paidInvoicesError } = await client
      .from(INVOICES_TABLE)
      .select('class_id, amount')
      .in('class_id', classIds)
      .eq('invoice_period', invoicePeriod)
      .eq('status', 'paid');

    if (paidInvoicesError) {
      throw new Error(
        `Error fetching paid invoices: ${paidInvoicesError.message}`,
      );
    }

    logger.info(
      `[Tutor Invoices] Found ${paidInvoices?.length || 0} paid student invoices for calculation`,
    );

    // Group paid invoices by class_id for easier lookup
    const paidInvoicesByClass = new Map();
    paidInvoices?.forEach((invoice) => {
      if (!paidInvoicesByClass.has(invoice.class_id)) {
        paidInvoicesByClass.set(invoice.class_id, []);
      }
      paidInvoicesByClass.get(invoice.class_id).push(invoice);
    });

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
    const tutorInvoicesToUpdate = [];

    // Process each tutor and their classes
    for (const [tutorId, classes] of Object.entries(classesByTutor)) {
      for (const classData of classes) {
        const invoiceKey = `${tutorId}-${classData.id}`;
        const existingInvoice = existingTutorInvoiceMap.get(invoiceKey);

        // Get paid invoices for this class
        const classPaidInvoices = paidInvoicesByClass.get(classData.id) || [];

        // Calculate tutor payment: number of paid invoices × class fee × tutor payout rate
        const numberOfPaidInvoices = classPaidInvoices.length;
        const classFee = classData.fee || 0;
        const totalRevenue = numberOfPaidInvoices * classFee;
        const tutorPayment = totalRevenue * TUTOR_PAYOUT_RATE;

        // Create invoice number with exactly 16 characters
        const invoiceNo = `${year.toString().slice(-2)}${month.toString().padStart(2, '0')}${tutorId.substring(0, 6)}${classData.id.substring(0, 6)}`;

        if (existingInvoice) {
          // Update existing invoice
          tutorInvoicesToUpdate.push({
            id: existingInvoice.id,
            amount: tutorPayment,
          });
        } else {
          // Create new invoice (even if amount is 0)
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
    }

    // Batch update existing invoices
    if (tutorInvoicesToUpdate.length > 0) {
      logger.info(
        `[Tutor Invoices] Updating ${tutorInvoicesToUpdate.length} existing tutor invoices for ${invoicePeriod}`,
      );

      // Process updates in smaller batches
      const UPDATE_BATCH_SIZE = 50;
      for (
        let i = 0;
        i < tutorInvoicesToUpdate.length;
        i += UPDATE_BATCH_SIZE
      ) {
        const updateBatch = tutorInvoicesToUpdate.slice(
          i,
          i + UPDATE_BATCH_SIZE,
        );

        // Use Promise.all to update in parallel within each batch
        const updatePromises = updateBatch.map((invoice) =>
          client
            .from(TUTOR_INVOICES_TABLE)
            .update({ amount: invoice.amount })
            .eq('id', invoice.id),
        );

        const results = await Promise.all(updatePromises);
        const failed = results.filter((result) => result.error);

        if (failed.length > 0) {
          logger.error(
            `[Tutor Invoices] Failed to update ${failed.length} tutor invoices in batch ${i / UPDATE_BATCH_SIZE + 1}`,
          );
          failed.forEach((result, index) => {
            logger.error(
              `Update error for invoice ${updateBatch[index].id}:`,
              result.error,
            );
          });
        }
      }
    }

    // Batch insert new tutor invoices
    if (tutorInvoicesToInsert.length > 0) {
      logger.info(
        `[Tutor Invoices] Creating ${tutorInvoicesToInsert.length} new tutor invoices for ${invoicePeriod}`,
      );

      const INSERT_BATCH_SIZE = 100;
      for (
        let i = 0;
        i < tutorInvoicesToInsert.length;
        i += INSERT_BATCH_SIZE
      ) {
        const insertBatch = tutorInvoicesToInsert.slice(
          i,
          i + INSERT_BATCH_SIZE,
        );
        const { error: insertError } = await client
          .from(TUTOR_INVOICES_TABLE)
          .insert(insertBatch);

        if (insertError) {
          throw new Error(
            `Error inserting tutor invoices batch ${i / INSERT_BATCH_SIZE + 1}: ${insertError.message}`,
          );
        }
      }
    } else {
      logger.info(
        `[Tutor Invoices] No new tutor invoices to create for ${invoicePeriod}`,
      );
    }

    const endTime = performance.now();
    logger.info(
      `[Tutor Invoices] Completed tutor invoice generation for ${invoicePeriod} in ${Math.round((endTime - startTime) / 1000)}s: ${tutorInvoicesToInsert.length} new, ${tutorInvoicesToUpdate.length} updated`,
    );
  } catch (error) {
    logger.error('[Tutor Invoices] Failed to generate tutor invoices:', error);
    throw error;
  }
}

