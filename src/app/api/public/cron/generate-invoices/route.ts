import { createClient } from '@supabase/supabase-js';
import {
  generateMonthlyInvoicesStudents,
  generateMonthlyInvoicesTutor,
} from '~/lib/invoices/database/mutations';
import { getLastMonthPeriod, getNextMonthPeriod } from '~/lib/utils/invoice-utils';

/**
 * @deprecated Use InvoiceService.generateMonthlyTutorInvoices instead
 * Generates monthly invoices for tutors based on paid student invoices
 * */
export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl!, supabaseKey!, {
    auth: {
      persistSession: false,
    },
  });

  try {
    // Validate request
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    } //get current year and next month

    // Needs to handle the case when the current month is December
    const currentDate = new Date();
    const { year: studentYear, month: studentMonth } = getNextMonthPeriod(currentDate);
    const { year: tutorYear, month: tutorMonth } = getLastMonthPeriod(currentDate);

    // Generate both student and tutor invoices
    await Promise.all([
      generateMonthlyInvoicesStudents(supabase, studentYear, studentMonth),
      generateMonthlyInvoicesTutor(supabase, tutorYear, tutorMonth),
    ]);

    return new Response('Invoices generated successfully', { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/public/generate-invoice:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
