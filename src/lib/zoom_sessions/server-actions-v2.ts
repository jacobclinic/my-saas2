'use server';

import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { getZoomSessionBySessionId } from './database/queries';
import getLogger from '~/core/logger';
import { getStudentPaymentsByPeriod } from '../payments/database/queries';
import { getSessionById } from '../sessions/database/queries';
import { getPaymentPeriodFromDate } from '../utils/date-utils';

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
    if (!sessionId || !userId) {
      console.error('validateStudentPaymentForSession: Missing parameters');
      return false;
    }
    const sessionData = await getSessionById(client, sessionId);

    if (!sessionData) {
      logger.error('validateStudentPaymentForSession: Session not found for ID:', sessionId);
      return false;
    }

    if (!sessionData.start_time) {
      logger.error('validateStudentPaymentForSession: Session start_time is missing for ID:', sessionId);
      return false;
    }

    const sessionDate = new Date(sessionData.start_time);
    const paymentPeriod = getPaymentPeriodFromDate(sessionDate);

    const paymentStatus = await getStudentPaymentsByPeriod(client, userId, classId, paymentPeriod);
    for (const payment of paymentStatus) {
      if (payment.status === 'paid' && payment.payment_period === paymentPeriod) {
        logger.info(`validateStudentPaymentForSession: Payment valid for user ${userId} in period ${paymentPeriod}`);
        return !!(payment.invoice && payment.invoice.status === 'paid')
      } 
    }
    logger.warn(`validateStudentPaymentForSession: No valid payment found for user ${userId} in period ${paymentPeriod}`);
    return false;
  } catch (error) {
    logger.error('Error in validateStudentPaymentForSession:', error);
    return false;
  }
}
