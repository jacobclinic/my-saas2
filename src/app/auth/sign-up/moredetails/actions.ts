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
import { uploadIdentityProof } from '~/lib/utils/upload-material-utils';
import { sendTutorRegistrationNotification } from '~/lib/utils/internal-api-client';

const userDetailsSchema = z.object({
  displayName: z.string().min(2, 'Display name is required'),
  phoneNumber: z.string().min(5, 'Phone number is required'),
  address: z.string().optional(),
});

const onboardingSchema = z.object({
  dob: z.string().min(1, 'Date of birth is required'),
  education: z.string().min(1, 'Education level is required'),
  subjects: z.string().min(3, 'Subjects are required'),
  classSize: z.string().min(1, 'Class size is required'),
});

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

export async function updateOnboardingDetailsAction(formData: FormData) {
  const client = getSupabaseServerActionClient();

  // Get returnUrl early to use outside try-catch
  const returnUrl = formData.get('returnUrl') as string;

  let user;
  try {
    // Get form data
    const dob = formData.get('dob') as string;
    const education = formData.get('education') as string;
    const subjects = formData.get('subjects') as string;
    const classSize = formData.get('classSize') as string;
    const identityUrl = formData.get('identityUrl') as string; // Get from uploaded result

    // Validate form data
    const validatedData = onboardingSchema.parse({
      dob,
      education,
      subjects,
      classSize,
    });

    // Get current user
    const {
      data: { user: currentUser },
    } = await client.auth.getUser();

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    user = currentUser;

    // Validate that identity URL is provided
    if (!identityUrl) {
      throw new Error('Identity verification document is required');
    }

    // Update user profile in Supabase database with all onboarding fields
    const subjectsArray = validatedData.subjects
      .split(/[,\s]+/) // Split by commas and/or spaces
      .map((subject) => subject.trim()) // Trim whitespace
      .filter((subject) => subject.length > 0); // Remove empty strings

    const updateData = {
      birthday: validatedData.dob,
      education_level: validatedData.education,
      subjects_teach: subjectsArray, // Store as properly split array
      class_size: validatedData.classSize,
      identity_url: identityUrl,
    };

    const { data: currentUserData, error } = await client
      .from(USERS_TABLE)
      .update(updateData)
      .eq('id', user.id)
      .select('id, first_name, last_name')
      .single();

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    // Create Zoom user if not already created
    const zoomDisplayName = `${currentUserData.first_name} ${currentUserData.last_name}`;
    const randomString = Math.random().toString(36).substring(2, 8);
    const commaEducationEmail = `${zoomDisplayName.trim()}.${randomString}@commaeducation.lk`;
    const zoomService = new ZoomService(client);
    await zoomService.createZoomUser({
      action: 'create',
      user_info: {
        email: commaEducationEmail,
        first_name: currentUserData.first_name || '',
        last_name: currentUserData.last_name || '',
        display_name: zoomDisplayName,
        type: 1, //Will create the basic user now. But needs to assign liscenced users later.
      },
      tutor_id: currentUserData?.id!,
    })


    //notify tutors
    const { data: userData, error: userError } = await client
      .from(USERS_TABLE)
      .select(
        `
        first_name, 
        last_name, 
        email,
        phone_number
      `,
      )
      .eq('id', user.id)
      .single();

    const FullName = userData?.first_name + ' ' + userData?.last_name;

    console.log("User data for notification:", userData);


    try {
      await sendTutorRegistrationNotification(
        FullName,
        userData?.email!,
        userData?.phone_number || undefined,
      );
    } catch (error) {
      console.error('Error sending tutor registration notifications:', error);
    }

    // Revalidate paths to ensure middleware sees updated data
    revalidatePath('/');
    revalidatePath('/waiting');
    revalidatePath('/auth/sign-up/moredetails');
  } catch (error) {
    console.error('Error updating onboarding details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }

  // Redirect tutors to waiting page for approval (outside try-catch to allow redirect to work)
  // Check user role to determine redirect destination
  const userRole =
    user.user_metadata?.role ||
    user.user_metadata?.userRole ||
    user.user_metadata?.user_role;

  if (userRole === 'tutor') {
    redirect('/waiting');
  } else {
    // For non-tutors, redirect to dashboard
    redirect(returnUrl || '/dashboard');
  }
}

export async function uploadIdentityProofAction(formData: FormData) {
  const client = getSupabaseServerActionClient();

  try {
    // Get current user
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get file data from form
    const file = formData.get('identityFile') as File;

    if (!file) {
      throw new Error('No file provided');
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Array.from(new Uint8Array(arrayBuffer));

    // Upload the identity proof file
    const { url, error: uploadError } = await uploadIdentityProof(
      client,
      {
        name: file.name,
        type: file.type,
        buffer,
      },
      user.id,
    );

    if (uploadError) throw uploadError;

    // Update the user record with the identity proof URL
    const { error: updateError } = await client
      .from(USERS_TABLE)
      .update({
        identity_url: url,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user with identity URL:', updateError);
      throw new Error('Failed to save identity proof URL');
    }

    revalidatePath('/auth/sign-up/moredetails');
    revalidatePath('/waiting');

    return {
      success: true,
      url,
      message: 'Identity proof uploaded successfully',
    };
  } catch (error: any) {
    console.error('Server error:', error);
    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
}
