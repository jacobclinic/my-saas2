import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';
import { CLASSES_TABLE, USERS_TABLE } from '~/lib/db-tables';
import UserType from '../types/user';
import { CommaZoomUser, ZoomUser, ZoomUserType } from '~/lib/zoom/v2/types';

export type UserTypeExtended = UserType & {
  zoom_user: CommaZoomUser | null;
};

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
      last_name,
      phone_number,
      address,
      birthday,
      city,
      district,
      biography,
      subjects_teach
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
  userId: string,
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
  userRole: string,
): Promise<UserTypeExtended[] | []> {
  try {
    const { data, error } = await client
      .from(USERS_TABLE)
      .select(`*,
        zoom_user:zoom_users(
          zoom_user_id,
          email,
          account_type,
          tutor_id
        )`)
      .eq('user_role', userRole)
      .order('created_at', { ascending: false });

    // console.log("getAllUsersData", data)

    if (error) {
      throw new Error(`Error fetching all users: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map((user) => ({
      ...user,
      email: user.email || undefined,
      display_name: user.display_name || undefined,
      photo_url: user.photo_url || undefined,
      first_name: user.first_name || undefined,
      last_name: user.last_name || undefined,
      user_role: user.user_role || undefined,
      address: user.address || undefined,
      biography: user.biography || undefined,
      is_approved: user.is_approved,
      subjects_teach: user.subjects_teach,
      zoom_user: Array.isArray(user.zoom_user) ? user.zoom_user[0] : user.zoom_user

    })) as UserTypeExtended[];
  } catch (error) {
    console.error('Failed to fetch all users:', error);
    throw error;
  }
}

export async function getUserById(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<UserType | null> {
  const { data, error } = await client
    .from(USERS_TABLE)
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }

  return data as UserType;
}

export async function isAdminOrCLassTutor(
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

/**
 * Get active classes count for a tutor
 */
export async function getTutorActiveClassesCount(
  client: SupabaseClient<Database>,
  tutorId: string,
): Promise<number> {
  try {
    const { count, error } = await client
      .from(CLASSES_TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutorId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching active classes count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Failed to fetch active classes count:', error);
    return 0;
  }
}

/**
 * Get all tutors with their active classes count and subjects
 */
export async function getAllTutorsWithDetails(
  client: SupabaseClient<Database>,
  userRole: string,
): Promise<(UserType & { activeClassesCount: number, zoom_user: CommaZoomUser | null })[]> {
  try {
    // First get all tutors
    const tutors = await getAllUsersByUserRoleData(client, userRole);

    // Then get active classes count for each tutor
    const tutorsWithDetails = await Promise.all(
      tutors.map(async (tutor) => {
        const activeClassesCount = await getTutorActiveClassesCount(
          client,
          tutor.id,
        );
        return {
          ...tutor,
          activeClassesCount,
        };
      }),
    );

    return tutorsWithDetails;
  } catch (error) {
    console.error('Failed to fetch tutors with details:', error);
    throw error;
  }
}


export async function getTutorCommissionRate(
  client: SupabaseClient<Database>,
  tutorId: string
): Promise<number | null> {
  const { data, error } = await client
    .from('users')
    .select('commission_rate')
    .eq('id', tutorId)
    .single();

  if (error) {
    console.error('Error fetching tutor commission rate:', error);
    return null;
  }

  return data?.commission_rate || null;
}