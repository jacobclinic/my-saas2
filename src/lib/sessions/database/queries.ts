import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';
import { CLASSES_TABLE, SESSIONS_TABLE, STUDENT_SESSION_ATTENDANCE_TABLE, STUDENT_CLASS_ENROLLMENTS_TABLE, USERS_TABLE, RESOURCE_MATERIALS_TABLE } from '~/lib/db-tables';
import { SessionsWithTableData } from '../types/session';
import { PastSession, UpcomingSession } from '../types/session-v2';

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

// version 2

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
        { count: 'exact' }
      )
      .gt('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    console.log("getAllSessionsData", data)

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
      return ({
        ...sessionData,
        class: classTemp,
      })
    })

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
    const classIds = tutorClasses.map(c => c.id);

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
        { count: 'exact' }
      )
      .gt('start_time', new Date().toISOString())
      .in('class_id', classIds)
      .order('start_time', { ascending: true });

    // If isDashboard is true, limit to 1 result
    if (isDashboard) {
      query = query.limit(1)
    }

    const { data: upcomingSessions, error: upcomingSessionError } = await query;

    console.log("getAllSessionsData", upcomingSessions)

    if (upcomingSessionError) {
      throw new Error(`Error fetching sessions: ${upcomingSessionError.message}`);
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
      return ({
        ...sessionData,
        class: classTemp,
      })
    })

    return transformedData;

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
            id,
            student_id,
            time,
            student:${USERS_TABLE}!student_id (
              id,
              first_name,
              last_name
            )
          )
        `,
        { count: 'exact' }
      )
      .lt('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    console.log("getAllSessionsData", data)

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
          if (Array.isArray(attendee.student)) return { ...attendee, student: attendee.student[0]};
          else return { ...attendee, student: attendee.student};          
        })
      }
      return ({
        ...sessionData,
        class: classTemp,
        attendance: attendanceTemp ?? [],
      })
    })

    return transformedData;

  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getAllPastSessionsByTutorIdData(
  client: SupabaseClient<Database>,
  tutor_id: string
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
    const classIds = tutorClasses.map(c => c.id);

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
            id,
            student_id,
            time,
            student:${USERS_TABLE}!student_id (
              id,
              first_name,
              last_name
            )
          )
        `,
        { count: 'exact' }
      )
      .lt('start_time', new Date().toISOString())
      .in('class_id', classIds)
      .order('start_time', { ascending: true });

    console.log("getAllSessionsData", pastSessions)

    if (pastSessionError) {
      throw new Error(`Error fetching sessions: ${pastSessionError.message}`);
    }

    if (!pastSessions) {
      return [];
    }

    // Transform the data to get the count directly
    const transformedData = pastSessions?.map((sessionData) => {
      let classTemp;
      let attendanceTemp;
      if (sessionData?.class) {
        if (Array.isArray(sessionData.class)) classTemp = sessionData.class[0];
        else classTemp = sessionData.class;
      }
      if (sessionData?.attendance?.length > 0) {
        attendanceTemp = sessionData.attendance.map((attendee) => {
          if (Array.isArray(attendee.student)) return { ...attendee, student: attendee.student[0]};
          else return { ...attendee, student: attendee.student};          
        })
      }
      return ({
        ...sessionData,
        class: classTemp,
        attendance: attendanceTemp ?? [],
      })
    })

    return transformedData;

  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}