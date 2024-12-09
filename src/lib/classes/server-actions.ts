'use server';

import { revalidatePath } from 'next/cache';
import { createClass } from '~/lib/classes/database/mutations';
import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import ClassType from './types/class';

type CreateClassParams = {
  classData: Omit<ClassType, 'id'>;
  csrfToken: string;
};

export const createClassAction = withSession(
  async (params: CreateClassParams) => {
    const client = getSupabaseServerActionClient();

    const result = await createClass(client, params.classData);


    console.log('Class created successfully', result)

    revalidatePath('/classes', "layout");
    revalidatePath('/(app)/classes', "layout");
    console.log('Class created successfully   2')
  },
);
