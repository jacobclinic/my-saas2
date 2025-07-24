import { createClient } from '@supabase/supabase-js';
import {
  generateMonthlyInvoices
} from '~/lib/invoices/database/mutations';

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
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Months are zero-indexed
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;

    // Generate both student and tutor invoices
    await generateMonthlyInvoices(supabase, currentYear, nextMonth)
    

    return new Response('Invoices generated successfully', { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/public/generate-invoice:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
