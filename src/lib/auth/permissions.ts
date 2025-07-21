import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';
import { CLASSES_TABLE, USERS_TABLE } from '../db-tables';

export async function isAdminOrCLassRelatedTutor(
  client: SupabaseClient<Database>,
  userId: string,
  classId: string,
): Promise<boolean> {
  // Check user role and permissions
  const { data: userProfile, error: profileError } = await client
    .from(USERS_TABLE)
    .select('user_role')
    .eq('id', userId)
    .single();

  if (profileError || !userProfile) {
    return false;
  }

  const isAdmin = userProfile.user_role === 'admin';

  // If not admin, check if user is a tutor for the class
  let isAuthorized = isAdmin;
  if (!isAdmin) {
    const { data: classData, error: classError } = await client
      .from(CLASSES_TABLE)
      .select('tutor_id')
      .eq('id', classId)
      .single();

    if (classError || !classData) {
      return false;
    }

    isAuthorized = classData.tutor_id === userId;
  }

  if (!isAuthorized) {
    return false;
  }

  return true;
}

export async function isAdminOrTutor(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  // Check user role and permissions
  const { data: userProfile, error: profileError } = await client
    .from(USERS_TABLE)
    .select('user_role')
    .eq('id', userId)
    .single();

  if (profileError || !userProfile) {
    return false;
  }

  const isAdmin = userProfile.user_role === 'admin';

  const isTutor = userProfile.user_role === 'tutor';

  if (!isAdmin && !isTutor) {
    return false;
  }
  return true;
}
