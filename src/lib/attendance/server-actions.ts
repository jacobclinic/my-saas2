'use server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Attendance, AttendanceWithSessionId } from '../zoom/types/zoom.types';
import { insertAttendance } from './database/mutations';
import getSupabaseServerActionClient from '~/core/supabase/action-client';

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
