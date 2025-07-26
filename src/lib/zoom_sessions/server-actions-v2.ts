'use server';

import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { getZoomSessionBySessionId } from './database/queries';
import getLogger from '~/core/logger';

const logger = getLogger();

const client = getSupabaseServerActionClient();

export async function fetchZoomSessionBySessionId(sessionId: string) {
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