'use server';

import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { insertUserData } from './database/mutations';

interface UpsertUserProps {
  id: string;
  first_name: string;
  last_name: string;
  address: string;
  phone_number: string;
}

export async function upsertUserDetails({
  id,
  first_name,
  last_name,
  address,
  phone_number,
}: UpsertUserProps) {
  const client = getSupabaseServerActionClient({ admin: true });
  const { success, error } = await insertUserData(client, {
    id,
    first_name,
    last_name,
    address,
    phone_number,
    displayName: `${first_name} ${last_name}`,
    photoUrl: null,
  });
  if (!success) {
    console.error('Error inserting user data:', error);
    throw new Error(error || 'Failed to insert user data');
  }
  return { success: true };
}
