'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { USERS_TABLE } from '~/lib/db-tables';
import { getUserById } from '~/lib/user/database/queries';
import UserType from '~/lib/user/types/user';
import { zoomClient } from '~/lib/zoom/v2/client';
import { ZoomService } from '~/lib/zoom/v2/zoom.service';

const userDetailsSchema = z.object({
  displayName: z.string().min(2, 'Display name is required'),
  phoneNumber: z.string().min(5, 'Phone number is required'),
  address: z.string().optional(),
});

export async function ensureUserRecord(
  userId: string,
  email: string,
  userRole: string = 'user',
  firstName?: string,
  lastName?: string,
) {
  const client = getSupabaseServerActionClient();

  // Check if user record already exists
  const { data: existingUser } = await client
    .from(USERS_TABLE)
    .select('id, first_name, last_name')
    .eq('id', userId)
    .single();

  try {
    if (userRole === 'tutor') {
      const displayName = `${firstName} ${lastName}`;
      const randomString = Math.random().toString(36).substring(2, 8);
      const commaEducationEmail = `${firstName}.${lastName}.${randomString}@commaeducation.lk`;
      const zoomService = new ZoomService(client);
      await zoomService.createZoomUser({
        action: 'create',
        user_info: {
          email: commaEducationEmail,
          first_name: firstName || '',
          last_name: lastName || '',
          display_name: displayName || '',
          type: 1,
        }
      })
    }
  } catch (error) {
    console.error('Error creating zoom user:', error);
  }

  if (!existingUser) {
    // If user record doesn't exist, create it
    console.log('Creating new user record for:', userId);

    const insertData: any = {
      id: userId,
      email: email,
      user_role: userRole,
    };

    // Add name fields if provided
    if (firstName) {
      insertData.first_name = firstName;
    }
    if (lastName) {
      insertData.last_name = lastName;
    }

    const { error } = await client.from(USERS_TABLE).insert(insertData);

    if (error) {
      console.error('Error creating user record:', error);
      throw error;
    }
  } else {
    // If user record exists but names are missing, update them
    const needsUpdate =
      (firstName && !existingUser.first_name) ||
      (lastName && !existingUser.last_name);

    if (needsUpdate) {
      console.log('Updating user record with names for:', userId);

      const updateData: any = {};

      if (firstName && !existingUser.first_name) {
        updateData.first_name = firstName;
      }
      if (lastName && !existingUser.last_name) {
        updateData.last_name = lastName;
      }

      const { error } = await client
        .from(USERS_TABLE)
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('Error updating user record with names:', error);
        throw error;
      }
    }
  }

  return { success: true };
}

export async function updateUserDetailsAction(formData: FormData) {
  try {
    // Get form data
    const displayName = formData.get('displayName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const address = formData.get('address') as string;
    const returnUrl = formData.get('returnUrl') as string;

    // Validate form data
    const validatedData = userDetailsSchema.parse({
      displayName,
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
        phone_number: validatedData.phoneNumber,
        address: validatedData.address,
      })
      .eq('id', user.id);

    if (error) {
      throw error;
    }

    // Revalidate paths
    revalidatePath('/');

    // Redirect to the appropriate destination
    return redirect(returnUrl || '/dashboard');
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

export async function getUserByIdAction(userId: string): Promise<UserType> {
  const client = getSupabaseServerActionClient();

  const data = await getUserById(client, userId);

  if (!data) {
    throw new Error('User not found');
  }
  return data;
}
