'use server';

import { revalidatePath } from 'next/cache';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { sendTutorApprovalNotification } from '~/lib/utils/internal-api-client';

export interface ApproveTutorActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

export async function approveTutorAction(
  tutorId: string,
  approve: boolean,
): Promise<ApproveTutorActionResult> {
  try {
    const client = getSupabaseServerActionClient();

    const updateData = {
      status: approve ? 'ACTIVE' : 'REJECTED',
      is_approved: approve,
    };

    const { data: updatedTutor, error } = await client
      .from('users')
      .update(updateData)
      .eq('id', tutorId)
      .select()
      .single();

    if (error) {
      console.error('Error updating tutor approval status:', error);
      throw new Error(`Failed to update tutor: ${error.message}`);
    }

    // Send email notification based on approval status
    try {
      await sendTutorApprovalNotification(
        `${updatedTutor.first_name} ${updatedTutor.last_name}`,
        updatedTutor.email!,
        approve,
        updatedTutor.phone_number || undefined,
      );
    } catch (emailError) {
      console.error('Failed to send tutor approval email:', emailError);
      // Don't fail the entire operation if email fails
    }

    // Revalidate the tutors page to refresh the data
    revalidatePath('/tutors');

    return {
      success: true,
      data: updatedTutor,
    };
  } catch (error) {
    console.error('Error in approveTutorAction:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
