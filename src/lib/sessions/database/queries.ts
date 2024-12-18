import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';
import { CLASSES_TABLE, SESSIONS_TABLE, STUDENT_SESSION_ATTENDANCE_TABLE, STUDENT_CLASS_ENROLLMENTS_TABLE, USERS_TABLE } from '~/lib/db-tables';
import { SessionsWithTableData } from '../types/session';

interface SessionsWithTableDataRawData extends Omit<SessionsWithTableData, 'class' | 'noOfAtendedStudents'>{
  class: { 
    id: string;
    name: string;
    tutorId: string
    tutor: { id: string; firstName: string; lastName: string };
    noOfStudents: { count: number }[];
  };  
  noOfAtendedStudents: { count: number }[];
}

/**
 * @description Fetch session object data (not auth!) by ID {@link sessionId}
 */
export async function getSessionDataById(
  client: SupabaseClient<Database>,
  sessionId: string,
): Promise<SessionsWithTableData | null>  {
  try {
    const { data } = await client
      .from(SESSIONS_TABLE)
      .select(
        `
          id,
          classId,
          recordingUrls,
          status,
          startTime,
          endTime,
          recurringSessionId,
          title,
          description,
          updatedAt,
            class:${CLASSES_TABLE}!classId (
              id,
              name,
              tutorId,
              tutor:${USERS_TABLE}!tutorId (
                id,
                firstName,
                lastName
              ),
              noOfStudents:${STUDENT_CLASS_ENROLLMENTS_TABLE}!id(count)
            ),
            noOfAtendedStudents:${STUDENT_SESSION_ATTENDANCE_TABLE}!id(count)
        `,
        { count: 'exact' }
      )
      .eq('id', sessionId)
      .maybeSingle() as { data: SessionsWithTableDataRawData | null };

    console.log("getAllSessionsData", data)

    if (!data) {
      return null;
    }

    // Transform the data to get the count directly
    const transformedData: SessionsWithTableData = {
      ...data,
      class: {
        ...data.class,
        noOfStudents: data?.class?.noOfStudents[0]?.count || 0,
      },
      noOfAtendedStudents: data?.noOfAtendedStudents[0]?.count || 0,
    };

    console.log("getAllSessionsData-2", transformedData)

    return transformedData;    
  } catch (error) {
    console.error('Failed to fetch session by id:', error);
    throw error;    
  }
}

export async function getAllSessionsData(
  client: SupabaseClient<Database>,
): Promise<SessionsWithTableData[] | []> {
  try {
    const { data, error } = await client
      .from(SESSIONS_TABLE)
      .select(
        `
          id,
          classId,
          recordingUrls,
          status,
          startTime,
          endTime,
          recurringSessionId,
          title,
          description,
          updatedAt,
          class:${CLASSES_TABLE}!classId (
            id,
            name,
            tutorId,
            tutor:${USERS_TABLE}!tutorId (
              id,
              firstName,
              lastName
            ),
            noOfStudents:${STUDENT_CLASS_ENROLLMENTS_TABLE}!id(count)
          ),
          noOfAtendedStudents:${STUDENT_SESSION_ATTENDANCE_TABLE}!id(count)
        `,
      )
      .returns<SessionsWithTableDataRawData[]>();

    console.log("getAllSessionsData", data)

    if (error) {
      throw new Error(`Error fetching sessions: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // Transform the data to get the count directly
    const transformedData: SessionsWithTableData[] = data?.map((sessionData) => ({
      ...sessionData,
      class: {
        ...sessionData?.class,
        noOfStudents: sessionData?.class?.noOfStudents[0]?.count || 0,
      },
      noOfAtendedStudents: sessionData?.noOfAtendedStudents[0]?.count || 0,
    }));

    console.log("getAllSessionsData-2", transformedData)

    return transformedData;

  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getAllSessionsByClassIdData(
  client: SupabaseClient<Database>,
  classId: string
): Promise<SessionsWithTableData[] | []> {
  try {
    const { data, error } = await client
      .from(SESSIONS_TABLE)
      .select(
        `
          id,
          classId,
          recordingUrls,
          status,
          startTime,
          endTime,
          recurringSessionId,
          title,
          description,
          updatedAt,
          class:${CLASSES_TABLE}!classId (
            id,
            name,
            tutorId,
            tutor:${USERS_TABLE}!tutorId (
              id,
              firstName,
              lastName
            ),
            noOfStudents:${STUDENT_CLASS_ENROLLMENTS_TABLE}!id(count)
          ),
          noOfAtendedStudents:${STUDENT_SESSION_ATTENDANCE_TABLE}!id(count)
        `,
      )
      .eq('classId', classId)
      // .maybeSingle() as { data: SessionsWithTableDataRawData | null };
      .returns<SessionsWithTableDataRawData[]>();

    console.log("getAllSessionsData", data)

    if (error) {
      throw new Error(`Error fetching sessions: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // Transform the data to get the count directly
    const transformedData: SessionsWithTableData[] = data?.map((sessionData) => ({
      ...sessionData,
      class: {
        ...sessionData?.class,
        noOfStudents: sessionData?.class?.noOfStudents[0]?.count || 0,
      },
      noOfAtendedStudents: sessionData?.noOfAtendedStudents[0]?.count || 0,
    }));

    console.log("getAllSessionsData-2", transformedData)

    return transformedData;

  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}