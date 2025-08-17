import { SupabaseClient } from '@supabase/supabase-js';
import { Logger } from 'pino';
import { failure, Result, success } from '~/lib/shared/result';
import { AppError } from '~/lib/shared/errors';
import { ErrorCodes } from '~/lib/shared/error-codes';
import { getAllEnrollmentsWithClass } from '~/lib/class-enrollments/database/queries';
import { getInvoicesByPeriod, getInvoiceByDetails } from './database/queries';
import { createInvoices, createSingleInvoice } from './database/mutations';
import { checkUpcomingSessionAvailabilityForClass } from '~/lib/sessions/database/queries';
import { Invoice, InvoiceInsert } from './types/invoice';
import { TutorInvoice } from './types/tutor-invoice';
import {
  getInvoicePeriodUTC,
  getFullDateUTC,
  getDueDateUTC,
  getPaymentPeriodFromDate,
} from '~/lib/utils/date-utils';
import { getClassFeeById } from '~/lib/classes/database/queries';
import { generateId } from '~/lib/utils/nanoid-utils';
import { getTutorInvoiceByDetails, getTutorInvoicesByClassAndPeriod } from './database/tutor-queries';
import { createTutorInvoice, updateTutorInvoice, createTutorInvoices } from './database/tutor-mutations';
import { getActiveClassesForTutorInvoices } from '~/lib/classes/database/queries';
import { getPaidStudentInvoicesByClassAndPeriod } from './database/queries';
import { TUTOR_PAYOUT_RATE } from '~/lib/constants-v2';

export class InvoiceService {
  private static instance: InvoiceService;
  private logger: Logger;
  private supabaseClient: SupabaseClient;

  private constructor(supabaseClient: SupabaseClient, logger: Logger) {
    this.supabaseClient = supabaseClient;
    this.logger = logger;
  }

  static getInstance(
    supabase: SupabaseClient,
    logger: Logger,
  ): InvoiceService {
    if (!InvoiceService.instance) {
      InvoiceService.instance = new InvoiceService(supabase, logger);
    }
    return InvoiceService.instance;
  }

  private _generateInvoiceNumber(invoicePeriod: string): string {
    const randomPart = generateId(8);
    return `${invoicePeriod}-${randomPart}`;
  }

  // Runs on 1st of every month to generate invoices for all students who have enrolled in classes that month
  async generateMonthlyStudentInvoices(): Promise<Result<void, AppError>> {
    try {
      this.logger.info('Starting monthly student invoice generation.');
      const now = new Date();

      const invoicePeriod = getInvoicePeriodUTC(now);
      const invoiceDate = getFullDateUTC(now);
      const dueDate = getDueDateUTC(now);

      const [enrollmentsResult, existingInvoicesResult] = await Promise.all([
        getAllEnrollmentsWithClass(this.supabaseClient, this.logger),
        getInvoicesByPeriod(this.supabaseClient, invoicePeriod, this.logger),
      ]);

      if (!enrollmentsResult.success) {
        return failure(new AppError('Failed to fetch enrollments.', ErrorCodes.DATABASE_ERROR));
      }
      if (!existingInvoicesResult.success) {
        return failure(new AppError('Failed to fetch existing invoices.', ErrorCodes.DATABASE_ERROR));
      }

      const enrollments = enrollmentsResult.data;
      const existingInvoices = existingInvoicesResult.data;
      const invoicesToInsert: InvoiceInsert[] = [];

      for (const enrollment of enrollments) {
        const { student_id, class_id, class: classData } = enrollment;

        const invoiceExists = existingInvoices.some(
          (inv: Pick<Invoice, 'id' | 'student_id' | 'class_id' | 'invoice_period'>) =>
            inv.student_id === student_id &&
            inv.class_id === class_id &&
            inv.invoice_period === invoicePeriod
        );

        if (invoiceExists) {
          continue;
        }

        const hasUpcomingSessions = await checkUpcomingSessionAvailabilityForClass(this.supabaseClient, class_id);

        if (hasUpcomingSessions) {
          invoicesToInsert.push({
            student_id,
            class_id,
            invoice_no: this._generateInvoiceNumber(invoicePeriod),
            invoice_period: invoicePeriod,
            amount: classData.fee ?? 0,
            invoice_date: invoiceDate,
            due_date: dueDate,
            status: 'issued',
          });
        }
      }

      if (invoicesToInsert.length > 0) {
        const createResult = await createInvoices(this.supabaseClient, invoicesToInsert, this.logger);
        if (!createResult.success) {
          return failure(new AppError('Failed to create invoices.', ErrorCodes.DATABASE_ERROR));
        }
        this.logger.info(`Successfully created ${invoicesToInsert.length} new invoices for the period: ${invoicePeriod}`);
      } else {
        this.logger.info('No new invoices needed to be generated.');
      }

      return success(undefined);
    } catch (error) {
      this.logger.error('Something went wrong while generating the monthly student invoices', {
        error: error,
      });
      return failure(
        new AppError(
          'Something went wrong while generating the monthly student invoices',
          ErrorCodes.SERVICE_LEVEL_ERROR
        )
      );
    }
  }

  async createInvoiceForNewEnrollment(studentId: string, classId: string): Promise<Result<InvoiceInsert, AppError>> {
    try {
      const now = new Date();
      const invoicePeriod = getInvoicePeriodUTC(now);

      const existingInvoiceResult = await getInvoiceByDetails(this.supabaseClient, studentId, classId, invoicePeriod, this.logger);

      if (!existingInvoiceResult.success) {
        return failure(new AppError('Failed to check for existing invoice.', ErrorCodes.DATABASE_ERROR));
      }

      if (existingInvoiceResult.data) {
        this.logger.info('Invoice already exists for this enrollment period.', { studentId, classId, invoicePeriod });
        return success(existingInvoiceResult.data);
      }

      const classFeeResult = await getClassFeeById(this.supabaseClient, classId);
      if (!classFeeResult.success || classFeeResult.data === null) {
        return failure(new AppError('Failed to retrieve class fee.', ErrorCodes.DATABASE_ERROR));
      }

      const invoiceDate = getFullDateUTC(now);
      const dueDate = getDueDateUTC(now);

      const newInvoiceData = {
        student_id: studentId,
        class_id: classId,
        invoice_no: this._generateInvoiceNumber(invoicePeriod),
        invoice_period: invoicePeriod,
        amount: classFeeResult.data,
        invoice_date: invoiceDate,
        due_date: dueDate,
        status: 'issued' as const,
      };

      const createResult = await createSingleInvoice(this.supabaseClient, newInvoiceData, this.logger);

      if (!createResult.success) {
        return failure(new AppError('Failed to create new invoice.', ErrorCodes.DATABASE_ERROR));
      }

      this.logger.info('Successfully created new invoice for enrollment.', { invoiceId: createResult.data.id });
      return success(createResult.data);

    } catch (error) {
      this.logger.error('An unexpected error occurred while creating invoice for new enrollment.', { error });
      return failure(new AppError('An unexpected error occurred.', ErrorCodes.INTERNAL_SERVER_ERROR));
    }
  }

  async createInvoiceForNewClass(
    tutorId: string,
    classId: string
  ): Promise<Result<TutorInvoice, AppError>> {
    try {
      const now = new Date();
      const paymentPeriod = getInvoicePeriodUTC(now);

      const existingInvoiceResult = await getTutorInvoiceByDetails(
        this.supabaseClient,
        tutorId,
        classId,
        paymentPeriod,
        this.logger
      );

      if (!existingInvoiceResult.success) {
        return failure(new AppError('Failed to check for existing tutor invoice.', ErrorCodes.DATABASE_ERROR));
      }

      if (existingInvoiceResult.data) {
        this.logger.info('Tutor invoice already exists for this period.', { tutorId, classId, paymentPeriod });
        return success(existingInvoiceResult.data);
      }

      const newInvoiceData = {
        tutor_id: tutorId,
        class_id: classId,
        invoice_no: this._generateInvoiceNumber(paymentPeriod),
        payment_period: paymentPeriod,
        amount: 0, // Initial amount is 0 since no students are enrolled yet
        status: 'issued' as const,
        payment_url: null,
      };

      const createResult = await createTutorInvoice(
        this.supabaseClient,
        newInvoiceData,
        this.logger
      );

      if (!createResult.success) {
        return failure(new AppError('Failed to create new tutor invoice.', ErrorCodes.DATABASE_ERROR));
      }

      this.logger.info('Successfully created new invoice for class.', { invoiceId: createResult.data.id });
      return success(createResult.data);

    } catch (error) {
      this.logger.error('An unexpected error occurred while creating invoice for new class.', { error });
      return failure(new AppError('An unexpected error occurred.', ErrorCodes.INTERNAL_SERVER_ERROR));
    }
  }

  // Runs monthly to generate invoices for tutors based on paid student invoices
  async generateMonthlyTutorInvoices(): Promise<Result<void, AppError>> {
    try {
      this.logger.info('Starting monthly tutor invoice generation.');
      const now = new Date();
      // Set the date to 15th to omit the timezone issues. 
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
      const invoicePeriod = getInvoicePeriodUTC(previousMonth);

      const activeClassesResult = await getActiveClassesForTutorInvoices(this.supabaseClient);
      if (!activeClassesResult.success) {
        return failure(new AppError('Failed to fetch active classes.', ErrorCodes.DATABASE_ERROR));
      }

      const tutorClasses = activeClassesResult.data;
      if (tutorClasses.length === 0) {
        this.logger.info('No active classes found');
        return success(undefined);
      }

      const classesByTutor = tutorClasses.reduce(
        (acc, classData) => {
          if (!acc[classData.tutor_id]) {
            acc[classData.tutor_id] = [];
          }
          acc[classData.tutor_id].push(classData);
          return acc;
        },
        {} as Record<string, typeof tutorClasses>
      );

      const tutorInvoicesToInsert: Omit<TutorInvoice, 'id' | 'created_at'>[] = [];

      for (const [tutorId, classes] of Object.entries(classesByTutor)) {
        for (const classData of classes) {
          const existingInvoicesResult = await getTutorInvoicesByClassAndPeriod(
            this.supabaseClient,
            classData.id,
            invoicePeriod,
            this.logger
          );

          if (!existingInvoicesResult.success) {
            this.logger.error('Failed to fetch existing tutor invoices', { classId: classData.id });
            continue;
          }

          const existingInvoice = existingInvoicesResult.data[0]; // Should be only one per class/period

          const paidInvoicesResult = await getPaidStudentInvoicesByClassAndPeriod(
            this.supabaseClient,
            classData.id,
            invoicePeriod,
            this.logger
          );

          if (!paidInvoicesResult.success) {
            this.logger.error('Failed to fetch paid student invoices', { classId: classData.id });
            continue;
          }

          // Calculate tutor payment: number of paid invoices × class fee × payout rate
          const numberOfPaidInvoices = paidInvoicesResult.data.length;
          const classFee = classData.fee || 0;
          const totalRevenue = numberOfPaidInvoices * classFee;
          const tutorPayment = totalRevenue * TUTOR_PAYOUT_RATE;

          if (existingInvoice) {
            const updateResult = await updateTutorInvoice(
              this.supabaseClient,
              existingInvoice.id,
              tutorPayment,
              this.logger
            );

            if (!updateResult.success) {
              this.logger.error('Failed to update tutor invoice', { invoiceId: existingInvoice.id });
            }
          } else {
            tutorInvoicesToInsert.push({
              tutor_id: tutorId,
              class_id: classData.id,
              invoice_no: this._generateInvoiceNumber(invoicePeriod),
              payment_period: invoicePeriod,
              amount: tutorPayment,
              status: 'issued',
              payment_url: null,
            });
          }
        }
      }

      if (tutorInvoicesToInsert.length > 0) {
        const createResult = await createTutorInvoices(
          this.supabaseClient,
          tutorInvoicesToInsert,
          this.logger
        );

        if (!createResult.success) {
          return failure(new AppError('Failed to create tutor invoices.', ErrorCodes.DATABASE_ERROR));
        }

        this.logger.info(`Successfully created ${tutorInvoicesToInsert.length} new tutor invoices for period: ${invoicePeriod}`);
      } else {
        this.logger.info(`No new tutor invoices needed for period: ${invoicePeriod}`);
      }

      return success(undefined);
    } catch (error) {
      this.logger.error('Something went wrong while generating monthly tutor invoices', { error });
      return failure(
        new AppError(
          'Something went wrong while generating monthly tutor invoices',
          ErrorCodes.SERVICE_LEVEL_ERROR
        )
      );
    }
  }

  // Check if the student has paid for the invoice (or the class for the invoice period)
  async validateStudentPayment(studentId: string, classId: string, sessionDate: Date): Promise<Result<boolean, AppError>> {
    try {
      const invoicePeriod = getPaymentPeriodFromDate(sessionDate);

      const invoiceResult = await getInvoiceByDetails(this.supabaseClient, studentId, classId, invoicePeriod, this.logger);

      if (!invoiceResult.success) {
        this.logger.error('Failed to retrieve invoice for payment validation.', { studentId, classId, invoicePeriod });
        return failure(new AppError('Failed to retrieve invoice for validation.', ErrorCodes.DATABASE_ERROR));
      }

      const invoice = invoiceResult.data;
      if (!invoice || invoice.status !== 'paid') {
        this.logger.warn('Payment validation failed: Invoice not found or not paid.', { studentId, classId, invoicePeriod });
        return success(false);
      }

      this.logger.info('Payment validation successful.', { studentId, classId, invoicePeriod });
      return success(true);

    } catch (error) {
      this.logger.error('An unexpected error occurred during payment validation.', { error });
      return failure(new AppError('An unexpected error occurred during payment validation.', ErrorCodes.INTERNAL_SERVER_ERROR));
    }
  }
}