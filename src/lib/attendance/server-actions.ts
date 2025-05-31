'use server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Attendance, AttendanceWithSessionId } from '../zoom/types/zoom.types';
import { insertAttendance } from './database/mutations';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { getAllPastSessionsDataWithinLastHour } from '../sessions/database/queries';
import { fetchMeetingParticipants } from '../zoom/zoom-other.service';
import { updateAttendanceMarked } from '../sessions/database/mutations';

export async function insertAttendanceAction(
  attendance: AttendanceWithSessionId[],
): Promise<void> {
  // Validate input
  if (!attendance || !Array.isArray(attendance) || attendance.length === 0) {
    return;
  }
  const client = getSupabaseServerActionClient();
  try {
    const result = await insertAttendance(client, attendance);
    if (!result) {
      throw new Error('Failed to insert attendance');
    }
  } catch (error) {
    console.error('Error updating attendance:', error);
    throw new Error('Failed to update attendance. Please try again.');
  }
}

export async function markAttendanceAction(
  client: SupabaseClient,
): Promise<void> {
  const sessions = await getAllPastSessionsDataWithinLastHour(client);
  // console.log(
  //   `Found ${sessions.length} past sessions within the last hour.`, );
  // console.log(sessions);

  if (!sessions || sessions.length === 0) {
    console.log('No past sessions found within the last hour.');
    return;
  }

  // Process all sessions with Promise.all
  await Promise.all(
    sessions.map(async (session) => {
      if (!session.zoom_meeting_id) {
        console.log(`Session ${session.id} has no Zoom meeting ID, skipping.`);
        return;
      }

      try {
        // Fetch meeting participants from Zoom
        const participants = await fetchMeetingParticipants(
          session.zoom_meeting_id,
        );

        // If no participants found, skip this session
        if (!participants || participants.length === 0) {
          console.log(`No attendance data found for session ${session.id}.`);
          return;
        }

        // Format attendance data with session ID
        const attendanceData: AttendanceWithSessionId[] = participants.map(
          (participant) => ({
            sessionId: session.id,
            name: participant.name || null,
            email: participant.email || null,
            time: String(participant.duration) || null,
            join_time: participant.join_time || null,
            leave_time: participant.leave_time || null,
          }),
        );

        // Insert attendance records
        await insertAttendanceAction(attendanceData);
        console.log(
          `Successfully inserted attendance for session ${session.id}.`,
        );

        // Update session to mark attendance as processed
        await updateAttendanceMarked(client, session.id);
        console.log(
          `Successfully marked attendance as processed for session ${session.id}.`,
        );
      } catch (error) {
        console.error(
          `Error processing attendance for session ${session.id}:`,
          error,
        );
      }
    }),
  );
  return;
}
