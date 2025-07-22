'use server';

import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { insertUserData } from './database/mutations';

interface UpsertUserProps {
  id: string;
  first_name: string;
  last_name: string;
  address?: string;
  phone_number?: string;
}

export async function upsertUserDetails({
  id,
  first_name,
  last_name,
  address,
  phone_number,
}: UpsertUserProps) {
  const client = getSupabaseServerActionClient({ admin: true });

  try {
    await insertUserData(client, {
      id,
      first_name,
      last_name,
      address: address || null,
      phone_number: phone_number || null,
      display_name: `${first_name} ${last_name}`,
      photo_url: null,
    });

    return { success: true };
  } catch (error) {
    console.error('Error inserting user data:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to insert user data',
    );
  }
}
