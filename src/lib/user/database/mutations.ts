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
