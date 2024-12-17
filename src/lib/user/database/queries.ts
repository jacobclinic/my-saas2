import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';
import { USERS_TABLE } from '~/lib/db-tables';

/**
 * @description Fetch user object data (not auth!) by ID {@link userId}
 */
export async function getUserDataById(
  client: SupabaseClient<Database>,
  userId: string,
) {
  const result = await client
    .from(USERS_TABLE)
    .select(
      `
      id,
      displayName: display_name,
      photoUrl: photo_url
    `,
    )
    .eq('id', userId)
    .maybeSingle();

  return result.data;
}

/**
 * Fetches the user's userRole by user ID.
 * @param client Supabase client instance
 * @param userId User's ID
 */
export async function fetchUserRole(
  client: SupabaseClient,
  userId: string
): Promise<string> {
  if (!userId) {
    throw new Error('User ID is required.');
  }

  const { data, error } = await client
    .from(USERS_TABLE)
    .select('userRole')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  if (!data || !data.userRole) {
    throw new Error('Unexpected result format: userRole is missing.');
  }

  return data.userRole;
}