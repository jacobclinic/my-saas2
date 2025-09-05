import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';
import {
  CLASSES_TABLE,
  SESSIONS_TABLE,
  STUDENT_SESSION_ATTENDANCE_TABLE,
  STUDENT_CLASS_ENROLLMENTS_TABLE,
  USERS_TABLE,
  RESOURCE_MATERIALS_TABLE,
  STUDENT_PAYMENTS_TABLE,
  ZOOM_USERS_TABLE
} from '~/lib/db-tables';
import { SessionsWithTableData } from '../types/session';
import {
  PastSession,
  pastSessionsForAttendance,
  UpcomingSession,
} from '../types/session-v2';
import { PAYMENT_STATUS } from '~/lib/student-payments/constant';
import { PaymentStatus } from '~/lib/payments/types/admin-payments';
import { Result, success, failure } from '~/lib/shared/result';
import { AppError } from '~/lib/shared/errors';

// Helper function to calculate payment due date (one day before 2nd class of the month)
async function calculatePaymentDueDate(
  client: SupabaseClient<Database>,
  classId: string,
  sessionMonth: string
): Promise<Result<string>> {
  try {
    // Get all sessions for this class in the given month
    const monthStart = `${sessionMonth}-01`;
    const nextMonth = new Date(sessionMonth + '-01');
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthEnd = nextMonth.toISOString().slice(0, 10);

    const { data: sessions, error } = await client
      .from(SESSIONS_TABLE)
      .select('start_time')
      .eq('class_id', classId)
      .gte('start_time', `${monthStart}T00:00:00`)
      .lt('start_time', `${monthEnd}T00:00:00`)
      .order('start_time', { ascending: true })
      .limit(2);

    if (error) {
      return failure(new AppError('Failed to fetch sessions', 'QUERY_ERROR'));
    }

    if (!sessions || sessions.length < 2) {
      return failure(new AppError('Cannot calculate due date without at least 2 sessions', 'INSUFFICIENT_DATA'));
    }

    // Get the 2nd session date and subtract 1 day
    const secondSessionStartTime = sessions[1].start_time;
    if (!secondSessionStartTime) {
      return failure(new AppError('Second session has no start time', 'INVALID_DATA'));
    }
    
    // Parse the date and work with UTC to avoid timezone issues
    const secondSessionDate = new Date(secondSessionStartTime);
    
    // Create a new date for the due date calculation using setDate for proper date arithmetic
    const dueDate = new Date(secondSessionDate);
    dueDate.setDate(dueDate.getDate() - 1);

    const formattedDueDate = dueDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    
    return success(formattedDueDate);
  } catch (error) {
    return failure(new AppError('Failed to calculate payment due date', 'CALCULATION_ERROR'));
  }
}

// /**
//  * @description Fetch session object data (not auth!) by ID {@link sessionId}
//  */
// export async function getSessionDataById(
//   client: SupabaseClient<Database>,
//   sessionId: string,
// ): Promise<SessionsWithTableData | null>  {
//   try {
//     const { data } = await client
//       .from(SESSIONS_TABLE)
//       .select(
//         `
//           id,
//           classId,
//           recordingUrls,
//           status,
//           startTime,
//           endTime,
//           recurringSessionId,
//           title,
//           description,
//           updatedAt,
//             class:${CLASSES_TABLE}!classId (
//               id,
//               name,
//               tutorId,
//               tutor:${USERS_TABLE}!tutorId (
//                 id,
//                 firstName,
//                 lastName
//               ),
//               noOfStudents:${STUDENT_CLASS_ENROLLMENTS_TABLE}!id(count)
//             ),
//             noOfAtendedStudents:${STUDENT_SESSION_ATTENDANCE_TABLE}!id(count)
//         `,
//         { count: 'exact' }
//       )
//       .eq('id', sessionId)
//       .maybeSingle() as { data: SessionsWithTableDataRawData | null };

//     console.log("getAllSessionsData", data)

//     if (!data) {
//       return null;
//     }

//     // Transform the data to get the count directly
//     const transformedData: SessionsWithTableData = {
//       ...data,
//       class: {
//         ...data.class,
//         noOfStudents: data?.class?.noOfStudents[0]?.count || 0,
//       },
//       noOfAtendedStudents: data?.noOfAtendedStudents[0]?.count || 0,
//     };

//     console.log("getAllSessionsData-2", transformedData)

//     return transformedData;
//   } catch (error) {
//     console.error('Failed to fetch session by id:', error);
//     throw error;
//   }
// }

// export async function getAllSessionsData(
//   client: SupabaseClient<Database>,
// ): Promise<SessionsWithTableData[] | []> {
//   try {
//     const { data, error } = await client
//       .from(SESSIONS_TABLE)
//       .select(
//         `
//           id,
//           classId,
//           recordingUrls,
//           status,
//           startTime,
//           endTime,
//           recurringSessionId,
//           title,
//           description,
//           updatedAt,
//           class:${CLASSES_TABLE}!classId (
//             id,
//             name,
//             tutorId,
//             tutor:${USERS_TABLE}!tutorId (
//               id,
//               firstName,
//               lastName
//             ),
//             noOfStudents:${STUDENT_CLASS_ENROLLMENTS_TABLE}!id(count)
//           ),
//           noOfAtendedStudents:${STUDENT_SESSION_ATTENDANCE_TABLE}!id(count)
//         `,
//       )
//       .returns<SessionsWithTableDataRawData[]>();

//     console.log("getAllSessionsData", data)

//     if (error) {
//       throw new Error(`Error fetching sessions: ${error.message}`);
//     }

//     if (!data) {
//       return [];
//     }

//     // Transform the data to get the count directly
//     const transformedData: SessionsWithTableData[] = data?.map((sessionData) => ({
//       ...sessionData,
//       class: {
//         ...sessionData?.class,
//         noOfStudents: sessionData?.class?.noOfStudents[0]?.count || 0,
//       },
//       noOfAtendedStudents: sessionData?.noOfAtendedStudents[0]?.count || 0,
//     }));

//     console.log("getAllSessionsData-2", transformedData)

//     return transformedData;

//   } catch (error) {
//     console.error('Failed to fetch sessions:', error);
//     throw error;
//   }
// }

// export async function getAllSessionsByClassIdData(
//   client: SupabaseClient<Database>,
//   classId: string
// ): Promise<SessionsWithTableData[] | []> {
//   try {
//     const { data, error } = await client
//       .from(SESSIONS_TABLE)
//       .select(
//         `
//           id,
//           classId,
//           recordingUrls,
//           status,
//           startTime,
//           endTime,
//           recurringSessionId,
//           title,
//           description,
//           updatedAt,
//           class:${CLASSES_TABLE}!classId (
//             id,
//             name,
//             tutorId,
//             tutor:${USERS_TABLE}!tutorId (
//               id,
//               firstName,
//               lastName
//             ),
//             noOfStudents:${STUDENT_CLASS_ENROLLMENTS_TABLE}!id(count)
//           ),
//           noOfAtendedStudents:${STUDENT_SESSION_ATTENDANCE_TABLE}!id(count)
//         `,
//       )
//       .eq('classId', classId)
//       // .maybeSingle() as { data: SessionsWithTableDataRawData | null };
//       .returns<SessionsWithTableDataRawData[]>();

//     console.log("getAllSessionsData", data)

//     if (error) {
//       throw new Error(`Error fetching sessions: ${error.message}`);
//     }

//     if (!data) {
//       return [];
//     }

//     // Transform the data to get the count directly
//     const transformedData: SessionsWithTableData[] = data?.map((sessionData) => ({
//       ...sessionData,
//       class: {
//         ...sessionData?.class,
//         noOfStudents: sessionData?.class?.noOfStudents[0]?.count || 0,
//       },
//       noOfAtendedStudents: sessionData?.noOfAtendedStudents[0]?.count || 0,
//     }));

//     console.log("getAllSessionsData-2", transformedData)

//     return transformedData;

//   } catch (error) {
//     console.error('Failed to fetch sessions:', error);
//     throw error;
//   }
// }

// ------------------version 2----------------

// create a query to get session data by sessions id
export async function getSessionDataById(
  client: SupabaseClient<Database>,
  sessionId: string,
): Promise<UpcomingSession | null> {
  try {
    const { data, error } = await client
      .from(SESSIONS_TABLE)
      .select(
        `
          *,
          class:${CLASSES_TABLE}!class_id (
            id,
            name,
            subject,
            tutor_id,
            tutor:${USERS_TABLE}!tutor_id(
              id,
              first_name,
              last_name,
              email
            )
          )          
        `,
      )
      .eq('id', sessionId)
      .single();

    // console.log("getAllSessionsData", data)

    if (error) {
      throw new Error(`Error fetching sessions: ${error.message}`);
    }

    let classTemp;
    let tutorTemp;
    if (data?.class) {
      if (Array.isArray(data.class)) classTemp = data.class[0];
      else classTemp = data.class;
    }
    if (classTemp?.tutor) {
      if (Array.isArray(classTemp.tutor)) tutorTemp = classTemp.tutor[0];
      else tutorTemp = classTemp.tutor;
    }

    return {
      ...data,
      class: {
        ...classTemp,
        tutor: tutorTemp,
      },
    };
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getAllUpcommingSessionsData(
  client: SupabaseClient<Database>,
): Promise<UpcomingSession[] | []> {
  try {
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
            tutor:${USERS_TABLE}!tutor_id (
              id,
              first_name,
              last_name,
              email
            ),
            students:${STUDENT_CLASS_ENROLLMENTS_TABLE}!class_id(id)
          ),
          materials:${RESOURCE_MATERIALS_TABLE}!id (
            id,
            name,
            url,
            file_size
          )
        `,
        { count: 'exact' },
      )
      .gt('end_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    // console.log("getAllSessionsData", data)

    if (error) {
      throw new Error(`Error fetching sessions: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    const transformedData = data?.map((sessionData) => {
      let classTemp;
      if (sessionData?.class) {
        if (Array.isArray(sessionData.class)) {
          classTemp = sessionData.class[0];
        } else {
          classTemp = sessionData.class;
        }
      }
      return {
        ...sessionData,
        class: classTemp
          ? {
            id: classTemp.id,
            name: classTemp.name,
            subject: classTemp.subject,
            tutor_id: classTemp.tutor_id,
            tutor: Array.isArray(classTemp.tutor)
              ? classTemp.tutor[0]
              : classTemp.tutor || undefined,
            students: classTemp.students,
          }
          : undefined,
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getTodaysAllUpcommingSessionsData(
  client: SupabaseClient<Database>,
): Promise<UpcomingSession[] | []> {
  try {
    const today = new Date().toISOString();
    const tommorow = new Date(
      new Date().getTime() + 24 * 60 * 60 * 1000,
    ).toISOString();

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
            tutor:${USERS_TABLE}!tutor_id (
              id,
              first_name,
              last_name,
              email
            ),
            students:${STUDENT_CLASS_ENROLLMENTS_TABLE}!class_id(id)
          ),
          materials:${RESOURCE_MATERIALS_TABLE}!id (
            id,
            name,
            url,
            file_size
          )
        `,
        { count: 'exact' },
      )
      .gt('start_time', today)
      .lt('end_time', tommorow)
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(`Error fetching sessions: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    const transformedData = data?.map((sessionData) => {
      let classTemp;
      if (sessionData?.class) {
        if (Array.isArray(sessionData.class)) {
          classTemp = sessionData.class[0];
        } else {
          classTemp = sessionData.class;
        }
      }
      return {
        ...sessionData,
        class: classTemp
          ? {
            id: classTemp.id,
            name: classTemp.name,
            subject: classTemp.subject,
            tutor_id: classTemp.tutor_id,
            tutor: Array.isArray(classTemp.tutor)
              ? classTemp.tutor[0]
              : classTemp.tutor || undefined,
            students: classTemp.students,
          }
          : undefined,
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getAllUpcommingSessionsDataPerWeek(
  client: SupabaseClient<Database>,
): Promise<UpcomingSession[] | []> {
  try {
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
            students:${STUDENT_CLASS_ENROLLMENTS_TABLE}!class_id(id)
          ),
          materials:${RESOURCE_MATERIALS_TABLE}!id (
            id,
            name,
            url,
            file_size
          )
        `,
        { count: 'exact' },
      )
      .gt('start_time', new Date().toISOString())
      .lt(
        'start_time',
        new Date(new Date().getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      )
      .order('start_time', { ascending: true });

    // console.log("getAllSessionsData", data)

    if (error) {
      throw new Error(`Error fetching sessions: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    const transformedData = data?.map((sessionData) => {
      let classTemp;
      if (sessionData?.class) {
        if (Array.isArray(sessionData.class)) classTemp = sessionData.class[0];
        else classTemp = sessionData.class;
      }
      return {
        ...sessionData,
        class: classTemp,
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getAllUpcommingSessionsByTutorIdData(
  client: SupabaseClient<Database>,
  tutor_id: string,
  isDashboard?: boolean,
): Promise<UpcomingSession[] | []> {
  try {
    const { data: tutorClasses, error: classError } = await client
      .from(CLASSES_TABLE)
      .select('id')
      .eq('tutor_id', tutor_id);

    if (classError) {
      throw new Error(`Error fetching tutor classes: ${classError.message}`);
    }

    // Get the class IDs
    const classIds = tutorClasses.map((c) => c.id);

    // If no classes found and tutor_id was provided, return empty array
    if (tutor_id && classIds.length === 0) {
      return [];
    }

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Create base query
    let query = client
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
            students:${STUDENT_CLASS_ENROLLMENTS_TABLE}!class_id(id)
          ),
          materials:${RESOURCE_MATERIALS_TABLE}!id (
            id,
            name,
            url,
            file_size
          )
        `,
        { count: 'exact' },
      )
      .gt('end_time', new Date().toISOString())
      .in('class_id', classIds)
      .order('start_time', { ascending: true });

    // If isDashboard is true, get sessions within the next week
    if (isDashboard) {
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);

      query = query
        .lt('start_time', nextWeek.toISOString())
        .order('start_time', { ascending: true });
    }

    const { data: upcomingSessions, error: upcomingSessionError } = await query;

    // console.log("getAllSessionsData", upcomingSessions)

    if (upcomingSessionError) {
      throw new Error(
        `Error fetching sessions: ${upcomingSessionError.message}`,
      );
    }

    if (!upcomingSessions) {
      return [];
    }

    const transformedData = upcomingSessions?.map((sessionData) => {
      let classTemp;
      if (sessionData?.class) {
        if (Array.isArray(sessionData.class)) classTemp = sessionData.class[0];
        else classTemp = sessionData.class;
      }
      return {
        ...sessionData,
        class: classTemp,
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getAllUpcommingSessionsByTutorIdDataPerWeek(
  client: SupabaseClient<Database>,
  tutor_id: string,
  isDashboard?: boolean,
): Promise<UpcomingSession[] | []> {
  try {
    const { data: tutorClasses, error: classError } = await client
      .from(CLASSES_TABLE)
      .select('id')
      .eq('tutor_id', tutor_id);

    if (classError) {
      throw new Error(`Error fetching tutor classes: ${classError.message}`);
    }

    // Get the class IDs
    const classIds = tutorClasses.map((c) => c.id);

    // If no classes found and tutor_id was provided, return empty array
    if (tutor_id && classIds.length === 0) {
      return [];
    }

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Create base query
    let query = client
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
            students:${STUDENT_CLASS_ENROLLMENTS_TABLE}!class_id(id)
          ),
          materials:${RESOURCE_MATERIALS_TABLE}!id (
            id,
            name,
            url,
            file_size
          )
        `,
        { count: 'exact' },
      )
      .gt('end_time', new Date().toISOString())
      .lt('start_time', sevenDaysFromNow.toISOString())
      .in('class_id', classIds)
      .order('start_time', { ascending: true });

    const { data: upcomingSessions, error: upcomingSessionError } = await query;

    // console.log("getAllSessionsData", upcomingSessions)

    if (upcomingSessionError) {
      throw new Error(
        `Error fetching sessions: ${upcomingSessionError.message}`,
      );
    }

    if (!upcomingSessions) {
      return [];
    }

    const transformedData = upcomingSessions?.map((sessionData) => {
      let classTemp;
      if (sessionData?.class) {
        if (Array.isArray(sessionData.class)) classTemp = sessionData.class[0];
        else classTemp = sessionData.class;
      }
      return {
        ...sessionData,
        class: classTemp,
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getAllUpcommingSessionsByTutorIdPerWeekByIndices(
  client: SupabaseClient<Database>,
  tutor_id: string,
  indexOfFirstItem: number,
  indexOfLastItem: number,
): Promise<UpcomingSession[] | []> {
  try {
    const { data: tutorClasses, error: classError } = await client
      .from(CLASSES_TABLE)
      .select('id')
      .eq('tutor_id', tutor_id);

    if (classError) {
      throw new Error(`Error fetching tutor classes: ${classError.message}`);
    }

    // Get the class IDs
    const classIds = tutorClasses.map((c) => c.id);

    // If no classes found and tutor_id was provided, return empty array
    if (tutor_id && classIds.length === 0) {
      return [];
    }

    // Create base query
    let query = client
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
            students:${STUDENT_CLASS_ENROLLMENTS_TABLE}!class_id(id)
          ),
          materials:${RESOURCE_MATERIALS_TABLE}!id (
            id,
            name,
            url,
            file_size
          )
        `,
        { count: 'exact' },
      )
      .gt('start_time', new Date().toISOString())
      .lt(
        'start_time',
        new Date(new Date().getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      )
      .in('class_id', classIds)
      .order('start_time', { ascending: true })
      .range(indexOfFirstItem, indexOfLastItem - 1);

    const { data: upcomingSessions, error: upcomingSessionError } = await query;

    // console.log("getAllSessionsData", upcomingSessions)

    if (upcomingSessionError) {
      throw new Error(
        `Error fetching sessions: ${upcomingSessionError.message}`,
      );
    }

    if (!upcomingSessions) {
      return [];
    }

    const transformedData = upcomingSessions?.map((sessionData) => {
      let classTemp;
      if (sessionData?.class) {
        if (Array.isArray(sessionData.class)) classTemp = sessionData.class[0];
        else classTemp = sessionData.class;
      }
      return {
        ...sessionData,
        class: classTemp,
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getNoOfUpcomingSessionsByStudentIdDataPerWeek(
  client: SupabaseClient<Database>,
  tutor_id: string,
): Promise<number | null> {
  try {
    const { data: tutorClasses, error: classError } = await client
      .from(CLASSES_TABLE)
      .select('id')
      .eq('tutor_id', tutor_id);

    if (classError) {
      throw new Error(`Error fetching tutor classes: ${classError.message}`);
    }
    const classIds = tutorClasses.map((c) => c.id);

    // If no classes found and tutor_id was provided, return empty array
    if (tutor_id && classIds.length === 0) {
      return 0;
    }

    const { count, error } = await client
      .from(SESSIONS_TABLE)
      .select('*', { count: 'exact', head: true })
      .gt('start_time', new Date().toISOString())
      .lt(
        'start_time',
        new Date(new Date().getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      )
      .in('class_id', classIds);
    if (error) {
      console.error('Error getting session count:', error);
      throw error;
    }

    console.log('Total matching sessions:', count);
    return count;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getAllPastSessionsData(
  client: SupabaseClient<Database>,
): Promise<PastSession[] | []> {
  try {
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
            students:${STUDENT_CLASS_ENROLLMENTS_TABLE}!class_id(id)
          ),
          materials:${RESOURCE_MATERIALS_TABLE}!id (
            id,
            name,
            url,
            file_size
          ),
          attendance:${STUDENT_SESSION_ATTENDANCE_TABLE}!id (
            time,
            name,
            email,
            join_time,
            leave_time
          )
        `,
        { count: 'exact' },
      )
      .lt('start_time', new Date().toISOString())
      .order('start_time', { ascending: false });

    // console.log("getAllSessionsData", data)

    if (error) {
      throw new Error(`Error fetching sessions: ${error.message}`);
    }

    if (!data) {
      return [];
    } // Transform the data to get the count directly
    const transformedData = data?.map((sessionData) => {
      let classTemp;
      let attendanceTemp;
      if (sessionData?.class) {
        if (Array.isArray(sessionData.class)) classTemp = sessionData.class[0];
        else classTemp = sessionData.class;
      }
      if (sessionData?.attendance?.length > 0) {
        attendanceTemp = sessionData.attendance.map((attendee) => {
          // Ensure each attendance record has all required fields from PastSession
          return {
            time: attendee.time || null,
            email: attendee.email || null,
            name: attendee.name || null,
            join_time: attendee.join_time,
            leave_time: attendee.leave_time,
          };
        });
      }
      return {
        ...sessionData,
        class: classTemp,
        attendance: attendanceTemp ?? [],
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getAllPastSessionsDataAdmin(
  client: SupabaseClient<Database>,
): Promise<PastSession[] | []> {
  try {
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
          attendance_marked,
          class:${CLASSES_TABLE}!class_id (
            id,
            name,
            subject,
            tutor_id,
            tutor:${USERS_TABLE}!tutor_id (
              id,
              first_name,
              last_name,
              email
            ),
            students:${STUDENT_CLASS_ENROLLMENTS_TABLE}!class_id(id)
          ),
          materials:${RESOURCE_MATERIALS_TABLE}!id (
            id,
            name,
            url,
            file_size
          ),
          attendance:${STUDENT_SESSION_ATTENDANCE_TABLE}!id (
            time,
            email,
            name,
            join_time,
            leave_time
          )
        `,
        { count: 'exact' },
      )
      .lt('start_time', new Date().toISOString())
      .order('start_time', { ascending: false });

    // console.log("getAllSessionsData", data)

    if (error) {
      throw new Error(`Error fetching sessions: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // Transform the data to get the count directly
    const transformedData = data?.map((sessionData) => {
      let classTemp;
      let attendanceTemp;
      if (sessionData?.class) {
        if (Array.isArray(sessionData.class)) classTemp = sessionData.class[0];
        else classTemp = sessionData.class;
      }
      if (sessionData?.attendance?.length > 0) {
        attendanceTemp = sessionData.attendance.map((attendee) => {
          // Ensure each attendance record has all required fields from PastSession
          return {
            time: attendee.time || null,
            email: attendee.email || null,
            name: attendee.name || null,
            join_time: attendee.join_time || null,
            leave_time: attendee.leave_time || null,
          };
        });
      }
      return {
        ...sessionData,
        class: classTemp
          ? {
            id: classTemp.id,
            name: classTemp.name,
            subject: classTemp.subject,
            tutor_id: classTemp.tutor_id,
            tutor: Array.isArray(classTemp.tutor)
              ? classTemp.tutor[0]
              : classTemp.tutor || undefined,
            students: classTemp.students,
          }
          : undefined,
        attendance: attendanceTemp ?? [],
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getAllPastSessionsDataWithinLastHour(
  client: SupabaseClient<Database>,
): Promise<pastSessionsForAttendance[] | []> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const twoHourAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data, error } = await client
      .from(SESSIONS_TABLE)
      .select(
        `
          id,
          zoom_meeting_id,
          attendance_marked
        `,
      )
      .lt('end_time', oneHourAgo)
      .gt('end_time', twoHourAgo)
      .eq('attendance_marked', 'FALSE')
      .order('end_time', { ascending: false })
      .returns<pastSessionsForAttendance[]>();

    // console.log("getAllSessionsData", data)

    if (error) {
      throw new Error(`Error fetching sessions: ${error.message}`);
    }

    if (!data) {
      return [];
    }
    return data;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getAllPastSessionsByTutorIdData(
  client: SupabaseClient<Database>,
  tutor_id: string,
): Promise<PastSession[] | []> {
  try {
    const { data: tutorClasses, error: classError } = await client
      .from(CLASSES_TABLE)
      .select('id')
      .eq('tutor_id', tutor_id);

    if (classError) {
      throw new Error(`Error fetching tutor classes: ${classError.message}`);
    }

    // Get the class IDs
    const classIds = tutorClasses.map((c) => c.id);

    // If no classes found and tutor_id was provided, return empty array
    if (tutor_id && classIds.length === 0) {
      return [];
    }
    const { data: pastSessions, error: pastSessionError } = await client
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
          attendance_marked,
          class:${CLASSES_TABLE}!class_id (
            id,
            name,
            subject,
            tutor_id,
            students:${STUDENT_CLASS_ENROLLMENTS_TABLE}!class_id(id)
          ),
          materials:${RESOURCE_MATERIALS_TABLE}!id (
            id,
            name,
            url,
            file_size
          ),
          attendance:${STUDENT_SESSION_ATTENDANCE_TABLE}!id (
            time,
            name,
            email,
            join_time,
            leave_time
          )
        `,
        { count: 'exact' },
      )
      .lt('start_time', new Date().toISOString())
      .in('class_id', classIds)
      .order('start_time', { ascending: false });

    // console.log("getAllSessionsData", pastSessions)

    if (pastSessionError) {
      throw new Error(`Error fetching sessions: ${pastSessionError.message}`);
    }

    if (!pastSessions) {
      return [];
    } // Transform the data to get the count directly
    const transformedData = pastSessions?.map((sessionData) => {
      let classTemp;
      let attendanceTemp;
      if (sessionData?.class) {
        if (Array.isArray(sessionData.class)) classTemp = sessionData.class[0];
        else classTemp = sessionData.class;
      }
      if (sessionData?.attendance?.length > 0) {
        attendanceTemp = sessionData.attendance.map((attendee) => {
          // Ensure each attendance record has all required fields from PastSession
          return {
            time: attendee.time || null,
            email: attendee.email || null,
            name: attendee.name || null,
            join_time: attendee.join_time || null,
            leave_time: attendee.leave_time || null,
          };
        });
      }
      return {
        ...sessionData,
        class: classTemp,
        attendance: attendanceTemp ?? [],
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getAllUpcomingSessionsByStudentIdData(
  client: SupabaseClient<Database>,
  student_id: string,
): Promise<UpcomingSession[] | []> {
  try {
    const { data: studentClasses, error: classError } = await client
      .from(STUDENT_CLASS_ENROLLMENTS_TABLE)
      .select('class_id')
      .eq('student_id', student_id);

    if (classError) {
      throw new Error(`Error fetching student classes: ${classError.message}`);
    }

    // Get the class IDs
    const classIds = studentClasses.map((c) => c.class_id);

    // If no classes found and student_id was provided, return empty array
    if (student_id && classIds.length === 0) {
      return [];
    }

    const today = new Date();
    const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
    // Calculate next month
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1)
      .toISOString()
      .slice(0, 7);

    // Create base query
    let queryForSessionData = client
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
          attendance_marked,
          class:${CLASSES_TABLE}!class_id (
            id,
            name,
            subject,
            tutor_id,
            fee
          ),
          materials:${RESOURCE_MATERIALS_TABLE}!id (
            id,
            name,
            url,
            file_size
          )
        `,
        { count: 'exact' },
      )
      .gt('start_time', new Date().toISOString())
      .in('class_id', classIds)
      .order('start_time', { ascending: true });

    let queryForPaymentData = client
      .from(STUDENT_PAYMENTS_TABLE)
      .select('*')
      .eq('student_id', student_id)
      .in('class_id', classIds)
      .gte('payment_period', currentMonth);

    const [
      { data: upcomingSessions, error: upcomingSessionError },
      { data: upcomingPayments, error: upcomingPaymentError },
    ] = await Promise.all([queryForSessionData, queryForPaymentData]);

    // console.log('getAllSessionsData', upcomingSessions);

    if (upcomingSessionError) {
      throw new Error(
        `Error fetching sessions: ${upcomingSessionError.message}`,
      );
    }

    if (upcomingPaymentError) {
      throw new Error(
        `Error fetching payments: ${upcomingPaymentError.message}`,
      );
    }

    if (!upcomingSessions) {
      return [];
    }

    const transformedData = upcomingSessions?.map((sessionData) => {
      let classTemp;
      if (sessionData?.class) {
        if (Array.isArray(sessionData.class)) classTemp = sessionData.class[0];
        else classTemp = sessionData.class;
      }

      // Find relevant payment
      const sessionMonth = new Date(sessionData.start_time || '')
        .toISOString()
        .slice(0, 7);
      const currentPayment = upcomingPayments.find(
        (payment) =>
          payment.class_id === sessionData.class_id &&
          payment.payment_period === sessionMonth,
      );

      // Transform materials based on payment status
      const transformedMaterials = sessionData.materials?.map((material) => {
        if (currentPayment?.status === PaymentStatus.VERIFIED) {
          return material;
        }
        const { url, ...materialWithoutUrl } = material;
        return materialWithoutUrl;
      });

      return {
        ...sessionData,
        class: classTemp,
        materials: transformedMaterials || [],
        payment_status: currentPayment?.status || PAYMENT_STATUS.PENDING,
        payment_amount: currentPayment?.amount || classTemp?.fee || null,
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getAllUpcomingSessionsByStudentIdPerWeek(
  client: SupabaseClient<Database>,
  student_id: string,
): Promise<UpcomingSession[] | []> {
  try {
    const { data: studentClasses, error: classError } = await client
      .from(STUDENT_CLASS_ENROLLMENTS_TABLE)
      .select('class_id')
      .eq('student_id', student_id);

    if (classError) {
      throw new Error(`Error fetching student classes: ${classError.message}`);
    }

    // Get the class IDs
    const classIds = studentClasses.map((c) => c.class_id);

    // If no classes found and student_id was provided, return empty array
    if (student_id && classIds.length === 0) {
      return [];
    }

    const today = new Date();
    const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
    // Calculate next month
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1)
      .toISOString()
      .slice(0, 7);

    // Create base query
    let queryForSessionData = client
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
            fee,
            tutor:${USERS_TABLE}!tutor_id (
            id, 
            first_name, 
            last_name, 
            email
            )
          ),
          materials:${RESOURCE_MATERIALS_TABLE}!id (
            id,
            name,
            url,
            file_size
          )
        `,
        { count: 'exact' },
      )
      .gt('end_time', new Date().toISOString())
      .lt(
        'start_time',
        new Date(new Date().getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      )
      .in('class_id', classIds)
      .order('start_time', { ascending: true });

    let queryForPaymentData = client
      .from(STUDENT_PAYMENTS_TABLE)
      .select('*')
      .eq('student_id', student_id)
      .in('class_id', classIds)
      .gte('payment_period', currentMonth);

    const [
      { data: upcomingSessions, error: upcomingSessionError },
      { data: upcomingPayments, error: upcomingPaymentError },
    ] = await Promise.all([queryForSessionData, queryForPaymentData]);

    if (upcomingSessionError) {
      throw new Error(
        `Error fetching sessions: ${upcomingSessionError.message}`,
      );
    }

    if (upcomingPaymentError) {
      throw new Error(
        `Error fetching payments: ${upcomingPaymentError.message}`,
      );
    }

    if (!upcomingSessions) {
      return [];
    }

    const transformedData = await Promise.all(
      upcomingSessions?.map(async (sessionData) => {
        let classTemp;
        if (sessionData?.class) {
          if (Array.isArray(sessionData.class)) classTemp = sessionData.class[0];
          else classTemp = sessionData.class;
        }

        // Find relevant payment
        const sessionMonth = new Date(sessionData.start_time || '')
          .toISOString()
          .slice(0, 7);
        const currentPayment = upcomingPayments.find(
          (payment) =>
            payment.class_id === sessionData.class_id &&
            payment.payment_period === sessionMonth,
        );

        // Calculate payment due date (one day before 2nd class of the month)
        let paymentDueDate: string | null = null;
        
        if (
          sessionData.class_id &&
          (currentPayment?.status === PAYMENT_STATUS.PENDING ||
            currentPayment?.status === PAYMENT_STATUS.PENDING_VERIFICATION ||
            currentPayment?.status === PAYMENT_STATUS.REJECTED ||
            !currentPayment) // No payment record means pending
        ) {
          const dueDateResult = await calculatePaymentDueDate(
            client,
            sessionData.class_id,
            sessionMonth
          );
          
          if (dueDateResult.success) {
            paymentDueDate = dueDateResult.data;
          }
          // If calculation fails, paymentDueDate remains null
        }

        // Transform materials based on payment status
        const transformedMaterials = sessionData.materials?.map((material) => {
          if (currentPayment?.status === PaymentStatus.VERIFIED) {
            return material;
          }
          const { url, ...materialWithoutUrl } = material;
          return materialWithoutUrl;
        });

        return {
          ...sessionData,
          class: classTemp
            ? {
              id: classTemp.id,
              name: classTemp.name,
              subject: classTemp.subject,
              tutor_id: classTemp.tutor_id,
              fee: classTemp.fee,
              tutor: Array.isArray(classTemp.tutor)
                ? classTemp.tutor[0]
                : classTemp.tutor || undefined,
            }
            : undefined,
          materials: transformedMaterials || [],
          payment_status: currentPayment?.status || PAYMENT_STATUS.PENDING,
          payment_amount: currentPayment?.amount || classTemp?.fee || null,
          payment_due_date: paymentDueDate,
        };
      }) || []
    );

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getAllPastSessionsByStudentIdData(
  client: SupabaseClient<Database>,
  student_id: string,
): Promise<PastSession[] | []> {
  try {
    const { data: studentClasses, error: classError } = await client
      .from(STUDENT_CLASS_ENROLLMENTS_TABLE)
      .select('class_id')
      .eq('student_id', student_id);

    if (classError) {
      throw new Error(`Error fetching student classes: ${classError.message}`);
    }

    // Get the class IDs
    const classIds = studentClasses.map((c) => c.class_id);

    // If no classes found and student_id was provided, return empty array
    if (student_id && classIds.length === 0) {
      return [];
    }

    const today = new Date();
    const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
    // Calculate next month
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1)
      .toISOString()
      .slice(0, 7);

    // Create base query
    let queryForSessionData = client
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
            fee,
            tutor:${USERS_TABLE}!id(
              id,
              first_name,
              last_name,
              email
            ),
            students:${STUDENT_CLASS_ENROLLMENTS_TABLE}!class_id(id)
          ),
          materials:${RESOURCE_MATERIALS_TABLE}!id (
            id,
            name,
            url,
            file_size
          )
        `,
        { count: 'exact' },
      )
      .lt('start_time', new Date().toISOString())
      .in('class_id', classIds)
      .order('start_time', { ascending: false });

    let queryForPaymentData = client
      .from(STUDENT_PAYMENTS_TABLE)
      .select('*')
      .eq('student_id', student_id)
      .in('class_id', classIds)
      .lte('payment_period', currentMonth);

    const [
      { data: pastSessions, error: pastSessionError },
      { data: pastPayments, error: pastPaymentError },
    ] = await Promise.all([queryForSessionData, queryForPaymentData]);


    if (pastSessionError) {
      throw new Error(`Error fetching sessions: ${pastSessionError.message}`);
    }

    if (pastPaymentError) {
      throw new Error(`Error fetching payments: ${pastPaymentError.message}`);
    }

    if (!pastSessions) {
      return [];
    }

    const transformedData = pastSessions?.map((sessionData) => {
      let classTemp;
      if (sessionData?.class) {
        if (Array.isArray(sessionData.class)) classTemp = sessionData.class[0];
        else classTemp = sessionData.class;
      }

      let tutorTemp;
      if (classTemp?.tutor) {
        if (Array.isArray(classTemp.tutor)) {
          tutorTemp = classTemp.tutor[0];
        } else {
          tutorTemp = classTemp.tutor;
        }
      }

      // Find relevant payment
      const sessionMonth = new Date(sessionData.start_time || '')
        .toISOString()
        .slice(0, 7);
      const currentPayment = pastPayments.find(
        (payment) =>
          payment.class_id === sessionData.class_id &&
          payment.payment_period === sessionMonth,
      );

      // Transform materials based on payment status
      const transformedMaterials = sessionData.materials?.map((material) => {
        if (currentPayment?.status === PaymentStatus.VERIFIED) {
          return material;
        }
        const { url, ...materialWithoutUrl } = material;
        return materialWithoutUrl;
      });

      //transform sessionData based on payment status
      if (currentPayment?.status != PaymentStatus.VERIFIED) {
        sessionData.recording_urls = null;
      }

      return {
        ...sessionData,
        class: classTemp
          ? {
              id: classTemp.id,
              name: classTemp.name,
              subject: classTemp.subject,
              tutor_id: classTemp.tutor_id,
              fee: classTemp.fee,
              tutor: tutorTemp,
              students: classTemp.students,
            }
          : undefined,
        materials: transformedMaterials || [],
        payment_status: currentPayment?.status || PAYMENT_STATUS.PENDING,
        payment_amount: currentPayment?.amount || classTemp?.fee || null,
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getSessionByStudentIdData(
  client: SupabaseClient<Database>,
  student_id: string,
  session_id: string,
): Promise<UpcomingSession | PastSession | null> {
  try {
    // Get session data with all related info
    const { data: sessionData, error: sessionError } = await client
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
            fee
          ),
          materials:${RESOURCE_MATERIALS_TABLE}!id (
            id,
            name,
            url,
            file_size
          )
        `,
        { count: 'exact' },
      )
      .eq('id', session_id)
      .single();

    if (sessionError) {
      throw new Error(`Error fetching session: ${sessionError.message}`);
    }

    if (!sessionData) {
      return null;
    }

    // Get payment data for the session month
    const sessionMonth = new Date(sessionData.start_time || '')
      .toISOString()
      .slice(0, 7);
    const { data: paymentData, error: paymentError } = await client
      .from(STUDENT_PAYMENTS_TABLE)
      .select('*')
      .eq('student_id', student_id)
      .eq('class_id', sessionData.class_id || '')
      .eq('payment_period', sessionMonth)
      .single();

    if (paymentError && paymentError.code !== 'PGRST116') {
      // Ignore "not found" error
      throw paymentError;
    }

    // Format class data
    let classTemp = Array.isArray(sessionData.class)
      ? sessionData.class[0]
      : sessionData.class;

    // Transform materials based on payment status
    const transformedMaterials = sessionData.materials?.map((material) => {
      if (paymentData?.status === PaymentStatus.VERIFIED) {
        return material;
      }
      const { url, ...materialWithoutUrl } = material;
      return materialWithoutUrl;
    });

    const transformedData = {
      ...sessionData,
      class: classTemp,
      materials: transformedMaterials || [],
      payment_status: paymentData?.status || PAYMENT_STATUS.PENDING,
      payment_amount: paymentData?.amount || classTemp?.fee || null,
    };

    // console.log("---------------getSessionByStudentIdData-------", transformedData)

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function isStudentEnrolledInSessionClass(
  client: SupabaseClient<Database>,
  session_id: string,
  student_id: string,
): Promise<boolean> {
  try {
    // Step 1: Get the class_id from the sessions table using the session_id
    const { data: sessionData, error: sessionError } = await client
      .from('sessions')
      .select('class_id')
      .eq('id', session_id)
      .single();

    if (sessionError) {
      throw new Error(`Error fetching session: ${sessionError.message}`);
    }

    if (!sessionData || !sessionData.class_id) {
      throw new Error(
        `Session with ID ${session_id} not found or has no associated class.`,
      );
    }

    const classId = sessionData.class_id;

    // Step 2: Check if the student is enrolled in the class using student_class_enrollments
    const { data: enrollmentData, error: enrollmentError } = await client
      .from('student_class_enrollments')
      .select('id')
      .eq('student_id', student_id)
      .eq('class_id', classId)
      .single();

    if (enrollmentError) {
      // If the error is a "not found" error (PGRST116), it means the student is not enrolled
      if (enrollmentError.code === 'PGRST116') {
        return false;
      }
      throw new Error(`Error checking enrollment: ${enrollmentError.message}`);
    }

    // If enrollmentData exists, the student is enrolled in the class
    return !!enrollmentData;
  } catch (error) {
    console.error('Failed to check student enrollment:', error);
    throw error;
  }
}

export async function getNextSessionByClassID(
  client: SupabaseClient<Database>,
  class_id: string,
): Promise<UpcomingSession | null> {
  try {
    const { data, error } = await client
      .from(SESSIONS_TABLE)
      .select(
        `
          id,
          class_id,
          start_time,
          end_time,
          title,
          description,
          updated_at,
          class:${CLASSES_TABLE}!class_id (
            id,
            name,
            subject,
            description,
            tutor:${USERS_TABLE}!tutor_id(
              first_name,
              last_name
            )
          )
        `,
        { count: 'exact' },
      )
      .eq('class_id', class_id)
      .gt('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(1);

    if (error) {
      throw new Error(`Error fetching sessions: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Normalize joined class/tutor structures that may return arrays
    const session = data[0] as unknown as UpcomingSession & {
      class?: any;
    };
    let classTemp: any = undefined;
    let tutorTemp: any = undefined;
    if (session?.class) {
      classTemp = Array.isArray(session.class) ? session.class[0] : session.class;
    }
    if (classTemp?.tutor) {
      tutorTemp = Array.isArray(classTemp.tutor) ? classTemp.tutor[0] : classTemp.tutor;
    }

    return {
      ...session,
      class: classTemp
        ? {
            ...classTemp,
            tutor: tutorTemp,
          }
        : undefined,
    } as UpcomingSession;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getSessionsWithoutRecordingUrlsOfLast24hrs(
  client: SupabaseClient<Database>,
): Promise<UpcomingSession[]> {
  try {
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
          zoom_meeting_id
        `,
        { count: 'exact' },
      )
      .is('recording_urls', null)
      .lt('start_time', new Date().toISOString())
      .gt(
        'start_time',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      )
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(`Error fetching sessions: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function checkUpcomingSessionAvailabilityForClass(
  client: SupabaseClient<Database>,
  class_id: string,
): Promise<boolean> {
  // Validate class_id as a UUID (optional, if strict validation is needed)
  if (
    !class_id.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
  ) {
    throw new Error('Invalid class_id: must be a valid UUID');
  }

  try {
    const { count, error } = await client
      .from(SESSIONS_TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('class_id', class_id)
      .gt('start_time', new Date().toISOString())
      .limit(1);

    if (error) {
      throw new Error(
        `Error fetching sessions for class ${class_id}: ${error.message}`,
      );
    }

    return (count ?? 0) > 0;
  } catch (error) {
    console.error(
      `Failed to check session availability for class ${class_id}:`,
      error,
    );
    throw new Error(
      `Failed to check session availability: ${(error as Error).message}`,
    );
  }
}

type UpcomingSessionWithZoomUser = UpcomingSession & {
  class: {
    tutor: {
      zoom_user: {
        id: string;
        zoom_user_id: string;
        email: string;
      }[];
    };
  };
};

export async function getSessionsTillTomorrowWithZoomUser(
  client: SupabaseClient<Database>
): Promise<UpcomingSessionWithZoomUser[] | []> {
  try {
    // Current time in UTC
    const now = new Date();

    // End of tomorrow in UTC (23:59:59.999)
    const tomorrowEndUTC = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      23, 59, 59, 999
    ));

    const { data, error } = await client
      .from(SESSIONS_TABLE)
      .select(`
        id,
        created_at,
        class_id,
        recording_urls,
        status,
        start_time,
        end_time,
        title,
        description,
        updated_at,
        class:${CLASSES_TABLE}!class_id (
          id,
          name,
          subject,
          tutor_id,
          tutor:${USERS_TABLE}!tutor_id (
            id,
            first_name,
            last_name,
            email,
            zoom_user: ${ZOOM_USERS_TABLE}!tutor_id (
              id,
              zoom_user_id,
              email
            )
          )
        )
      `, { count: 'exact' })
      .gt('start_time', now.toISOString())
      .lte('start_time', tomorrowEndUTC.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      throw error;
    }

    return data as unknown as UpcomingSessionWithZoomUser[] || [];
  } catch (error) {
    throw error;
  }
}

export async function getTomorrowsSessionsWithZoomUser(
  client: SupabaseClient<Database>
): Promise<UpcomingSessionWithZoomUser[] | []> {
  try {
    // Current time in UTC
    const now = new Date();

    // Start of tomorrow in UTC (00:00:00)
    const tomorrowStartUTC = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0, 0, 0, 0
    ));

    // End of tomorrow in UTC (23:59:59.999)
    const tomorrowEndUTC = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      23, 59, 59, 999
    ));

    const { data, error } = await client
      .from(SESSIONS_TABLE)
      .select(`
        id,
        created_at,
        class_id,
        recording_urls,
        status,
        start_time,
        end_time,
        title,
        description,
        updated_at,
        class:${CLASSES_TABLE}!class_id (
          id,
          name,
          subject,
          tutor_id,
          tutor:${USERS_TABLE}!tutor_id (
            id,
            first_name,
            last_name,
            email,
            zoom_user: ${ZOOM_USERS_TABLE}!tutor_id (
              id,
              zoom_user_id,
              email
            )
          )
        )
      `, { count: 'exact' })
      .gte('start_time', tomorrowStartUTC.toISOString())
      .lte('start_time', tomorrowEndUTC.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      throw error;
    }

    return data as unknown as UpcomingSessionWithZoomUser[] || [];
  } catch (error) {
    throw error;
  }
}

export async function getSessionById( client: SupabaseClient<Database>,  session_id: string) {
  try {
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
          attendance_marked
        `,
        { count: 'exact' },
      )
      .eq('id', session_id)
      .single();

    if (error) {
      throw new Error(`Error fetching session: ${error.message}`);
    }
    return data;
  } catch (error) {
    console.error('Failed to fetch session:', error);
    throw error;
  }
}