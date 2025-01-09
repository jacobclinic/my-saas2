'use server'

import { revalidatePath } from 'next/cache';
import { zoomService } from '../zoom-meeting/zoom.service';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { withSession } from '~/core/generic/actions-utils';

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