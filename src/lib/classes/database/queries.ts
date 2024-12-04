import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '~/database.types';
import { CLASSES_TABLE } from '~/lib/db-tables';
import { ClassTypeWithTutor } from '../types/class';

/**
 * @description Fetch class object data (not auth!) by ID {@link classId}
 */
export async function getClassDataById(
  client: SupabaseClient<Database>,
  classId: string,
) {
  const result = await client
    .from(CLASSES_TABLE)
    .select(
      `
        id,
        name,
        description,
        subject,
        tutor (
          id,
          name
        ),
        students,
        sessions,
        fee,
        payments,
        status
      `,
    )
    .eq('id', classId)
    .maybeSingle();

  return result.data;
}

export async function getAllClassesData(
  client: SupabaseClient<Database>,
): Promise<ClassTypeWithTutor[]> {
  try {
    const { data, error } = await client.from(CLASSES_TABLE).select(
      `
        id,
        name,
        description,
        subject,
        tutor (
          id,
          name
        ),
        students,
        sessions,
        fee,
        payments,
        status
      `,
    )
    .returns<ClassTypeWithTutor[]>();

    if (error) {
      throw new Error(`Error fetching classes: ${error.message}`);
    }

    return data;

  } catch (error) {
    console.error('Failed to fetch classes:', error);
    throw error;
  }
}