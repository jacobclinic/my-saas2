import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';
import { Client } from '~/lib/types/common';

export interface UpdateTutorData {
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  birthday: string;
  education_level: string;
  subjects_teach: string[];
  class_size: string;
  status: string;
}

export interface UpdateUserData {
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  address?: string | null;
  display_name?: string | null;
  photo_url?: string | null;
}

export type InsertUserData = Database['public']['Tables']['users']['Insert'];

export async function updateUserData(
  client: Client,
  userId: string,
  data: UpdateUserData,
) {
  const { data: updatedUser, error } = await client
    .from('users')
    .update(data)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return updatedUser;
}

export async function insertUserData(client: Client, userData: InsertUserData) {
  const { data: upsertedUser, error } = await client
    .from('users')
    .upsert(userData, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting user:', error);
    throw new Error(`Failed to upsert user: ${error.message}`);
  }

  return upsertedUser;
}

export async function updateTutorMutation(
  client: Client,
  tutorId: string,
  data: UpdateTutorData,
) {
  const { data: updatedTutor, error } = await client
    .from('users')
    .update({
      first_name: data.first_name,
      last_name: data.last_name,
      phone_number: data.phone_number,
      address: data.address,
      birthday: data.birthday,
      education_level: data.education_level,
      subjects_teach: data.subjects_teach,
      class_size: data.class_size,
      status: data.status,
    })
    .eq('id', tutorId)
    .select()
    .single();

  if (error) {
    console.error('Error updating tutor:', error);
    throw new Error(`Failed to update tutor: ${error.message}`);
  }

  return updatedTutor;
}
