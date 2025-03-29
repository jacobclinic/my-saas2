import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { Database } from '~/database.types';
import {
  CLASSES_TABLE,
  SESSIONS_TABLE,
  STUDENT_CLASS_ENROLLMENTS_TABLE,
  USERS_TABLE,
} from '~/lib/db-tables';
import { ClassWithTutorAndEnrollment } from '../types/class';
import { ClassForStudentType, ClassType } from '../types/class-v2';
import { unknown } from 'zod';

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

    const transformedData = await Promise.all(
      data.map(async (classData) => {
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
          ...classData,
          upcomingSession: sessionsData?.[0]?.start_time || null,
          time_slots: timeSlots
        };
      })
    );

    console.log(transformedData);

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
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

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

    const transformedData = data?.map((classData) => {
      const upcomingSession = sessionsData?.find(
        (session) => session.class_id === classData.id,
      );
      const timeSlots = classData?.time_slots as
        | { day: string; startTime: string; endTime: string }[]
        | null;
      return {
        ...classData,
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
            tutor:${USERS_TABLE}!tutor_id (
              id,
              first_name,
              last_name
            ),
            fee,
            status,            
            grade
          )
        `,
      )
      .eq('student_id', student_id)
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    // console.log('getAllClassesByStudentIdData', data);

    if (!data) {
      return [];
    }

    const transformedData = data?.map((classData) => {
      let classTemp;
      let tutorTemp;
      if (classData?.class) {
        if (Array.isArray(classData.class)) classTemp = classData.class[0];
        else classTemp = classData.class;
      }
      if (classTemp?.tutor) {
        if (Array.isArray(classTemp.tutor)) tutorTemp = classTemp.tutor[0];
        else tutorTemp = classTemp.tutor;
      }
      return {
        ...classData,
        class: {
          ...classTemp,
          tutor: tutorTemp,
        },
      };
    });

    if (error) {
      throw new Error(
        `Error fetching classes: ${(error as PostgrestError).message}`,
      );
    }

    return transformedData;
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    throw error;
  }
}
