'use server'

import { revalidatePath } from 'next/cache';
import { zoomService } from '../zoom-meeting/zoom.service';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { withSession } from '~/core/generic/actions-utils';
import { deleteMaterialFromStorage, uploadMaterialToStorage } from '../utils/upload-material-utils';

const supabase = getSupabaseServerActionClient();

type UpdateSessionParams = {
  sessionId: string;
  sessionData: Partial<{  // Make all fields optional
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
    try {
      // Get existing session details
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*, classes(name)')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Only check time changes if start or end time is provided
      const timeChanged = (sessionData.startTime || sessionData.endTime) && (
        (sessionData.startTime && new Date(session.start_time || "").getTime() !== new Date(sessionData.startTime).getTime()) ||
        (sessionData.endTime && new Date(session.end_time || "").getTime() !== new Date(sessionData.endTime).getTime())
      );
      
      let meetingUrl = sessionData.meetingUrl ?? session.meeting_url;
      let zoomMeetingId = session.zoom_meeting_id;

      if (timeChanged && session.zoom_meeting_id) {
        // Update existing Zoom meeting only if time has changed
        const zoomMeeting = await zoomService.updateMeeting(
          session.zoom_meeting_id,
          {
            topic: sessionData.title || session.title || `${session?.classes?.name} - ${new Date(sessionData.startTime || session.start_time || "").toLocaleDateString()}`,
            start_time: sessionData.startTime || session.start_time || "",
            duration: getDurationInMinutes(
              sessionData.startTime || session.start_time || "",
              sessionData.endTime || session.end_time || ""
            ),
            type: 2,
            timezone: 'Asia/Colombo'
          }
        );
        meetingUrl = zoomMeeting.join_url;
      } else if (!session.zoom_meeting_id && (sessionData.startTime || sessionData.endTime)) {
        // Create new Zoom meeting only if times are provided and no meeting exists
        const zoomMeeting = await zoomService.createMeeting({
          topic: sessionData.title || session.title || `${session?.classes?.name} - ${new Date(sessionData.startTime || session.start_time || "").toLocaleDateString()}`,
          start_time: sessionData.startTime || session.start_time || "",
          duration: getDurationInMinutes(
            sessionData.startTime || session.start_time || "",
            sessionData.endTime || session.end_time || ""
          ),
          timezone: 'Asia/Colombo',
          type: 2,
        });
        meetingUrl = zoomMeeting.join_url;
        zoomMeetingId = zoomMeeting.id.toString();
      }

      // Build update object with only provided fields
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };

      // Only include fields that were actually provided
      if (sessionData.title !== undefined) updateData.title = sessionData.title;
      if (sessionData.description !== undefined) updateData.description = sessionData.description;
      if (sessionData.startTime !== undefined) updateData.start_time = sessionData.startTime;
      if (sessionData.endTime !== undefined) updateData.end_time = sessionData.endTime;
      if (meetingUrl !== session.meeting_url) updateData.meeting_url = meetingUrl;
      if (zoomMeetingId !== session.zoom_meeting_id) updateData.zoom_meeting_id = zoomMeetingId;

      // Update session with only the changed fields
      const { error: updateError } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (updateError) throw updateError;

      revalidatePath('/sessions');
      return { success: true };
    } catch (error) {
      console.error('Error updating session:', error);
      return { success: false, error: 'Failed to update session' };
    }
  }
);

function getDurationInMinutes(startTime: string, endTime: string): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

export const uploadSessionMaterialsAction = withSession(
  async ({ 
    sessionId,
    file: {
      name,
      type,
      size,
      buffer
    },
    description,
    csrfToken 
  }: {
    sessionId: string,
    file: {
      name: string,
      type: string,
      size: number,
      buffer: number[]
    },
    description?: string,
    csrfToken: string
  }) => {
    const client = getSupabaseServerActionClient()

    try {
      // Convert buffer to Uint8Array
      const uint8Array = new Uint8Array(buffer)
      
      // Generate unique file name
      const fileExt = name.split('.').pop()
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `materials/${sessionId}/${uniqueFileName}`

      // Upload directly to Supabase storage
      const { data: storageData, error: uploadError } = await client
        .storage
        .from('class-materials')
        .upload(filePath, uint8Array, {
          contentType: type,
          cacheControl: '3600'
        })

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: { publicUrl } } = client
        .storage
        .from('class-materials')
        .getPublicUrl(filePath)

      // Save to database
      const { data: material, error: dbError } = await client
        .from('resource_materials')
        .insert({
          session_id: sessionId,
          name: name,
          url: publicUrl,
          file_size: (size / 1024 / 1024).toFixed(2),
          description
        })
        .select()
        .single()

      if (dbError) throw dbError

      revalidatePath('/upcoming-sessions')
      return { success: true, material }
    } catch (error: any) {
      console.error('Server error:', error)
      return { success: false, error: error.message }
    }
  }
)

export const updateSessionMaterialsAction = withSession(
  async ({ 
    materialData,
    csrfToken 
  }: {
    materialData: {
      session_id: string,
      name: string,
      url: string,
      file_size: string,
      description: string
    }[],
    csrfToken?: string
  }) => {
    const client = getSupabaseServerActionClient()

    try {
      // Save to database
      const { data: material, error: dbError } = await client
        .from('resource_materials')
        .insert(materialData)
        .select()
        // .single()

      if (dbError) throw dbError

      revalidatePath('/upcoming-sessions')
      return { success: true, material }
    } catch (error: any) {
      console.error('Server error:', error)
      return { success: false, error: error.message }
    }
  }
)

export const deleteSessionMaterialAction = withSession(
  async ({
    materialId,
    materialUrl,
    csrfToken
  }: {
    materialId: string,
    materialUrl: string,
    csrfToken: string
  }) => {
    const client = getSupabaseServerActionClient()

    // Delete from storage
    const { error: storageError } = await deleteMaterialFromStorage(
      client,
      materialUrl
    )
    if (storageError) {
      console.error('Storage error:', storageError)
      throw storageError
    }

    // Delete from database
    const { error: dbError } = await client
      .from('resource_materials')
      .delete()
      .eq('id', materialId)

    if (dbError) throw dbError

    revalidatePath('/upcoming-sessions')
    return { success: true }
  }
)