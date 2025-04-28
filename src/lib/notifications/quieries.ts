import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';
import {
  CLASSES_TABLE,
  SESSIONS_TABLE,
  STUDENT_CLASS_ENROLLMENTS_TABLE,
  STUDENT_PAYMENTS_TABLE,
  USERS_TABLE,
} from '~/lib/db-tables';

export async function getAllUpcomingSessionsWithin24_25Hrs(
  client: SupabaseClient<Database>,
): Promise<NotificationClass[] | []> {
  try {
    // Calculate the timestamp for 24 hours from now
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const next25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

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
      .gte('start_time', next24Hours.toISOString())
      .lte('start_time', next25Hours.toISOString())
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
          students:
            classData.students?.map((enrollment) => {
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
export async function getSessions2_1HrsAfterSession(
  client: SupabaseClient<Database>,
): Promise<NotificationClass[] | []> {
  try {
    // Calculate the timestamp for 24 hours from now
    const now = new Date();
    const last2Hours = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 1 * 60 * 60 * 1000);

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
      .lte('end_time', lastHour.toISOString())
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
          students:
            classData.students?.map((enrollment) => {
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

export async function getUpcomingSessionsWithUnpaidStudentsBetween3_4Days(
  client: SupabaseClient<Database>,
): Promise<SessionWithUnpaidStudents[] | []> {
  try {
    // Calculate time range: now to 3 days from now
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

    // Fetch sessions with class and enrollment data
    const { data: rawSessionData, error: sessionError } = await client
      .from(SESSIONS_TABLE)
      .select(
        `
          id,
          start_time,
          end_time,
          title,
          description,
          class_id,
          class:${CLASSES_TABLE}!class_id (
            id,
            name,
            subject,
            fee,
            tutor_id,
            students:${STUDENT_CLASS_ENROLLMENTS_TABLE}!class_id (
              id,
              student_id,
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
      )
      .gte('start_time', threeDaysFromNow.toISOString())
      .lte('start_time', fourDaysFromNow.toISOString())
      .order('start_time', { ascending: true });

    if (sessionError) {
      throw new Error(`Error fetching sessions: ${sessionError.message}`);
    }

    if (!rawSessionData || rawSessionData.length === 0) {
      return [];
    }

    // Cast rawSessionData to our Session type, fixing Supabase's array inference
    const sessionData: SessionForUnpaidStudents[] = rawSessionData.map((session) => ({
      ...session,
      class: Array.isArray(session.class)
        ? session.class[0] || null
        : session.class || null,
    }));

    // Fetch all relevant student payments
    const studentIds = sessionData
      .flatMap(
        (session) => session.class?.students?.map((s) => s.student_id) || [],
      )
      .filter(Boolean);
    const classIds = sessionData
      .map((session) => session.class_id)
      .filter(Boolean);

    const { data: paymentData, error: paymentError } = await client
      .from('student_payments')
      .select('id, payment_period, status, amount, class_id, student_id')
      .in('student_id', studentIds)
      .in('class_id', classIds);

    if (paymentError) {
      throw new Error(`Error fetching payments: ${paymentError.message}`);
    }

    // Transform and filter the data
    const transformedData: SessionWithUnpaidStudents[] = sessionData.map(
      (session: SessionForUnpaidStudents) => {
        const sessionMonthYear = session.start_time
          ? new Date(session.start_time).toISOString().slice(0, 7) // e.g., "2025-04"
          : null;

        const classData: Class = session.class || {
          id: '',
          name: null,
          subject: null,
          fee: null,
          tutor_id: '',
          students: [],
        };

        const unpaidStudents = (classData.students || [])
          .map((enrollment: notificationsEnrollment) => {
            const studentData: UnpaidStudent = Array.isArray(enrollment.student)
              ? enrollment.student[0]
              : enrollment.student;

            if (!sessionMonthYear) return null;

            // Filter payments for this student and class
            const relevantPayments = (paymentData || []).filter(
              (payment: Payment) =>
                payment.student_id === enrollment.student_id &&
                payment.class_id === classData.id,
            );

            const hasPaid = relevantPayments.some(
              (payment) =>
                payment.payment_period === sessionMonthYear &&
                payment.status === 'verified',
            );

            if (!hasPaid) {
              return {
                enrollment_id: enrollment.id,
                student: {
                  id: studentData?.id ?? '',
                  first_name: studentData?.first_name ?? null,
                  last_name: studentData?.last_name ?? null,
                  email: studentData?.email ?? '',
                  phone_number: studentData?.phone_number ?? null,
                },
              };
            }
            return null;
          })
          .filter(
            (student): student is NonNullable<typeof student> =>
              student !== null,
          );

        return {
          session_id: session.id,
          start_time: session.start_time,
          end_time: session.end_time,
          title: session.title,
          description: session.description,
          class: {
            id: classData.id,
            name: classData.name,
            subject: classData.subject,
            fee: classData.fee,
            tutor_id: classData.tutor_id,
            unpaid_students: unpaidStudents,
          },
        };
      },
    );

    // Filter out sessions with no unpaid students (optional)
    return transformedData.filter(
      (session) => session.class.unpaid_students.length > 0,
    );
  } catch (error) {
    console.error('Failed to fetch upcoming sessions:', error);
    throw error;
  }
}
