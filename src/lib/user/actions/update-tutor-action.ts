'use server';

import { revalidatePath } from 'next/cache';
import { updateTutorMutation, UpdateTutorData } from '../database/mutations';
import getSupabaseServerActionClient from '~/core/supabase/action-client';

export interface UpdateTutorActionData extends UpdateTutorData {
  tutorId: string;
}

export interface UpdateTutorActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

export async function updateTutorAction(
  data: UpdateTutorActionData,
): Promise<UpdateTutorActionResult> {
  try {
    const client = getSupabaseServerActionClient();

    const { tutorId, ...updateData } = data;

    // Validate required fields
    const requiredFields = [
      'first_name',
      'last_name',
      'phone_number',
      'address',
      'birthday',
      'education_level',
      'class_size',
      'status',
    ];

    for (const field of requiredFields) {
      const fieldValue = updateData[field as keyof UpdateTutorData];
      if (
        fieldValue === undefined ||
        fieldValue === null ||
        (typeof fieldValue === 'string' && fieldValue.trim() === '')
      ) {
        return {
          success: false,
          error: `${field.replace('_', ' ')} is required`,
        };
      }
    }

    // Validate subjects
    if (!updateData.subjects_teach || updateData.subjects_teach.length === 0) {
      return {
        success: false,
        error: 'At least one subject is required',
      };
    }

    // Validate age
    const birthday = new Date(updateData.birthday);
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthday.getDate())
    ) {
      age--;
    }

    if (age < 13 || age > 100) {
      return {
        success: false,
        error: 'Age must be between 13 and 100 years',
      };
    }

    // Update tutor
    const updatedTutor = await updateTutorMutation(client, tutorId, updateData);

    // Revalidate the tutors page to refresh the data
    revalidatePath('/tutors');

    return {
      success: true,
      data: updatedTutor,
    };
  } catch (error) {
    console.error('Error in updateTutorAction:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
