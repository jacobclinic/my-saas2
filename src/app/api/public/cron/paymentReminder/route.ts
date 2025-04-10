import { createClient } from "@supabase/supabase-js";
import { remindPayments3DaysPrior } from "~/lib/notifications/email/email.notification.service";

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
    }

    // Get data from Supabase
    remindPayments3DaysPrior(supabase).catch((error) => {
      console.error("Background task error:", error);
      // Optionally log to an external service (e.g., Sentry) here
    });

    // Return response immediately
    return new Response("Payment reminders scheduled", { status: 200 });


    return new Response('Payment reminders sent successfully', { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/public/Test:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}