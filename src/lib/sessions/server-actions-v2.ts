'use server';

import { revalidatePath } from 'next/cache';
import { zoomService } from '../zoom/zoom.service';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { withSession } from '~/core/generic/actions-utils';
import {
  deleteMaterialFromStorage,
  uploadMaterialToStorage,
} from '../utils/upload-material-utils';
import { getSessionDataById } from './database/queries';
import { updateAttendanceMarked, updateSession } from './database/mutations';
import { updateZoomSessionAction } from './server-actions-v2-legacy';
import { fetchMeetingParticipants } from '../zoom/zoom-other.service';
import { isAdminOrCLassTutor } from '../user/database/queries';

const supabase = getSupabaseServerActionClient();

type UpdateSessionParams = {
  sessionId: string;
  sessionData: Partial<{
    // Make all fields optional
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    meetingUrl: string | null;
  }>;
  csrfToken: string;
};

export const updateSessionAction = withSession(
  async (params: UpdateSessionParams) => {
    const { sessionId, sessionData } = params;
    const client = getSupabaseServerActionClient();

    try {
      // Get existing session details
      const session = await getSessionDataById(client, sessionId);

      if (!session) throw new Error('Session not found');

      // Only check time changes if start or end time is provided
      const timeChanged =
        (sessionData.startTime || sessionData.endTime) &&
        ((sessionData.startTime &&
          new Date(session.start_time || '').getTime() !==
            new Date(sessionData.startTime).getTime()) ||
          (sessionData.endTime &&
            new Date(session.end_time || '').getTime() !==
              new Date(sessionData.endTime).getTime()));

      // Build update object with only provided fields
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      // Only include fields that were actually provided
      if (sessionData.title !== undefined) updateData.title = sessionData.title;
      if (sessionData.description !== undefined)
        updateData.description = sessionData.description;
      if (sessionData.startTime !== undefined)
        updateData.start_time = sessionData.startTime;
      if (sessionData.endTime !== undefined)
        updateData.end_time = sessionData.endTime;

      // Update session with the changed fields
      const updatedSession = await updateSession(client, sessionId, updateData);

      if (!updatedSession)
        throw new Error('Failed to update session in database');

      // Only attempt to update Zoom meeting if time has changed
      if (timeChanged) {
        try {
          // Ensure null values are converted to undefined for the zoom update
          const zoomUpdatedata = {
            title: sessionData.title || session.title || '',
            description: sessionData.description || session.description || '',
            startTime: sessionData.startTime || session.start_time || undefined,
            endTime: sessionData.endTime || session.end_time || undefined,
            meetingUrl: session.meeting_url,
          };

          const zoomSessionUpdate = await updateZoomSessionAction({
            sessionId: sessionId,
            sessionData: zoomUpdatedata,
            csrfToken: params.csrfToken,
          });

          if (zoomSessionUpdate.error) {
            console.error(
              'Zoom session update error:',
              zoomSessionUpdate.error,
            );
            return {
              success: true,
              warning:
                'Session updated in database, but Zoom meeting update failed due to API issues. Your changes are saved, but meeting link might need updating separately.',
            };
          }

          if (zoomSessionUpdate.warning) {
            return {
              success: true,
              warning: zoomSessionUpdate.warning,
            };
          }
        } catch (zoomError) {
          console.error('Failed to update Zoom meeting:', zoomError);
          return {
            success: true,
            warning:
              'Session updated successfully, but there was a problem communicating with Zoom. Your changes are saved, but meeting link might need updating separately.',
          };
        }
      }

      revalidatePath('/sessions');
      revalidatePath('/upcoming-sessions');
      return { success: true };
    } catch (error) {
      console.error('Error updating session:', error);
      return { success: false, error: 'Failed to update session' };
    }
  },
);

function getDurationInMinutes(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

export const uploadSessionMaterialsAction = withSession(
  async ({
    sessionId,
    file: { name, type, size, buffer },
    description,
    csrfToken,
  }: {
    sessionId: string;
    file: {
      name: string;
      type: string;
      size: number;
      buffer: number[];
    };
    description?: string;
    csrfToken: string;
  }) => {
    const client = getSupabaseServerActionClient();

    try {
      // Convert buffer to Uint8Array
      const uint8Array = new Uint8Array(buffer);

      // Generate unique file name
      const fileExt = name.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `materials/${sessionId}/${uniqueFileName}`;

      // Upload directly to Supabase storage
      const { data: storageData, error: uploadError } = await client.storage
        .from('class-materials')
        .upload(filePath, uint8Array, {
          contentType: type,
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const {
        data: { publicUrl },
      } = client.storage.from('class-materials').getPublicUrl(filePath);

      // Save to database
      const { data: material, error: dbError } = await client
        .from('resource_materials')
        .insert({
          session_id: sessionId,
          name: name,
          url: publicUrl,
          file_size: (size / 1024 / 1024).toFixed(2),
          description,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      revalidatePath('/upcoming-sessions');
      return { success: true, material };
    } catch (error: any) {
      console.error('Server error:', error);
      return { success: false, error: error.message };
    }
  },
);

export const updateSessionMaterialsAction = withSession(
  async ({
    materialData,
    csrfToken,
  }: {
    materialData: {
      session_id: string;
      name: string;
      url: string;
      file_size: string;
      description: string;
    }[];
    csrfToken?: string;
  }) => {
    const client = getSupabaseServerActionClient();

    try {
      // Save to database
      const { data: material, error: dbError } = await client
        .from('resource_materials')
        .insert(materialData)
        .select();
      // .single()

      if (dbError) throw dbError;

      revalidatePath('/upcoming-sessions');
      return { success: true, material };
    } catch (error: any) {
      console.error('Server error:', error);
      return { success: false, error: error.message };
    }
  },
);

export const deleteSessionMaterialAction = withSession(
  async ({
    materialId,
    materialUrl,
    csrfToken,
  }: {
    materialId: string;
    materialUrl: string;
    csrfToken: string;
  }) => {
    const client = getSupabaseServerActionClient();

    // Delete from storage
    const { error: storageError } = await deleteMaterialFromStorage(
      client,
      materialUrl,
    );
    if (storageError) {
      console.error('Storage error:', storageError);
      throw storageError;
    }

    // Delete from database
    const { error: dbError } = await client
      .from('resource_materials')
      .delete()
      .eq('id', materialId);

    if (dbError) throw dbError;

    revalidatePath('/upcoming-sessions');
    return { success: true };
  },
);

export const getAttendanceAction = withSession(
  async ({
    zoomMeetingId,
    classId,
  }: {
    zoomMeetingId: string;
    classId: string;
  }) => {
    const client = getSupabaseServerActionClient();

    // Get the current user's session
    const {
      data: { session },
      error: sessionError,
    } = await client.auth.getSession();
    if (sessionError || !session?.user) {
      return {
        success: false,
        error: 'User not authenticated',
        attendance: [],
      };
    }

    const userId = session.user.id;
    const havePermission = await isAdminOrCLassTutor(client, userId, classId);

    if (!havePermission) {
      return {
        success: false,
        error: 'User does not have permission to access this data',
        attendance: [],
      };
    }

    try {
      const attendance = await fetchMeetingParticipants(zoomMeetingId);
      return { success: true, attendance };
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return {
        success: false,
        error: 'Failed to fetch attendance',
        attendance: [],
      };
    }
  },
);

export async function updateAttendanceMarkedAction(
  sessionId: string,
): Promise<any> {
  const client = getSupabaseServerActionClient();
  try {
    const response = await updateAttendanceMarked(client, sessionId);
    if (response.error) {
      throw new Error(`Failed to update attendance_marked`);
    }
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating attendance marked:', error);
    return { success: false, error: 'Failed to update attendance marked' };
  }
}
