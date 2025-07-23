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
    // Calculate the timestamp for 24-25 hours from now in UTC
    const now = new Date();
    // Add 24 hours for notifications
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const next25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Log the window for debugging
    console.log(
      `Looking for sessions between ${next24Hours.toISOString()} and ${next25Hours.toISOString()}`,
    );

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
    // Calculate timestamps for sessions that ended 1-2 hours ago (in UTC)
    const now = new Date();
    const last2Hours = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 1 * 60 * 60 * 1000);

    // Log the time window for debugging
    console.log(
      `Looking for completed sessions between ${last2Hours.toISOString()} and ${lastHour.toISOString()}`,
    );

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

export async function getUpcomingSessionsWithUnpaidStudentsBetween2_3Days(
  client: SupabaseClient<Database>,
): Promise<SessionWithUnpaidStudents[] | []> {
  try {
    // Calculate time range: now to 3 days from now
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

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
      .gte('start_time', twoDaysFromNow.toISOString())
      .lte('start_time', threeDaysFromNow.toISOString())
      .order('start_time', { ascending: true });

    if (sessionError) {
      throw new Error(`Error fetching sessions: ${sessionError.message}`);
    }

    if (!rawSessionData || rawSessionData.length === 0) {
      return [];
    } // Cast rawSessionData to our Session type, fixing Supabase's array inference
    const sessionData: SessionForUnpaidStudents[] = rawSessionData
      .map((session) => ({
        ...session,
        class: Array.isArray(session.class)
          ? session.class[0] || null
          : session.class || null,
      }))
      .map((session) => ({
        ...session,
        class: session.class
          ? {
              ...session.class,
              students: (session.class.students || [])
                .map((enrollment: any) => ({
                  ...enrollment,
                  student: Array.isArray(enrollment.student)
                    ? enrollment.student
                        .filter((s: any) => s.email !== null)
                        .map((s: any) => ({
                          ...s,
                          email: s.email as string, // Type assertion since we filtered out nulls
                        }))
                    : enrollment.student?.email !== null
                      ? {
                          ...enrollment.student,
                          email: enrollment.student.email as string,
                        }
                      : [], // Return empty array if student has no email
                }))
                .filter((enrollment: any) =>
                  Array.isArray(enrollment.student)
                    ? enrollment.student.length > 0
                    : enrollment.student &&
                      Object.keys(enrollment.student).length > 0,
                ),
            }
          : null,
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

export async function getAllUpcomingSessionsWithin1_2Hrs(
  client: SupabaseClient<Database>,
): Promise<NotificationClass[] | []> {
  try {
    // Calculate the timestamp for 24-25 hours from now in UTC
    const now = new Date();
    // Add 24 hours for notifications
    const next1Hours = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    const next2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Log the window for debugging
    console.log(
      `Looking for sessions between ${next1Hours.toISOString()} and ${next2Hours.toISOString()}`,
    );

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
      .gte('start_time', next1Hours.toISOString())
      .lte('start_time', next2Hours.toISOString())
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
export async function getTutorsForSessionsWithin1Hr(
  client: SupabaseClient<Database>,
): Promise<TutorNotificationClass[] | []> {
  try {
    // Calculate the timestamp for 1 hour from now in UTC
    const now = new Date();
    const currentTime = new Date(now.getTime());
    const next1Hours = new Date(now.getTime() + 1 * 60 * 60 * 1000);

    // console.log(
    //   `Looking for tutor sessions within 1 hour between ${currentTime.toISOString()} and ${next1Hours.toISOString()}`,
    // );

    const { data, error } = await client
      .from(SESSIONS_TABLE)
      .select(
        `
          id,
          start_time,
          class_id,
          class:${CLASSES_TABLE}!class_id (
            id,
            name,
            tutor_id,
            tutor:${USERS_TABLE}!tutor_id (
              id,
              first_name,
              last_name,
              phone_number
            )
          )
        `,
        { count: 'exact' },
      )
      .gte('start_time', currentTime.toISOString())
      .lte('start_time', next1Hours.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(
        `Error fetching tutor sessions within 1 hour: ${error.message}`,
      );
    }

    if (!data) {
      return [];
    }

    const transformedData: TutorNotificationClass[] = data
      .map((sessionData) => {
        if (!sessionData?.class) {
          return null;
        }

        const classData = Array.isArray(sessionData.class)
          ? sessionData.class[0]
          : sessionData.class;

        if (!classData?.tutor) {
          return null;
        }

        const tutorData = Array.isArray(classData.tutor)
          ? classData.tutor[0]
          : classData.tutor;

        return {
          session_id: sessionData.id,
          class_id: classData.id,
          class_name: classData.name,
          next_session_time: sessionData.start_time,
          tutor_name: tutorData?.first_name
            ? `${tutorData.first_name}${tutorData.last_name ? ` ${tutorData.last_name}` : ''}`
            : null,
          tutor_phone_number: tutorData?.phone_number || null,
        } as TutorNotificationClass;
      })
      .filter((item): item is TutorNotificationClass => item !== null);

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch tutor sessions within 1 hour:', error);
    throw error;
  }
}

export async function getStudentsByClassId(
  client: SupabaseClient<Database>,
  classId: string,
): Promise<Student[] | []> {
  try {
    const { data, error } = await client
      .from(STUDENT_CLASS_ENROLLMENTS_TABLE)
      .select(
        `
          id,
          student_id,
          student:${USERS_TABLE}!student_id (
            id,
            first_name,
            last_name,
            email,
            phone_number
          )
        `,
      )
      .eq('class_id', classId);

    if (error) {
      throw new Error(`Error fetching students for class: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    const transformedData: Student[] = data.map((enrollment) => {
      const studentData = Array.isArray(enrollment.student)
        ? enrollment.student[0]
        : enrollment.student;

      return {
        id: enrollment.id,
        student: {
          id: studentData?.id ?? '',
          first_name: studentData?.first_name ?? null,
          last_name: studentData?.last_name ?? null,
          email: studentData?.email ?? '',
          phone_number: studentData?.phone_number ?? null,
        },
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch students by class ID:', error);
    throw error;
  }
}
