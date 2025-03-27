import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';
import { USERS_TABLE } from '~/lib/db-tables';
import UserType from '../types/user';

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
      photoUrl: photo_url,
      first_name,
      last_name
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
    .select('user_role')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  if (!data || !data.user_role) {
    throw new Error('Unexpected result format: user role is missing.');
  }

  return data.user_role;
}


export async function getAllUsersByUserRoleData(
  client: SupabaseClient<Database>,
  userRole: string
): Promise<UserType[] | []> {
  try {
    const { data, error } = await client
      .from(USERS_TABLE)
      .select()
      .eq('user_role', userRole)

    // console.log("getAllUsersData", data)

    if (error) {
      throw new Error(`Error fetching all users: ${error.message}`);
    }

    if (!data) {
      return [];
    }
    
    return data;

  } catch (error) {
    console.error('Failed to fetch all users:', error);
    throw error;
  }
}