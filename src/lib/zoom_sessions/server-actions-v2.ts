'use server';

import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { getZoomSessionBySessionId } from './database/queries';


const client = getSupabaseServerActionClient();

export async function fetchZoomSessionBySessionId(sessionId: string) {

  try {
    const zoomSession = await getZoomSessionBySessionId(client, sessionId);
    return zoomSession;
  } catch (error) {
    return null;
  }
}