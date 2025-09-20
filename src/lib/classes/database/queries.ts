import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import type { Database } from '~/database.types';
import {
  CLASSES_TABLE,
  SESSIONS_TABLE,
  STUDENT_CLASS_ENROLLMENTS_TABLE,
  USERS_TABLE,
} from '~/lib/db-tables';
import {
  ClassWithTutorAndEnrollment,
  ClassWithTutorAndEnrollmentAndNextSession,
  ClassWithTutorData,
} from '../types/class';
import {
  ClassForStudentType,
  ClassType,
  ClassWithTutorAndEnrollmentAdmin,
  ClassWithTutorAndEnrollmentAdminRawData,
  DbClassType,
  ActiveClassForTutorInvoice,
} from '../types/class-v2';
import { DatabaseError } from '~/lib/shared/errors';
import { failure, Result, success } from '~/lib/shared/result';
import getLogger from '~/core/logger';


const logger = getLogger();

interface ClassWithTutorAndEnrollmentRawData
  extends Omit<ClassWithTutorAndEnrollment, 'noOfStudents'> {
  noOfStudents: { count: number }[];
}

/**
 * @description Fetch class object data (not auth!) by ID {@link classId}
 */
export async function getClassDataById(
  client: SupabaseClient<Database>,
  classId: string,
): Promise<ClassWithTutorAndEnrollment | null> {
  const result = (await client
    .from(CLASSES_TABLE)
    .select(
      `
        id,
        name,
        description,
        subject,
        tutor_id,
        tutor:${USERS_TABLE}!tutor_id (
          id,
          first_name,
          last_name
        ),
        fee,
        status,
        time_slots,
        noOfStudents:${STUDENT_CLASS_ENROLLMENTS_TABLE}!id(count)
      `,
      { count: 'exact' },
    )
    .eq('id', classId)
    .maybeSingle()) as { data: ClassWithTutorAndEnrollmentRawData | null };

  // console.log('getClassDataById - data - ', result?.data);

  if (!result.data) {
    return null;
  }

  // Transform the data to get the count directly
  const transformedData: ClassWithTutorAndEnrollment = {
    ...result.data,
    noOfStudents: result.data.noOfStudents[0]?.count || 0, // Use length of the noOfStudents array
  };

  // console.log('getAllClassesData-2', transformedData);

  return transformedData;
}

export async function getClassDataByIdwithNextSession(
  client: SupabaseClient<Database>,
  classId: string,
): Promise<ClassWithTutorAndEnrollmentAndNextSession | null> {
  const result = (await client
    .from(CLASSES_TABLE)
    .select(
      `
        id,
        name,
        description,
        subject,
        tutor_id,
        tutor:${USERS_TABLE}!tutor_id (
          id,
          first_name,
          last_name
        ),
        fee,
        status,
        time_slots,
        noOfStudents:${STUDENT_CLASS_ENROLLMENTS_TABLE}!id(count)
      `,
      { count: 'exact' },
    )
    .eq('id', classId)
    .maybeSingle()) as {
      data: ClassWithTutorAndEnrollmentRawData | null;
      error: unknown;
    };

  if (result.error) {
    console.error('Error fetching class data:', result.error);
    return null;
  }

  if (!result.data) {
    console.error('No class data found for ID:', classId);
    return null;
  }

  const nextSession = await client
    .from(SESSIONS_TABLE)
    .select(`id, start_time`)
    .eq('class_id', classId)
    .gt('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(1);

  if (nextSession.error) {
    console.error('Error fetching next session:', nextSession.error);
    return null;
  }

  // Transform the data to get the count directly
  const transformedData: ClassWithTutorAndEnrollmentAndNextSession = {
    ...result.data,
    nextSession: nextSession.data?.[0]?.start_time,
    noOfStudents: result.data?.noOfStudents[0]?.count || 0,
  };

  return transformedData;
}

// export async function getClassDataByIdWithTutorData(
//   client: SupabaseClient<Database>,
//   classId: string,
// ): Promise<ClassWithTutorDetails | null> {
//   const result = (await client
//     .from(CLASSES_TABLE)
//     .select(
//       `
//         id,
//         name,
//         description,
//         subject,
//         tutor_id,
//         tutor:${USERS_TABLE}!tutor_id (
//           id,
//           first_name,
//           last_name
//         ),
//         fee,
//         status,
//         time_slots,
//         noOfStudents:${STUDENT_CLASS_ENROLLMENTS_TABLE}!id(count)
//       `,
//       { count: 'exact' },
//     )
//     .eq('id', classId)
//     .maybeSingle()) as {
//     data: ClassWithTutorAndEnrollmentRawData | null;
//     error: unknown;
//   };

//   if (result.error) {
//     console.error('Error fetching class data:', result.error);
//     return null;
//   }

//   if (!result.data) {
//     console.error('No class data found for ID:', classId);
//     return null;
//   }

// }

export async function getAllClassesData(
  client: SupabaseClient<Database>,
): Promise<ClassWithTutorAndEnrollment[]> {
  try {
    const { data, error } = await client
      .from(CLASSES_TABLE)
      .select(
        `
        id,
        name,
        description,
        subject,
        tutorId,
        tutor:${USERS_TABLE}!tutorId (
          id,
          firstName,
          lastName
        ),
        fee,
        status,
        timeSlots,
        noOfStudents:${STUDENT_CLASS_ENROLLMENTS_TABLE}!id(count)
      `,
        { count: 'exact' },
      )
      .returns<ClassWithTutorAndEnrollmentRawData[]>();

    // console.log("getAllClassesData", data)

    if (error) {
      throw new Error(
        `Error fetching classes: ${(error as PostgrestError).message}`,
      );
    }

    // Transform the data to get the count directly
    const transformedData = data?.map((classData) => ({
      ...classData,
      noOfStudents: classData.noOfStudents[0]?.count || 0, // Use length of the noOfStudents array
    }));

    // console.log('getAllClassesData-2', transformedData);

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    throw error;
  }
}

// version 2

export async function getAllClassesDataAdmin(
  client: SupabaseClient<Database>,
): Promise<ClassWithTutorAndEnrollmentAdmin[]> {
  try {
    const { data, error } = await client
      .from(CLASSES_TABLE)
      .select(
        `
        id,
        name,
        description,
        subject,
        tutor_id,
        tutor:${USERS_TABLE}!tutor_id (
          id,
          first_name,
          last_name
        ),
        fee,
        status,
        time_slots,
        grade,
        starting_date,
        noOfStudents:${STUDENT_CLASS_ENROLLMENTS_TABLE}!id(count),
        students:${STUDENT_CLASS_ENROLLMENTS_TABLE}!id (
          id,
          student_id,
          student:${USERS_TABLE}!student_id (
            id,
            first_name,
            last_name,
            email,
            phone_number,
            status
          )
        )
      `,
        { count: 'exact' },
      )
      .returns<ClassWithTutorAndEnrollmentAdminRawData[]>();

    if (error) {
      throw new Error(
        `Error fetching classes: ${(error as PostgrestError).message}`,
      );
    }

    const transformedData = await Promise.all(
      data?.map(async (classData) => {
        // Fetch upcoming session
        const { data: sessionsData } = await client
          .from(SESSIONS_TABLE)
          .select(`id, start_time`)
          .eq('class_id', classData.id)
          .gt('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(1);

        const timeSlots = classData?.time_slots as
          | { day: string; startTime: string; endTime: string }[]
          | null;

        return {
          id: classData.id,
          name: classData.name,
          description: classData.description,
          subject: classData.subject,
          tutorId: classData.tutor_id,
          fee: classData.fee,
          status: classData.status,
          time_slots: timeSlots,
          grade: classData.grade,
          tutor: classData.tutor,
          noOfStudents: classData.noOfStudents[0]?.count || 0,
          upcomingSession: sessionsData?.[0]?.start_time || null,
          students: classData.students,
          starting_date: classData.starting_date,
        };
      }) || [],
    );

    // console.log('getAllClassesData-2', transformedData);

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    throw error;
  }
}

export async function getAllClassesByTutorIdData(
  client: SupabaseClient<Database>,
  tutor_id: string,
  isDashboard?: boolean,
): Promise<ClassType[] | []> {
  try {
    // Create base query
    let query = client
      .from(CLASSES_TABLE)
      .select(
        `
          id,
          created_at,
          name,
          description,
          subject,
          tutor_id,
          fee,
          status,
          time_slots,
          starting_date,
          grade,
          short_url_code,
          tutor:${USERS_TABLE}!tutor_id (
            first_name,
            last_name
          ),
          students:${STUDENT_CLASS_ENROLLMENTS_TABLE}!id (
            id,
            student_id,
            student:${USERS_TABLE}!student_id (
              id,
              first_name,
              last_name,
              email,
              phone_number,
              status,
              address
            )
          )
        `,
      )
      .eq('tutor_id', tutor_id)
      .order('created_at', { ascending: false });

    // If isDashboard is true, filter active classes
    if (isDashboard) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;

    // console.log("getAllSessionsData", data)

    if (error) {
      throw new Error(
        `Error fetching sessions: ${(error as PostgrestError).message}`,
      );
    }

    if (!data) {
      return [];
    }
    const transformedData = await Promise.all(
      data.map(async (classData: any) => {
        const { data: sessionsData } = await client
          .from(SESSIONS_TABLE)
          .select(`id, start_time`)
          .eq('class_id', classData.id)
          .gt('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(1);

        const timeSlots = classData?.time_slots as
          | { day: string; startTime: string; endTime: string }[]
          | null;

        // Extract the first tutor object if it's an array
        const tutorData = Array.isArray(classData.tutor)
          ? classData.tutor[0]
          : classData.tutor;

        return {
          ...classData,
          tutor: tutorData,
          upcomingSession: sessionsData?.[0]?.start_time || null,
          time_slots: timeSlots,
        };
      }),
    );
    // console.log('getAllClassesByTutorIdData - transformedData:', transformedData[0].students[0].student);
    return transformedData;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getAllClassesByTutorIdDataPerWeek(
  client: SupabaseClient<Database>,
  tutor_id: string,
  isDashboard?: boolean,
): Promise<ClassType[] | []> {
  try {
    // Calculate date 7 days from now
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7); // Create base query
    let query = client
      .from(CLASSES_TABLE)
      .select(
        `
          id,
          created_at,
          name,
          description,
          subject,
          tutor_id,
          fee,
          status,
          time_slots,
          starting_date,
          grade,
          tutor:${USERS_TABLE}!tutor_id (
            first_name,
            last_name
          ),
          students:${STUDENT_CLASS_ENROLLMENTS_TABLE}!id (
            id,
            student_id,
            student:${USERS_TABLE}!student_id (
              id,
              first_name,
              last_name,
              email,
              phone_number,
              status
            )
          )
        `,
      )
      .eq('tutor_id', tutor_id)
      .order('created_at', { ascending: false });

    // If isDashboard is true, filter active classes
    if (isDashboard) {
      query = query.eq('status', 'active');
    }

    const { data, error } = await query;

    // console.log("getAllSessionsData", data)

    if (error) {
      throw new Error(
        `Error fetching sessions: ${(error as PostgrestError).message}`,
      );
    }

    if (!data) {
      return [];
    }

    const classIds = data?.map((classData) => classData.id);
    const { data: sessionsData, error: sessionsError } = await client
      .from(SESSIONS_TABLE)
      .select(
        `
          id,
          class_id,
          start_time
        `,
      )
      .in('class_id', classIds)
      .gt('start_time', new Date().toISOString())
      .lte('start_time', sevenDaysFromNow.toISOString()) // Less than or equal to 7 days from now
      .order('start_time', { ascending: true })
      .limit(1);
    const transformedData = data?.map((classData: any) => {
      const upcomingSession = sessionsData?.find(
        (session) => session.class_id === classData.id,
      );
      const timeSlots = classData?.time_slots as
        | { day: string; startTime: string; endTime: string }[]
        | null;

      // Extract the first tutor object if it's an array
      const tutorData = Array.isArray(classData.tutor)
        ? classData.tutor[0]
        : classData.tutor;

      return {
        ...classData,
        tutor: tutorData,
        upcomingSession: upcomingSession ? upcomingSession.start_time : null,
        time_slots: timeSlots,
      };
    });

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
}

export async function getAllClassesByStudentIdData(
  client: SupabaseClient<Database>,
  student_id: string,
): Promise<ClassForStudentType[] | []> {
  try {
    // Create base query
    let query = client
      .from(STUDENT_CLASS_ENROLLMENTS_TABLE)
      .select(
        `
          id,
          class_id,
          student_id,
          class:${CLASSES_TABLE}!class_id (
            id,
            name,
            description,
            subject,
            tutor_id,
            fee,
            status,
            time_slots,
            starting_date,
            grade,
            tutor:${USERS_TABLE}!tutor_id (
              id,
              first_name,
              last_name
            )
          )
        `,
      )
      .eq('student_id', student_id)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    // console.log('getAllClassesByStudentIdData raw data:', data);

    if (error) {
      throw new Error(
        `Error fetching classes: ${(error as PostgrestError).message}`,
      );
    }

    if (!data || data.length === 0) {
      return [];
    }

    const transformedData = await Promise.all(
      data.map(async (enrollmentData: any) => {
        const classData = enrollmentData.class || {};
        const tutorData = Array.isArray(classData.tutor)
          ? classData.tutor[0] || null
          : classData.tutor || null;

        const { data: sessionsData } = await client
          .from(SESSIONS_TABLE)
          .select(`id, start_time`)
          .eq('class_id', classData.id)
          .gt('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(1);

        const timeSlots = classData.time_slots as
          | { day: string; startTime: string; endTime: string }[]
          | null;

        return {
          id: enrollmentData.id || null,
          class_id: enrollmentData.class_id || null,
          student_id: enrollmentData.student_id || null,
          class: {
            id: classData.id || null,
            name: classData.name || null,
            description: classData.description || null,
            subject: classData.subject || null,
            tutor_id: classData.tutor_id || null,
            tutor: tutorData
              ? {
                id: tutorData.id || null,
                first_name: tutorData.first_name || null,
                last_name: tutorData.last_name || null,
              }
              : null,
            time_slots: timeSlots,
            fee: classData.fee || null,
            status: classData.status || null,
            grade: classData.grade || null,
            upcomingSession: sessionsData?.[0]?.start_time || null,
          },
        } as ClassForStudentType;
      }),
    );

    // console.log('Transformed data:', transformedData);

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    throw error;
  }
}


export async function getClassDataByClassId(
  client: SupabaseClient<Database>,
  classId: string,
): Promise<ClassType | null> {
  try {
    const { data, error } = await client.from(CLASSES_TABLE).select(`
        id,
        created_at,
        name,
        description,
        subject,
        tutor_id,
        fee,
        status,
        time_slots,
        starting_date,
        grade,
        end_date`).eq('id', classId).maybeSingle();

    if (error) {
      console.error('Error fetching class data:', error);
      throw new Error(
        `Error fetching class data: ${(error as PostgrestError).message}`,
      );
    }

    return data as ClassType | null;

  } catch (error) {
    console.error('Failed to fetch class data:', error);
    throw error;
  }

}

export async function getClassByIdWithTutor(client: SupabaseClient<Database>, classId: string): Promise<ClassWithTutorData | null> {
  try {
    const { data: classData, error } = await client
      .from(CLASSES_TABLE)
      .select(`
        id,
        name,
        description,
        subject,
        tutor_id,
        fee,
        status,
        time_slots,
        grade,
        starting_date,
        created_at,
        tutor:${USERS_TABLE}!classes_tutor_id_fkey(
          id,
          first_name,
          last_name,
          email,
          phone_number,
          photo_url,
          biography,
          display_name,
          address,
          city,
          district,
          education_level,
          subjects_teach,
          user_role
        )
      `)
      .eq('id', classId)
      .maybeSingle();

    if (error) {
      console.error("Error getting class by ID with tutor:", error);
      throw new Error("Failed to get class by ID with tutor. Please try again.");
    }

    if (!classData) {
      console.log(`No class found with ID: ${classId}`);
      return null;
    }

    return classData as ClassWithTutorData;
  } catch (error) {
    console.error("Error getting class by ID with tutor:", error);
    throw new Error("Failed to get class by ID with tutor. Please try again.");
  }
}

export async function getClassById(client: SupabaseClient<Database>, classId: string): Promise<Result<DbClassType, DatabaseError>> {
  try {
    const { data: classData, error } = await client
      .from(CLASSES_TABLE)
      .select()
      .eq('id', classId)
      .throwOnError()
      .single();

    if (error) {
      logger.error("Failed to fetch class from database", error);
      return failure(new DatabaseError("Failed to fetch class from database"));
    }

    if (!classData) {
      logger.warn("Class not found", { classId });
      return failure(new DatabaseError("Class not found"));
    }

    return success(classData);

  } catch (error) {
    logger.error("Something went wrong while fetching the class", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      classId
    });
    return failure(new DatabaseError("Something went wrong while fetching the class"));
  }
}

export async function getClassFeeById(
  client: SupabaseClient,
  classId: string
): Promise<Result<number | null, DatabaseError>> {
  try {
    const { data: classData, error: classError } = await client
      .from(CLASSES_TABLE)
      .select('fee')
      .eq('id', classId)
      .single();

    if (classError) {
      return failure(new DatabaseError('Failed to fetch class fee.'));
    }

    return success(classData?.fee ?? null);
  } catch (error) {
    return failure(new DatabaseError('An unexpected error occurred while fetching class fee.'));
  }
}

export async function getAllClassesForTutorInvoices(
  client: SupabaseClient,
): Promise<Result<ActiveClassForTutorInvoice[], DatabaseError>> {
  try {
    const { data: tutorClasses, error } = await client
      .from(CLASSES_TABLE)
      .select(`
      id,
      fee,
      tutor_id,
      name
      `)
      .in('status', ['active', 'canceled']);

    if (error) {
      logger.error('Error fetching active classes for tutor invoices.', { error });
      return failure(new DatabaseError('Error fetching active classes for tutor invoices.'));
    }

    return success(tutorClasses || []);
  } catch (error) {
    logger.error('An unexpected error occurred while fetching active classes.', { error });
    return failure(new DatabaseError('An unexpected error occurred while fetching active classes.'));
  }
}

export async function checkStudentEnrollment(
  client: SupabaseClient<Database>,
  studentId: string,
  classId: string
): Promise<Result<boolean, DatabaseError>> {
  try {
    const { data: enrollment, error } = await client
      .from(STUDENT_CLASS_ENROLLMENTS_TABLE)
      .select('id')
      .eq('student_id', studentId)
      .eq('class_id', classId)
      .throwOnError()
      .single();

    if (error) {
      // If no enrollment found, return false (not an error)
      if (error.code === 'PGRST116') {
        return success(false);
      }
      logger.error('Error checking student enrollment', { 
        error: error.message,
        studentId,
        classId 
      });
      return failure(new DatabaseError('Failed to check student enrollment'));
    }

    return success(!!enrollment);
  } catch (error) {
    logger.error('Something went wrong while checking student enrollment', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      studentId,
      classId
    });
    return failure(new DatabaseError('Something went wrong while checking student enrollment'));
  }
}

export async function getClassFreeAccessSetting(
  client: SupabaseClient<Database>,
  classId: string
): Promise<Result<boolean, DatabaseError>> {
  try {
    const { data: classData, error } = await client
      .from(CLASSES_TABLE)
      .select('allow_free_access_first_week')
      .eq('id', classId)
      .throwOnError()
      .single();

    if (error) {
      logger.error("Failed to fetch class free access setting", { error, classId });
      return failure(new DatabaseError("Failed to fetch class free access setting"));
    }

    if (!classData) {
      logger.warn("Class not found when fetching free access setting", { classId });
      return failure(new DatabaseError("Class not found"));
    }

    logger.info("Successfully fetched class free access setting", { 
      classId, 
      allowFreeAccess: classData.allow_free_access_first_week 
    });
    return success(classData.allow_free_access_first_week || false);

  } catch (error) {
    logger.error("Something went wrong while fetching class free access setting", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      classId
    });
    return failure(new DatabaseError("Something went wrong while fetching class free access setting"));
  }
}