'use server';

import { withSession } from '~/core/generic/actions-utils';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { getStudentInvoices } from './database/queries';

export const getStudentInvoicesAction = withSession(
  async ({ studentId, month }: { studentId: string; month?: string }) => {
    const client = getSupabaseServerActionClient();

    try {
      const invoices = await getStudentInvoices(client, studentId, month);
      return { success: true, invoices };
    } catch (error: any) {
      console.error('Error fetching student invoices:', error);
      return { success: false, error: error.message };
    }
  },
);
