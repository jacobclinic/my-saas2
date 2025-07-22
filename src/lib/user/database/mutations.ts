import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';

type Client = SupabaseClient<Database>;

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
