import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '~/database.types';
import {
  CLASSES_TABLE,
  SESSIONS_TABLE,
  STUDENT_CLASS_ENROLLMENTS_TABLE,
  INVOICES_TABLE,
} from '~/lib/db-tables';
import { TutorDashboardData, ClassWithEnrollmentRawData } from '../types/types';
import { isAdminOrTutor } from '~/lib/auth/permissions';

export async function getTutorDashboardData(
  client: SupabaseClient<Database>,
  tutorId: string,
): Promise<TutorDashboardData | null> {
  // Security check: Verify the tutorId corresponds to a user with 'tutor' role
  const isAutherized = await isAdminOrTutor(client, tutorId);
  if (!isAutherized) {
    console.error('Unauthorized access attempt to tutor dashboard');
    return null;
  }

  // Get current month in format YYYY-MM (e.g., '2025-06')
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  // Fetch active classes and count of enrolled students
  const classResult = (await client
    .from(CLASSES_TABLE)
    .select(
      `
        id,
        name,
        subject,
        ${STUDENT_CLASS_ENROLLMENTS_TABLE}!class_id(count)
      `,
      { count: 'exact' },
    )
    .eq('tutor_id', tutorId)
    .eq('status', 'active')) as {
    data: ClassWithEnrollmentRawData[] | null;
    error: unknown;
  };

  if (classResult.error) {
    console.error('Error fetching classes:', classResult.error);
    return null;
  }

  if (!classResult.data || classResult.data.length === 0) {
    console.error('No active classes found for tutor ID:', tutorId);
    return {
      tutor_id: tutorId,
      activeClasses: [],
      totalStudents: 0,
      nextSession: null,
      monthlyEarnings: 0,
    };
  }
  // Calculate total students
  const totalStudents = classResult.data.reduce(
    (sum, classItem) =>
      sum + (classItem.student_class_enrollments[0]?.count || 0),
    0,
  );

  // Fetch next session for any of the tutor's classes
  const classIds = classResult.data.map((c) => c.id);
  const nextSessionResult = await client
    .from(SESSIONS_TABLE)
    .select('id, class_id, start_time')
    .in('class_id', classIds)
    .gt('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(1);

  if (nextSessionResult.error) {
    console.error('Error fetching next session:', nextSessionResult.error);
    return null;
  }

  // Fetch monthly earnings from paid invoices for the current month
  const invoicesResult = await client
    .from(INVOICES_TABLE)
    .select('amount')
    .in('class_id', classIds)
    .eq('status', 'paid')
    .eq('invoice_period', currentMonth);

  if (invoicesResult.error) {
    console.error('Error fetching invoices:', invoicesResult.error);
    return null;
  }

  const monthlyEarnings = invoicesResult.data.reduce(
    (sum, invoice) => sum + (invoice.amount || 0),
    0,
  );

  // Transform the data
  const transformedData: TutorDashboardData = {
    tutor_id: tutorId,
    activeClasses: classResult.data.map((c) => ({
      id: c.id,
      name: c.name,
      subject: c.subject,
    })),
    totalStudents,
    nextSession: nextSessionResult.data?.[0]
      ? {
          id: nextSessionResult.data[0].id,
          class_id: nextSessionResult.data[0].class_id,
          start_time: nextSessionResult.data[0].start_time,
        }
      : null,
    monthlyEarnings,
  };

  return transformedData;
}
