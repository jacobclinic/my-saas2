import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/database.types';
import { STUDENT_SESSION_ATTENDANCE_TABLE, ZOOM_CUSTOMER_KEY_MAPPING_TABLE } from '~/lib/db-tables';
import { AttendanceWithSessionId } from '~/lib/zoom/types/zoom.types';
import { DatabaseError } from '~/lib/shared/errors';
import { failure, Result, success } from '~/lib/shared/result';
import { DBZoomCustomerKeyMapping, DBStudentSessionAttendance } from '../types';
import getLogger from '~/core/logger';

const logger = getLogger();

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

export async function insertZoomCustomerKeyMapping(
  client: SupabaseClient<Database>,
  sessionId: string,
  userId: string,
): Promise<Result<DBZoomCustomerKeyMapping, DatabaseError>> {
  try {
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
      logger.error('Invalid sessionId provided', { sessionId });
      return failure(new DatabaseError('Invalid or missing sessionId'));
    }

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      logger.error('Invalid userId provided', { userId });
      return failure(new DatabaseError('Invalid or missing userId'));
    }

    const { data: existingRecord, error: selectError } = await client
      .from(ZOOM_CUSTOMER_KEY_MAPPING_TABLE)
      .select()
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      logger.error('Error checking existing zoom customer key mapping', {
        error: selectError.message,
        sessionId,
        userId,
      });
      return failure(new DatabaseError('Error checking existing zoom customer key mapping'));
    }

    if (existingRecord) {
      logger.info('Found existing zoom customer key mapping', {
        recordId: existingRecord.id,
        customerKey: existingRecord.customer_key,
        sessionId,
        userId,
      });
      return success(existingRecord);
    }

    const { data: insertedRecord, error: insertError } = await client
      .from(ZOOM_CUSTOMER_KEY_MAPPING_TABLE)
      .insert({
        session_id: sessionId,
        user_id: userId,
      })
      .select()
      .throwOnError()
      .single();

    if (insertError) {
      logger.error('Failed to insert zoom customer key mapping', {
        error: insertError.message,
        sessionId,
        userId,
      });
      return failure(new DatabaseError('Failed to insert zoom customer key mapping'));
    }

    if (!insertedRecord) {
      logger.error('No data returned after inserting zoom customer key mapping', {
        sessionId,
        userId,
      });
      return failure(new DatabaseError('No data returned after inserting record'));
    }

    logger.info('Successfully inserted new zoom customer key mapping', {
      recordId: insertedRecord.id,
      customerKey: insertedRecord.customer_key,
      sessionId,
      userId,
    });

    return success(insertedRecord);
  } catch (error) {
    logger.error('Error in insertZoomCustomerKeyMapping', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      sessionId,
      userId,
    });
    return failure(new DatabaseError('Failed to insert zoom customer key mapping'));
  }
}

// This will record the attendance of a single student for a session
export async function insertStudentSessionAttendance(
  client: SupabaseClient<Database>,
  attendanceData: Omit<DBStudentSessionAttendance, "id" | "created_at">,
): Promise<Result<DBStudentSessionAttendance, DatabaseError>> {
  try {
    if (!attendanceData.session_id || typeof attendanceData.session_id !== 'string' || attendanceData.session_id.trim() === '') {
      logger.error('Invalid session_id provided', { attendanceData });
      return failure(new DatabaseError('Invalid or missing session_id'));
    }

    if (!attendanceData.student_id || typeof attendanceData.student_id !== 'string' || attendanceData.student_id.trim() === '') {
      logger.error('Invalid student_id provided', { attendanceData });
      return failure(new DatabaseError('Invalid or missing student_id'));
    }

    const { data: existingRecord, error: selectError } = await client
      .from(STUDENT_SESSION_ATTENDANCE_TABLE)
      .select()
      .eq('session_id', attendanceData.session_id)
      .eq('student_id', attendanceData.student_id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      logger.error('Error checking existing student session attendance', {
        error: selectError.message,
        sessionId: attendanceData.session_id,
        studentId: attendanceData.student_id,
      });
      return failure(new DatabaseError('Error checking existing student session attendance'));
    }

    if (existingRecord) {
      const { data: updatedRecord, error: updateError } = await client
        .from(STUDENT_SESSION_ATTENDANCE_TABLE)
        .update({
          leave_time: attendanceData.leave_time,
          email: attendanceData.email || existingRecord.email, // Update email if we have it
          name: attendanceData.name || existingRecord.name, // Update name if we have it
        })
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (updateError) {
        logger.error('Failed to update student session attendance', {
          error: updateError.message,
          attendanceData,
          existingRecordId: existingRecord.id,
        });
        return failure(new DatabaseError('Failed to update student session attendance'));
      }

      logger.info('Successfully updated student session attendance', {
        recordId: updatedRecord.id,
        sessionId: attendanceData.session_id,
        studentId: attendanceData.student_id,
        email: attendanceData.email,
        name: attendanceData.name,
        leaveTime: attendanceData.leave_time,
      });

      return success(updatedRecord);
    }

    const { data: insertedRecord, error: insertError } = await client
      .from(STUDENT_SESSION_ATTENDANCE_TABLE)
      .insert({
        session_id: attendanceData.session_id,
        student_id: attendanceData.student_id,
        email: attendanceData.email,
        name: attendanceData.name,
        join_time: attendanceData.join_time,
        leave_time: attendanceData.leave_time,
        time: attendanceData.time || null,
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to insert student session attendance', {
        error: insertError.message,
        attendanceData,
      });
      return failure(new DatabaseError('Failed to insert student session attendance'));
    }

    if (!insertedRecord) {
      logger.error('No data returned after inserting student session attendance', {
        attendanceData,
      });
      return failure(new DatabaseError('No data returned after inserting attendance record'));
    }

    logger.info('Successfully inserted new student session attendance', {
      recordId: insertedRecord.id,
      sessionId: attendanceData.session_id,
      studentId: attendanceData.student_id,
      email: attendanceData.email,
      name: attendanceData.name,
      joinTime: attendanceData.join_time,
      leaveTime: attendanceData.leave_time,
    });

    return success(insertedRecord);
  } catch (error) {
    logger.error('Error in insertStudentSessionAttendance', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      attendanceData,
    });
    return failure(new DatabaseError('Failed to insert student session attendance'));
  }
}

