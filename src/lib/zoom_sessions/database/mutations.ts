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
  type?: string | null;
  status?: string | null;
  start_time: string;
  duration?: number | null;
  timezone?: string | null;
  join_url: string;
  start_url: string;
  password?: string | null;
  settings_json?: Json | null;
  creation_source?: string | null;
};

const ZOOM_SESSIONS_TABLE = 'zoom_sessions';

export async function createZoomSession(client: Client, data: CreateZoomSessionPayload) {
  try {
    const payload = {
      ...data,
      created_at: new Date().toISOString(),
    };

    console.log("Creating zoom session payload", JSON.stringify(payload));
    

    const { data: insertedZoomSession, error } = await client
      .from(ZOOM_SESSIONS_TABLE)
      .insert(payload)
      .select('id')
      .throwOnError()
      .single();

    if (error) throw error;

    return insertedZoomSession;
  } catch (error) {
    console.log(error);
    throw new Error('Failed to create zoom session. Please try again.');
  }
}