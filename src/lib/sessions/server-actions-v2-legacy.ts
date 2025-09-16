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
import { error } from 'console';

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

// Add this function to properly format dates for Zoom API
function formatDateForZoom(dateString: string): string {
  if (!dateString) return '';

  // Parse the input date string
  const date = new Date(dateString);

  // Format as YYYY-MM-DDTHH:MM:SS
  return date.toISOString();
}

export const updateZoomSessionAction = withSession(
  async (params: UpdateSessionParams) => {
    const { sessionId, sessionData } = params;
    const client = getSupabaseServerActionClient();
    try {
      // Get existing session details
      const session = await getSessionDataById(client, sessionId);

      if (!session) throw error;

      let meetingUrl = sessionData.meetingUrl ?? session.meeting_url;
      let zoomMeetingId = session.zoom_meeting_id;
      let zoomUpdateSuccessful = false;

      // Initialize update data with timestamp
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      try {
        const formattedStartTime = formatDateForZoom(
          sessionData.startTime || session.start_time || '',
        );

        if (session.zoom_meeting_id) {
          // Try to update Zoom meeting, but don't block session update if it fails
          try {
            const zoomMeeting = await zoomService.updateMeeting(
              session.zoom_meeting_id,
              {
                topic:
                  sessionData.title ||
                  session.title ||
                  `${session?.class?.name} - ${new Date(sessionData.startTime || session.start_time || '').toLocaleDateString()}`,
                start_time: formattedStartTime,
                duration: getDurationInMinutes(
                  sessionData.startTime || session.start_time || '',
                  sessionData.endTime || session.end_time || '',
                ),
                type: 2,
                timezone: 'UTC', // Use UTC consistently
              },
            );
            meetingUrl = zoomMeeting.join_url;
            zoomUpdateSuccessful = true;

            // Update or create zoom_sessions table record
            try {
              // First try to update existing record
              const { data: updateResult, error: zoomSessionUpdateError } = await supabase
                .from('zoom_sessions')
                .update({
                  join_url: zoomMeeting.join_url || meetingUrl,
                  start_url: zoomMeeting.start_url,
                  duration: getDurationInMinutes(
                    sessionData.startTime || session.start_time || '',
                    sessionData.endTime || session.end_time || '',
                  ),
                })
                .eq('meeting_id', session.zoom_meeting_id)
                .select();

              if (zoomSessionUpdateError) {
                console.error('Error updating zoom_sessions table:', zoomSessionUpdateError);
              } else if (updateResult && updateResult.length === 0) {
                // No existing record found, create new one
                console.log('No existing zoom_sessions record found, creating new one for meeting:', session.zoom_meeting_id);

                const { error: insertError } = await supabase
                  .from('zoom_sessions')
                  .insert({
                    meeting_id: session.zoom_meeting_id,
                    session_id: sessionId,
                    join_url: zoomMeeting.join_url || meetingUrl,
                    start_url: zoomMeeting.start_url,
                    duration: getDurationInMinutes(
                      sessionData.startTime || session.start_time || '',
                      sessionData.endTime || session.end_time || '',
                    ),
                    host_id: zoomMeeting.host_id || '',
                    host_user_id: '', // Would need to get this from session data
                    meeting_uuid: (zoomMeeting as any).uuid || session.zoom_meeting_id || '',
                    start_time: sessionData.startTime || session.start_time || '',
                    password: zoomMeeting.password,
                    status: 'active',
                    creation_source: 'session_edit',
                  });

                if (insertError) {
                  console.error('Error creating zoom_sessions record:', insertError);
                } else {
                  console.log('Successfully created new zoom_sessions record for meeting:', session.zoom_meeting_id);
                }
              } else {
                console.log('Successfully updated zoom_sessions table for meeting:', session.zoom_meeting_id);
              }
            } catch (zoomSessionError) {
              console.error('Error with zoom_sessions table operation:', zoomSessionError);
              // Don't fail the whole operation, just log the error
            }
          } catch (zoomUpdateError) {
            console.error('Error updating Zoom meeting:', zoomUpdateError);
            // Update will continue with existing Zoom data
          }
        } else if (
          !session.zoom_meeting_id &&
          (sessionData.startTime || session.start_time)
        ) {
          // Try to create new Zoom meeting, but don't block session update if it fails
          try {
            const zoomMeeting = await zoomService.createMeeting(
              {
                topic:
                  sessionData.title ||
                  session.title ||
                  `${session?.class?.name} - ${new Date(sessionData.startTime || session.start_time || '').toLocaleDateString()}`,
                start_time: formattedStartTime,
                duration: getDurationInMinutes(
                  sessionData.startTime || session.start_time || '',
                  sessionData.endTime || session.end_time || '',
                ),
                timezone: 'UTC', // Use UTC consistently
                type: 2,
              },
              '',
            );
            meetingUrl = zoomMeeting.join_url;
            zoomMeetingId = zoomMeeting.id.toString();
            zoomUpdateSuccessful = true;
          } catch (zoomCreateError) {
            console.error('Error creating Zoom meeting:', zoomCreateError);
            // Update will continue without a Zoom meeting
          }
        } else {
          zoomUpdateSuccessful = true; // No update was needed, so we're good
        }
      } catch (zoomError) {
        console.error('Zoom API error:', zoomError);
        // Continue with session update despite Zoom API error
      }

      // Only include fields that need updating
      if (meetingUrl !== session.meeting_url)
        updateData.meeting_url = meetingUrl;
      if (zoomMeetingId !== session.zoom_meeting_id)
        updateData.zoom_meeting_id = zoomMeetingId;

      // Only update if there are changes to the Zoom data
      if (Object.keys(updateData).length > 1) {
        // > 1 because it always has updated_at
        const { error: updateError } = await supabase
          .from('sessions')
          .update(updateData)
          .eq('id', sessionId);

        if (updateError) {
          console.error('Error updating session with Zoom data:', updateError);
          throw updateError;
        }
      }

      return {
        success: true,
        zoomUpdateSuccessful,
        warning: !zoomUpdateSuccessful
          ? 'Session updated, but Zoom meeting update failed due to API issues'
          : undefined,
      };
    } catch (error) {
      console.error('Error updating Zoom session:', error);
      return { success: false, error: 'Failed to update Zoom session' };
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
