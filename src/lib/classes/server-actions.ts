'use server';

import { revalidatePath } from 'next/cache';
import { createClass, deleteClass, updateClass } from '~/lib/classes/database/mutations';
import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import ClassType from './types/class';

type CreateClassParams = {
  classData: Omit<ClassType, 'id'>;
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
    const client = getSupabaseServerActionClient();

    const result = await createClass(client, params.classData);

    revalidatePath('/classes');
    revalidatePath('/(app)/classes');
    
    return {
      success: true,
      class: result,
    };
  },
);

export const updateClassAction = withSession(
  async (params: UpdateClassParams) => {
    const client = getSupabaseServerActionClient();

    const result = await updateClass(client, params.classId, params.classData);

    revalidatePath('/classes');
    revalidatePath(`/classes/${result?.id}`);
    revalidatePath('/(app)/classes');
    revalidatePath(`/(app)/classes/${result?.id}`);
    
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