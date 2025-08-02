import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/database.types';
import { STUDENT_SESSION_ATTENDANCE_TABLE } from '~/lib/db-tables';
import { AttendanceWithSessionId } from '~/lib/zoom/v2/types';

export async function insertAttendance(
  client: SupabaseClient,
  attendance: AttendanceWithSessionId[],
): Promise<AttendanceWithSessionId[] | null> {


  // Validate each attendance record
  for (let index = 0; index < attendance.length; index++) {
    const record = attendance[index];
    if (
      !record.sessionId ||
      typeof record.sessionId !== 'string' ||
      record.sessionId.trim() === ''
    ) {
      console.error(`Invalid sessionId at index ${index}:`, record.sessionId);
      throw new Error(`Invalid or missing sessionId at record index ${index}`);
    }
  }

  try {
    // Map attendance records to match table column names (camelCase to snake_case)
    const formattedAttendance = attendance.map((record) => ({
      session_id: record.sessionId,
      time: record.time,
      email: record.email,
      name: record.name,
      join_time: record.join_time,
      leave_time: record.leave_time,
    }));

    // Insert records into the table
    const { data, error } = await client
      .from(STUDENT_SESSION_ATTENDANCE_TABLE)
      .insert(formattedAttendance)
      .select(); // Select to return inserted data

    if (error) {
      console.error('Supabase insert error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        attendance: formattedAttendance,
      });
      throw new Error(`Failed to insert attendance: ${error.message}`);
    }

    // Map returned data back to camelCase for consistency with interface
    const result =
      data?.map((record: any) => ({
        sessionId: record.session_id,
        time: record.time,
        email: record.email,
        name: record.name,
        join_time: record.join_time,
        leave_time: record.leave_time,
      })) ?? null;

    return result;
  } catch (error) {
    console.error('Error in insertAttendance:', {
      error: error instanceof Error ? error.message : String(error),
      attendance,
    });
    throw new Error('Failed to insert attendance. Please try again.');
  }
}
