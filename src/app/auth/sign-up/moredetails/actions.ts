'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { USERS_TABLE } from '~/lib/db-tables';
import { getUserById } from '~/lib/user/database/queries';
import UserType from '~/lib/user/types/user';

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

export async function updateOnboardingDetailsAction(formData: FormData) {
  try {
    // Get form data
    const dob = formData.get('dob') as string;
    const education = formData.get('education') as string;
    const subjects = formData.get('subjects') as string;
    const classSize = formData.get('classSize') as string;
    const documentFile = formData.get('document') as File | null;
    const returnUrl = formData.get('returnUrl') as string;

    // Validate form data
    const validatedData = onboardingSchema.parse({
      dob,
      education,
      subjects,
      classSize,
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

    let identityUrl = null;

    // Handle document upload if provided
    if (documentFile && documentFile.size > 0) {
      console.log('Document file provided:', {
        name: documentFile.name,
        size: documentFile.size,
        type: documentFile.type
      });
      
      try {
        const bytes = await documentFile.arrayBuffer();
        const bucket = client.storage.from('identity-proof');
        const extension = documentFile.name.split('.').pop();
        const fileName = `${user.id}.${extension}`;

        console.log('Uploading document to bucket with filename:', fileName);

        // Check if bucket exists and is accessible
        const { data: buckets, error: bucketListError } = await client.storage.listBuckets();
        console.log('Available buckets:', buckets?.map(b => b.name));
        if (bucketListError) {
          console.error('Error listing buckets:', bucketListError);
        }

        const result = await bucket.upload(fileName, bytes, {
          upsert: true,
        });

        if (result.error) {
          console.error('Storage upload error:', result.error);
          throw new Error(`Upload failed: ${result.error.message}`);
        }

        console.log('Upload successful:', result.data);

        const {
          data: { publicUrl },
        } = bucket.getPublicUrl(fileName);

        identityUrl = publicUrl;
        console.log('Generated public URL:', identityUrl);
      } catch (uploadError) {
        console.error('Error uploading identity document:', uploadError);
        throw new Error(`Failed to upload identity document: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
      }
    } else {
      console.log('No document file provided or file size is 0');
      throw new Error('Identity verification document is required');
    }

    // Update user profile in Supabase database with all onboarding fields
    const subjectsArray = validatedData.subjects
      .split(/[,\s]+/) // Split by commas and/or spaces
      .map(subject => subject.trim()) // Trim whitespace
      .filter(subject => subject.length > 0); // Remove empty strings

    const updateData = {
      birthday: validatedData.dob,
      education_level: validatedData.education,
      subjects_teach: subjectsArray, // Store as properly split array
      class_size: validatedData.classSize,
      identity_url: identityUrl,
    };

    console.log('Updating user with data:', updateData);

    const { error } = await client
      .from(USERS_TABLE)
      .update(updateData)
      .eq('id', user.id);

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    console.log('User profile updated successfully');

    // Revalidate paths
    revalidatePath('/');

    // Redirect to the appropriate destination
    return redirect(returnUrl || '/dashboard');
  } catch (error) {
    console.error('Error updating onboarding details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}
