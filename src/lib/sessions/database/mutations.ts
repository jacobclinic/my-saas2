import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/database.types';

type Client = SupabaseClient<Database>;

import { SESSIONS_TABLE } from '~/lib/db-tables';
import SessionType from '../types/session';

/**
 * @description Creates a new session
 * @param client - Supabase client instance
 * @param data - Session data (excluding the ID)
 */
export async function createSession(client: Client, data: Omit<SessionType, 'id'>) {
  try {
    const { data: insertedSession, error } = await client
      .from(SESSIONS_TABLE)
      .insert({
        startTime: data.startTime,
        classId: data.classId,
        title: data?.title,
        description: data?.description,
      })
      .select('id')
      .throwOnError()
      .single();

    if (error) throw error; // Manually throw error if any

    return insertedSession;
  } catch (error) {
    console.error("Error creating session:", error);
    throw new Error("Failed to create session. Please try again.");
  }
}

/**
 * @description Updates an existing session by ID
 * @param client - Supabase client instance
 * @param sessionId - ID of the session to update
 * @param data - Session data to update (can be partial)
 */
export async function updateSession(client: Client, sessionId: string, data: Partial<Omit<SessionType, 'id'>>) {
  try {
    const { data: updatedSession, error } = await client
      .from(SESSIONS_TABLE)
      .update(data)
      .eq('id', sessionId)
      .select('id') // Return the session ID after the update
      .throwOnError()
      .single();

    if (error) throw error; // Manually throw error if any

    return updatedSession;
  } catch (error) {
    console.error("Error updating session:", error);
    throw new Error("Failed to update session. Please check the input fields and try again.");
  }
}

/**
 * @description Deletes a session by ID
 * @param client - Supabase client instance
 * @param sessionId - ID of the session to delete
 */
export async function deleteSession(client: Client, sessionId: string) {
  try {
    const { error } = await client
      .from(SESSIONS_TABLE)
      .delete()
      .eq('id', sessionId) // Filter by sessionId
      .throwOnError();

    if (error) throw error; // Manually throw error if any

    return { message: "Session deleted successfully" };
  } catch (error) {
    console.error("Error deleting session:", error);
    throw new Error("Failed to delete session. Please try again.");
  }
}
