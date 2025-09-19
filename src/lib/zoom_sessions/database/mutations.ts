import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '~/database.types';
import getLogger from '~/core/logger';

type Client = SupabaseClient<Database>;
const logger = getLogger();

export type CreateZoomSessionPayload = {
  session_id: string;
  meeting_uuid: string;
  meeting_id: string;
  host_id: string;
  host_user_id: string;
  type?: number;
  status?: string | null;
  start_time: string;
  duration?: number | null;
  timezone?: string | null;
  join_url: string;
  start_url: string;
  password?: string | null;
  settings_json?: Json | null;
  creation_source?: "other" | "open_api" | "web_portal" | null;
};

const ZOOM_SESSIONS_TABLE = 'zoom_sessions';

export async function createZoomSession(client: Client, data: CreateZoomSessionPayload) {
  try {
    const payload = {
      ...data,
      type: data.type?.toString(),
      created_at: new Date().toISOString(),
    };

    const { data: insertedZoomSession, error } = await client
      .from(ZOOM_SESSIONS_TABLE)
      .insert(payload)
      .select('id')
      .throwOnError()
      .single();

    if (error) throw error;

    return insertedZoomSession;
  } catch (error) {
    logger.error(error, 'Failed to create zoom session');
    throw new Error('Failed to create zoom session. Please try again.');
  }
}

export async function updateZoomSession(
  client: Client,
  sessionId: string,
  updates: {
    start_time?: string;
    duration?: number | null;
    settings_json?: any;
  }
) {
  try {
    const { data, error } = await client
      .from(ZOOM_SESSIONS_TABLE)
      .update(updates)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update Zoom session', { sessionId, error });
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error updating Zoom session', { sessionId, error });
    throw new Error('Error updating Zoom session');
  }
}