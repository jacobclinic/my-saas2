import { SupabaseClient } from '@supabase/supabase-js';
import { Logger } from 'pino';
import { failure, Result, success } from '~/lib/shared/result';
import { AppError } from '~/lib/shared/errors';
import { ErrorCodes } from '~/lib/shared/error-codes';
import { getAllEnrollmentsWithClass } from '~/lib/class-enrollments/database/queries';
import { getInvoicesByPeriod, getInvoiceByDetails } from './database/queries';
import { createInvoices, createSingleInvoice } from './database/mutations';
import { checkUpcomingSessionAvailabilityForClass } from '~/lib/sessions/database/queries';
import { Invoice } from './types/invoice';
import {
  getInvoicePeriodUTC,
  getFullDateUTC,
  getDueDateUTC,
  getPaymentPeriodFromDate,
} from '~/lib/utils/date-utils';
import { getClassFeeById } from '~/lib/classes/database/queries';
import { generateId } from '~/lib/utils/nanoid-utils';

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
      const invoicesToInsert: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>[] = [];

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
        const createResult = await createInvoices(this.supabaseClient, invoicesToInsert as Omit<Invoice, "id">[], this.logger);
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

  async createInvoiceForNewEnrollment(studentId: string,classId: string): Promise<Result<Invoice, AppError>> {
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

  async validateStudentPayment(studentId: string,classId: string,sessionDate: Date): Promise<Result<boolean, AppError>> {
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