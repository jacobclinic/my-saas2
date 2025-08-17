'use server';

import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { getZoomSessionBySessionId } from './database/queries';
import getLogger from '~/core/logger';
import { getSessionById } from '../sessions/database/queries';
import { InvoiceService } from '../invoices/v2/invoice.service';

const logger = getLogger();

const client = getSupabaseServerActionClient();

export async function fetchZoomSessionBySessionIdAction(sessionId: string) {
  try {
    if (!sessionId) {
      console.error('fetchZoomSessionBySessionId: No session ID provided');
      return null;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      console.error('fetchZoomSessionBySessionId: Invalid session ID format:', sessionId);
      return null;
    }

    const zoomSession = await getZoomSessionBySessionId(client, sessionId);
    return zoomSession;
  } catch (error) {
    logger.error('Error in fetchZoomSessionBySessionId:', error);
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      if (error.code === 'PGRST116') {
        return null;
      }
    }
    throw new Error("Failed to fetch session by session ID");
  }
}

export async function validateStudentPaymentForSessionAction(sessionId: string, classId: string, userId: string): Promise<boolean> {
  try {
    if (!sessionId || !classId || !userId) {
      logger.error('validateStudentPaymentForSession: Missing one or more required parameters.', { sessionId, classId, userId });
      return false;
    }

    const sessionData = await getSessionById(client, sessionId);

    if (!sessionData || !sessionData.start_time) {
      logger.error('validateStudentPaymentForSession: Session or session start time not found.', { sessionId });
      return false;
    }

    const sessionDate = new Date(sessionData.start_time);
    
    const invoiceService = InvoiceService.getInstance(client, logger);
    const validationResult = await invoiceService.validateStudentPayment(userId, classId, sessionDate);

    if (!validationResult.success) {
      logger.error('validateStudentPaymentForSession: Failed to validate payment.', { error: validationResult.error });
      return false;
    }

    return validationResult.data;
  } catch (error) {
    logger.error('An unexpected error occurred in validateStudentPaymentForSessionAction.', { error });
    return false;
  }
}
