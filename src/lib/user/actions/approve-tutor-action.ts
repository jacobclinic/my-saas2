'use server';

import { revalidatePath } from 'next/cache';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { sendTutorApprovalNotification } from '~/lib/utils/internal-api-client';
import { ZoomService } from '~/lib/zoom/v2/zoom.service';
import { getUserDataById } from '../database/queries';
import { updateUserRow } from '../database/mutations';

export interface ApproveTutorActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface ApproveTutorParams {
  tutorId: string;
  approve: boolean;
  zoomUserId: number;
  commissionRate: number;
}

export async function approveTutorAction(params: ApproveTutorParams): Promise<ApproveTutorActionResult> {
  const { tutorId, approve, zoomUserId, commissionRate } = params;

  try {
    const client = getSupabaseServerActionClient();

    const getTutorStatus = (approve: boolean): 'ACTIVE' | 'REJECTED' => {
      return approve ? 'ACTIVE' : 'REJECTED';
    };

    const updateData = {
      status: getTutorStatus(approve),
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

    // Set tutor commission rate
    const updatedUser = await updateUserRow(client, tutorId, {
      commission_rate: commissionRate
    });
    console.log('Updated tutor commission rate:', updatedUser);

    // Create the new zoom user.
    // Create Zoom user if not already created
    const currentUserData = await getUserDataById(client, tutorId);
    if (!currentUserData) {
      return {
        success: false,
        error: 'Failed to get tutor data',
      }
    }
    const zoomDisplayName = `${currentUserData.first_name} ${currentUserData.last_name}`;
    const zoomService = new ZoomService(client);
    const zoomUserResult = await zoomService.getZoomUserById(zoomUserId);
    if (!zoomUserResult.success) {
      return {
        success: false,
        error: 'Failed to get zoom user',
      }
    }

    const zoomUser = zoomUserResult.data;

    // Create the zoom user.
    await zoomService.createZoomUser({
      action: 'create',
      user_info: {
        first_name: currentUserData.first_name || '',
        last_name: currentUserData.last_name || '',
        display_name: zoomDisplayName,
        type: 1, //Will create the basic user now. But needs to assign liscenced users later.
        email: zoomUser.email
      },
      email: zoomUser.email,
      zoom_user_id: zoomUser.id,
      tutor_id: tutorId,
    })

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
