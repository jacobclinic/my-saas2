import type { SupabaseClient } from '@supabase/supabase-js';
import type UserData from '~/core/session/types/user-data';
import { USERS_TABLE } from '~/lib/db-tables';

/**
 * @name updateUserData
 * @param client
 * @param id
 * @param data
 */
export function updateUserData(
  client: SupabaseClient,
  { id, ...data }: WithId<Partial<UserData>>
) {
  return client
    .from(USERS_TABLE)
    .update({
      display_name: data.displayName,
      photo_url: data.photoUrl,
      first_name: data.first_name,
      last_name: data.last_name,
      phone_number: data.phone_number,
      address: data.address,
    })
    .match({ id })
    .throwOnError();
}

/**
 * @name createUser
 * @param client
 * @param data
 */
export async function createUser(client: SupabaseClient, data: UserData) {
  return client.from(USERS_TABLE).insert(data).throwOnError();
}


export async function insertUserData(client: SupabaseClient,{
  id,
  first_name,
  last_name,
  phone_number,
  address,
  displayName,
  photoUrl,
}: UserData) {
  const { data: existingUser, error: searchError } = await client
    .from(USERS_TABLE)
    .select('id')
    .eq('id', id)
    .single();

  if (searchError && searchError.code !== 'PGRST116') {
    // Ignore "not found" error
    return { success: false, error: searchError.message };
  }

  if (existingUser?.id) {
    // User exists, update details
    const { error: updateError } = await client
      .from(USERS_TABLE)
      .update({
        first_name,
        last_name,
        address,
        phone_number,
        display_name: displayName
      })
      .eq('id', id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }
    return { success: true, error: null };
  } else {
    // User doesn't exist, create new user
    const { error: insertError } = await client
      .from(USERS_TABLE)
      .insert({
        id,
        first_name,
        last_name,
        address,
        phone_number,
        display_name: displayName,
        photo_url: photoUrl,
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }
    return { success: true, error: null };
  }
}

