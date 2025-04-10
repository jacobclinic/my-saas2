import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';
import {
  CLASSES_TABLE,
  SESSIONS_TABLE,
  STUDENT_CLASS_ENROLLMENTS_TABLE,
  USERS_TABLE,
} from '~/lib/db-tables';

export async function getAllUpcomingSessionsWithin24Hrs(
  client: SupabaseClient<Database>,
): Promise<NotificationClass[] | []> {
  try {
    // Calculate the timestamp for 24 hours from now
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data, error } = await client
      .from(SESSIONS_TABLE)
      .select(
        `
          id,
          created_at,
          class_id,
          recording_urls,
          status,
          start_time,
          end_time,
          recurring_session_id,
          title,
          description,
          updated_at,
          meeting_url,
          zoom_meeting_id,
          class:${CLASSES_TABLE}!class_id (
            id,
            name,
            subject,
            tutor_id,
            students:${STUDENT_CLASS_ENROLLMENTS_TABLE}!class_id (
              id,
              student:${USERS_TABLE}!student_id (
                id,
                first_name,
                last_name,
                email,
                phone_number
              )
            )
          )
        `,
        { count: 'exact' },
      )
      .gte('start_time', now.toISOString())
      .lte('start_time', next24Hours.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(`Error fetching sessions: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    const transformedData: NotificationClass[] = data.map((sessionData) => {
      let classTemp: {
        id: string;
        name: string | null;
        subject: string | null;
        tutor_id: string;
        students: Student[];
      };

      if (sessionData?.class) {
        const classData = Array.isArray(sessionData.class)
          ? sessionData.class[0]
          : sessionData.class;

        classTemp = {
          id: classData.id,
          name: classData.name,
          subject: classData.subject,
          tutor_id: classData.tutor_id,
          students: classData.students?.map((enrollment) => {
            const studentData = Array.isArray(enrollment.student)
              ? enrollment.student[0]
              : enrollment.student;

            return {
              id: enrollment.id,
              student: {
                id: studentData?.id ?? '', // Default to empty string if null
                first_name: studentData?.first_name ?? null,
                last_name: studentData?.last_name ?? null,
                email: studentData?.email ?? '', 
                phone_number: studentData?.phone_number ?? null,
              },
            };
          }) || [],
        };
      } else {
        // Provide a default class object if sessionData.class is missing
        classTemp = {
          id: '',
          name: null,
          subject: null,
          tutor_id: '',
          students: [],
        };
      }

      return {
        ...sessionData,
        class: classTemp,
      } as NotificationClass;
    });

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}
export async function getSessions2HrsAfterSession(
  client: SupabaseClient<Database>,
): Promise<NotificationClass[] | []> {
  try {
    // Calculate the timestamp for 24 hours from now
    const now = new Date();
    const last2Hours = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const { data, error } = await client
      .from(SESSIONS_TABLE)
      .select(
        `
          id,
          created_at,
          class_id,
          recording_urls,
          status,
          start_time,
          end_time,
          recurring_session_id,
          title,
          description,
          updated_at,
          meeting_url,
          zoom_meeting_id,
          class:${CLASSES_TABLE}!class_id (
            id,
            name,
            subject,
            tutor_id,
            students:${STUDENT_CLASS_ENROLLMENTS_TABLE}!class_id (
              id,
              student:${USERS_TABLE}!student_id (
                id,
                first_name,
                last_name,
                email,
                phone_number
              )
            )
          )
        `,
        { count: 'exact' },
      )
      .gte('end_time', last2Hours.toISOString())
      .lte('end_time', now.toISOString())
      .order('end_time', { ascending: true });

    if (error) {
      throw new Error(`Error fetching sessions: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    const transformedData: NotificationClass[] = data.map((sessionData) => {
      let classTemp: {
        id: string;
        name: string | null;
        subject: string | null;
        tutor_id: string;
        students: Student[];
      };

      if (sessionData?.class) {
        const classData = Array.isArray(sessionData.class)
          ? sessionData.class[0]
          : sessionData.class;

        classTemp = {
          id: classData.id,
          name: classData.name,
          subject: classData.subject,
          tutor_id: classData.tutor_id,
          students: classData.students?.map((enrollment) => {
            const studentData = Array.isArray(enrollment.student)
              ? enrollment.student[0]
              : enrollment.student;

            return {
              id: enrollment.id,
              student: {
                id: studentData?.id ?? '', // Default to empty string if null
                first_name: studentData?.first_name ?? null,
                last_name: studentData?.last_name ?? null,
                email: studentData?.email ?? '', 
                phone_number: studentData?.phone_number ?? null,
              },
            };
          }) || [],
        };
      } else {
        // Provide a default class object if sessionData.class is missing
        classTemp = {
          id: '',
          name: null,
          subject: null,
          tutor_id: '',
          students: [],
        };
      }

      return {
        ...sessionData,
        class: classTemp,
      } as NotificationClass;
    });

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}
