'use server';

import { revalidatePath } from 'next/cache';
import { createClass, deleteClass, updateClass } from '~/lib/classes/database/mutations-v2';
import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { ClassType, NewClassData } from './types/class-v2';
import { getNextNOccurrences } from '../utils/date-utils';

type CreateClassParams = {
  classData: NewClassData;
  csrfToken: string;
};

type UpdateClassParams = {
  classId: string;
  classData: Partial<Omit<ClassType, 'id'>>;
  csrfToken: string;
};

type DeleteClassParams = {
  classId: string;
  csrfToken: string;
};

export const createClassAction = withSession(
  async (params: CreateClassParams) => {
    const { classData, csrfToken } = params;
    const client = getSupabaseServerActionClient();

    const classResult = await createClass(client, classData);
    
    // Generate initial 4 sessions per time slot
    const initialSessions = classData.timeSlots.flatMap(timeSlot => {
      const nextOccurrences = getNextNOccurrences(timeSlot, classData.startDate, 4);
      
      return nextOccurrences.map(occurrence => {
        const endTime = new Date(occurrence);
        endTime.setHours(endTime.getHours() + 2);

        return {
          class_id: classResult.id,
          start_time: occurrence.toISOString(),
          end_time: endTime.toISOString()
        };
      });
    });

    // Insert all initial sessions
    const { error: sessionError } = await client
      .from('sessions')
      .insert(initialSessions);

    if (sessionError) throw sessionError;

    revalidatePath('/classes');
    revalidatePath('/(app)/classes');
    
    return {
      success: true,
      class: classResult,
    };
  }
);

export const updateClassAction = withSession(
  async (params: UpdateClassParams) => {
    const client = getSupabaseServerActionClient();

    const result = await updateClass(client, params.classId, params.classData);

    revalidatePath('/classes');
    revalidatePath(`/classes/${result?.id}`);
    revalidatePath('/(app)/classes');
    
    return {
      success: true,
      class: result,
    };
  }
);

export const deleteClassAction = withSession(
  async (params: DeleteClassParams) => {
    const client = getSupabaseServerActionClient();

    const result = await deleteClass(client, params.classId);

    revalidatePath('/classes');
    revalidatePath('/(app)/classes');
    
    return {
      success: true,
      classId: result,
    };
  }
);