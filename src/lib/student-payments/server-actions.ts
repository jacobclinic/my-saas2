'use server';

import { revalidatePath } from 'next/cache';
import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { uploadPaymentSlip } from '../utils/upload-material-utils';
import { PAYMENT_STATUS } from './constant';
import getLogger from '~/core/logger';

export const uploadPaymentSlipAction = withSession(
  async ({
    studentId,
    classId,
    paymentPeriod,
    file: { name, type, size, buffer },
    csrfToken,
  }: {
    studentId: string;
    classId: string;
    paymentPeriod: string;
    file: {
      name: string;
      type: string;
      size: number;
      buffer: number[];
    };
    csrfToken: string;
  }) => {
    const logger = getLogger();
    const actionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    logger.info(
      '[uploadPaymentSlipAction] Starting payment slip upload action',
      {
        actionId,
        studentId,
        classId,
        paymentPeriod,
        fileInfo: {
          name,
          type,
          size,
          bufferLength: buffer.length,
        },
        csrfTokenPresent: !!csrfToken,
      },
    );

    const client = getSupabaseServerActionClient();

    // Log session info
    try {
      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();
      if (userError) {
        logger.warn('[uploadPaymentSlipAction] Session check warning', {
          actionId,
          error: userError.message,
        });
      } else {
        logger.info('[uploadPaymentSlipAction] Session validated', {
          actionId,
          userId: user?.id,
          userEmail: user?.email,
        });
      }
    } catch (sessionError) {
      logger.error('[uploadPaymentSlipAction] Session validation failed', {
        actionId,
        error:
          sessionError instanceof Error
            ? sessionError.message
            : String(sessionError),
      });
    }

    try {
      logger.info(
        '[uploadPaymentSlipAction] Calling uploadPaymentSlip utility',
        {
          actionId,
        },
      );

      const { url, error } = await uploadPaymentSlip(
        client,
        {
          name,
          type,
          buffer,
        },
        studentId,
        classId,
        paymentPeriod,
      );

      if (error) {
        logger.error('[uploadPaymentSlipAction] Upload to storage failed', {
          actionId,
          error: error.message,
          stack: error.stack,
        });
        throw error;
      }

      logger.info(
        '[uploadPaymentSlipAction] File uploaded to storage successfully',
        {
          actionId,
          url,
        },
      );

      // First, find the invoice for this student, class, and period
      logger.info('[uploadPaymentSlipAction] Searching for invoice', {
        actionId,
        studentId,
        classId,
        paymentPeriod,
      });

      const { data: invoice, error: invoiceError } = await client
        .from('invoices')
        .select('id, amount')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .eq('invoice_period', paymentPeriod)
        .single();

      if (invoiceError) {
        logger.error('[uploadPaymentSlipAction] Error finding invoice', {
          actionId,
          error: invoiceError.message,
          code: invoiceError.code,
          details: invoiceError.details,
          hint: invoiceError.hint,
        });
        throw invoiceError;
      }

      if (!invoice) {
        logger.error('[uploadPaymentSlipAction] No invoice found for payment', {
          actionId,
          studentId,
          classId,
          paymentPeriod,
        });
        throw new Error('No invoice found for this payment period');
      }

      logger.info('[uploadPaymentSlipAction] Invoice found successfully', {
        actionId,
        invoiceId: invoice.id,
        amount: invoice.amount,
      });

      // Check if there's an existing payment record (especially a rejected one)
      logger.info('[uploadPaymentSlipAction] Checking for existing payments', {
        actionId,
        invoiceId: invoice.id,
      });

      const { data: existingPayments, error: existingPaymentError } =
        await client
          .from('student_payments')
          .select('id, status')
          .eq('invoice_id', invoice.id)
          .order('created_at', { ascending: false });

      if (existingPaymentError) {
        logger.error(
          '[uploadPaymentSlipAction] Error checking existing payment',
          {
            actionId,
            error: existingPaymentError.message,
            code: existingPaymentError.code,
            details: existingPaymentError.details,
            hint: existingPaymentError.hint,
          },
        );
        throw existingPaymentError;
      }

      logger.info(
        '[uploadPaymentSlipAction] Existing payments check completed',
        {
          actionId,
          existingPaymentsCount: existingPayments?.length || 0,
          existingPayments: existingPayments?.map((p) => ({
            id: p.id,
            status: p.status,
          })),
        },
      );

      // If we have existing payments, update the most recent one
      if (existingPayments && existingPayments.length > 0) {
        const mostRecentPayment = existingPayments[0];
        logger.info('[uploadPaymentSlipAction] Updating existing payment', {
          actionId,
          paymentId: mostRecentPayment.id,
          currentStatus: mostRecentPayment.status,
        });

        // Update the existing payment record
        const { error: updateError } = await client
          .from('student_payments')
          .update({
            payment_proof_url: url, // Override with new receipt
            status: PAYMENT_STATUS.PENDING_VERIFICATION, // Change status to processing
            payment_date: new Date().toISOString(),
            notes:
              existingPayments[0].status === PAYMENT_STATUS.REJECTED
                ? 'Resubmitted after rejection'
                : undefined,
          })
          .eq('id', mostRecentPayment.id);

        if (updateError) {
          logger.error('[uploadPaymentSlipAction] Error updating payment', {
            actionId,
            paymentId: mostRecentPayment.id,
            error: updateError.message,
            code: updateError.code,
            details: updateError.details,
            hint: updateError.hint,
          });
          throw updateError;
        }

        logger.info(
          '[uploadPaymentSlipAction] Existing payment updated successfully',
          {
            actionId,
            paymentId: mostRecentPayment.id,
            newStatus: PAYMENT_STATUS.PENDING_VERIFICATION,
          },
        );
      } else {
        logger.info('[uploadPaymentSlipAction] Creating new payment record', {
          actionId,
          invoiceId: invoice.id,
          amount: invoice.amount,
        });

        // Create a new payment record if none exists
        const { error: dbError } = await client
          .from('student_payments')
          .insert({
            student_id: studentId,
            class_id: classId,
            invoice_id: invoice.id,
            payment_proof_url: url,
            payment_period: paymentPeriod,
            amount: invoice.amount,
            status: PAYMENT_STATUS.PENDING_VERIFICATION,
            created_at: new Date().toISOString(),
            payment_date: new Date().toISOString(),
          });

        if (dbError) {
          logger.error(
            '[uploadPaymentSlipAction] Error creating new payment record',
            {
              actionId,
              error: dbError.message,
              code: dbError.code,
              details: dbError.details,
              hint: dbError.hint,
            },
          );
          throw dbError;
        }

        logger.info(
          '[uploadPaymentSlipAction] New payment record created successfully',
          {
            actionId,
            status: PAYMENT_STATUS.PENDING_VERIFICATION,
          },
        );
      }

      logger.info(
        '[uploadPaymentSlipAction] Payment slip upload action completed successfully',
        {
          actionId,
          url,
        },
      );

      revalidatePath('/dashboard');
      return { success: true, url };
    } catch (error: any) {
      logger.error('[uploadPaymentSlipAction] Server error occurred', {
        actionId,
        error: error?.message || String(error),
        stack: error?.stack,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      return { success: false, error: error.message };
    }
  },
);
