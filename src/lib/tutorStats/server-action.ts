'use server';

import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { getTutorDashboardData } from './database/queries';
import { TutorDashboardData } from './types/types';

export const getTutorDashboardDataAction = withSession(
  async (
    tutorId: string,
  ): Promise<{ tutorStat: TutorDashboardData | null; error: any }> => {
    const client = getSupabaseServerActionClient();

    const tutorDBdata = await getTutorDashboardData(client, tutorId);

    if (!tutorDBdata) {
      return {
        tutorStat: null,
        error: 'No data found for the given tutor ID.',
      };
    } else {
      return { tutorStat: tutorDBdata, error: null };
    }
  },
);
