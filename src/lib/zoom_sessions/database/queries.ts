import type { SupabaseClient } from '@supabase/supabase-js';
import getLogger from '~/core/logger';
import type { Database } from '~/database.types';

const logger = getLogger();

type Client = SupabaseClient<Database>;
const ZOOM_SESSIONS_TABLE = 'zoom_sessions';

export async function getZoomSessionBySessionId(client: Client, sessionId: string) {
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
    logger.error('Error fetching session by session ID:', error);
    throw error
  };
  return data;
}