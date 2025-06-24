'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { USERS_TABLE } from '~/lib/db-tables';
import { getUserById } from '~/lib/user/database/queries';
import UserType from '~/lib/user/types/user';
import { zoomService } from '~/lib/zoom/zoom.service';

const userDetailsSchema = z.object({
  displayName: z.string().min(2, 'Display name is required'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phoneNumber: z.string().min(5, 'Phone number is required'),
  address: z.string().optional(),
});

export async function ensureUserRecord(
  userId: string,
  email: string,
  userRole: string = 'user',
) {
  const client = getSupabaseServerActionClient();

  // Check if user record already exists
  const { data: existingUser } = await client
    .from(USERS_TABLE)
    .select('id')
    .eq('id', userId)
    .single();

  // If user record doesn't exist, create it
  if (!existingUser) {
    console.log('Creating new user record for:', userId);

    const { error } = await client.from(USERS_TABLE).insert({
      id: userId,
      email: email,
      user_role: userRole,
    });

    if (error) {
      console.error('Error creating user record:', error);
      throw error;
    }

  }
  return { success: true };
}



export async function updateUserDetailsAction(formData: FormData) {
  try {
    // Get form data
    const displayName = formData.get('displayName') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const address = formData.get('address') as string;

    // Validate form data
    const validatedData = userDetailsSchema.parse({
      displayName,
      firstName,
      lastName,
      phoneNumber,
      address,
    });

    // Get Supabase client
    const client = getSupabaseServerActionClient();

    // Get current user
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Update user profile in Supabase database
    const { error } = await client
      .from(USERS_TABLE)
      .update({
        display_name: validatedData.displayName,
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        phone_number: validatedData.phoneNumber,
        address: validatedData.address,
      })
      .eq('id', user.id);

    if (error) {
      throw error;
    }

    if (user && user.user_metadata && user.user_metadata.user_role && user.user_metadata.user_role === 'tutor') {
      const zoomRes = await zoomService.createUser({
        email: user.email!,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        displayName: validatedData.displayName,
      });
      console.log("Zoom user created", zoomRes);
    }


    // Revalidate paths
    revalidatePath('/');

    // Redirect to dashboard
    return redirect('/dashboard');

  } catch (error) {
    console.error('Error updating user details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

export async function updateProfilePhotoAction(
  userId: string,
  photoUrl: string | null,
) {
  try {
    const client = getSupabaseServerActionClient();

    const { error } = await client
      .from(USERS_TABLE)
      .update({
        photo_url: photoUrl,
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating profile photo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

export async function getUserByIdAction(
  userId: string,
): Promise<UserType> {

  const client = getSupabaseServerActionClient();

  const data = await getUserById(client, userId);

  if (!data) {
    throw new Error('User not found');
  }
  return data;
}
