import type { SupabaseClient } from '@supabase/supabase-js';
import getLogger from '~/core/logger';
import type { Database } from '~/database.types';

const logger = getLogger();

type Client = SupabaseClient<Database>;
const ZOOM_SESSIONS_TABLE = 'zoom_sessions';

export async function getZoomSessionBySessionId(client: Client, sessionId: string): Promise<any | null> {
  const { data, error } = await client
    .from(ZOOM_SESSIONS_TABLE)
    .select(`
      *,
      tutor:host_user_id (
        id,
        email,
        first_name,
        last_name
      )
    `)
    .eq('session_id', sessionId)
    .single();

  if (error) {
    // Handle the case where no zoom session exists yet (normal for future sessions)
    if (error.code === 'PGRST116') {
      logger.info(`No zoom session found for session ${sessionId} - this is normal for future sessions`);
      return null;
    }
    logger.error('Error fetching session by session ID:', error);
    throw error;
  }
  return data;
}

export async function getZoomSessionByZoomMeetingId(client: Client, zoomMeetingId: string) {
  try{
    const { data, error } = await client
    .from(ZOOM_SESSIONS_TABLE)
    .select('*')
    .eq('meeting_id', zoomMeetingId)
    .single();

    if (error) {
      logger.error('Error fetching session by zoom meeting ID:', error);
      throw error
    };
    return data;
  } catch (error) {
    logger.error('Error fetching session by zoom meeting ID:', error);
    throw error
  }
}