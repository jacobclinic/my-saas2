'use server';

import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { getStudentInvoices } from './database/queries';

export const getStudentInvoicesAction = withSession(
  async ({
    studentId,
    csrfToken,
  }: {
    studentId: string;
    csrfToken: string;
  }) => {
    const client = getSupabaseServerActionClient();

    try {
      const invoices = await getStudentInvoices(client, studentId);
      return { success: true, invoices };
    } catch (error: any) {
      console.error('Error fetching student invoices:', error);
      return { success: false, error: error.message };
    }
  },
);
