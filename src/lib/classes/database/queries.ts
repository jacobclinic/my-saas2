import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';
import { CLASSES_TABLE, STUDENT_CLASS_ENROLLMENTS_TABLE, USERS_TABLE } from '~/lib/db-tables';
import { ClassWithTutorAndEnrollment } from '../types/class';

interface ClassWithTutorAndEnrollmentRawData extends Omit<ClassWithTutorAndEnrollment, 'noOfStudents'> {
  noOfStudents: { count: number }[];
}

/**
 * @description Fetch class object data (not auth!) by ID {@link classId}
 */
export async function getClassDataById(
  client: SupabaseClient<Database>,
  classId: string,
): Promise<ClassWithTutorAndEnrollment | null>{
  const result = await client
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
      { count: 'exact' }
    )
    .eq('id', classId)
    .maybeSingle() as { data: ClassWithTutorAndEnrollmentRawData | null };

  console.log("getClassDataById - data - ", result?.data)

  if (!result.data) {
    return null;
  }

  // Transform the data to get the count directly
  const transformedData: ClassWithTutorAndEnrollment = {
    ...result.data,
    noOfStudents: result.data.noOfStudents[0]?.count || 0, // Use length of the noOfStudents array
  };

  console.log("getAllClassesData-2", transformedData)

  return transformedData;
}

export async function getAllClassesData(
  client: SupabaseClient<Database>,
): Promise<ClassWithTutorAndEnrollment[]> {
  try {
    const { data, error } = await client.from(CLASSES_TABLE).select(
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
      { count: 'exact' }
    )
    .returns<ClassWithTutorAndEnrollmentRawData[]>();

    console.log("getAllClassesData", data)

    if (error) {
      throw new Error(`Error fetching classes: ${error.message}`);
    }

    // Transform the data to get the count directly
    const transformedData = data?.map((classData) => ({
      ...classData,
      noOfStudents: classData.noOfStudents[0]?.count || 0, // Use length of the noOfStudents array
    }));

    console.log("getAllClassesData-2", transformedData)

    return transformedData;

  } catch (error) {
    console.error('Failed to fetch classes:', error);
    throw error;
  }
}