import { createClient } from '@supabase/supabase-js';
import {
  notifyAfterSessions,
  notifyUpcomingSessionsBefore24Hrs,
} from '~/lib/notifications/email/email.notification.service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export async function POST(req: Request) {
  try {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        persistSession: false,
      },
    });

    // Validate request
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Notify upcoming sessions before 24 hours
    await notifyUpcomingSessionsBefore24Hrs(supabase);
    // notifyUpcomingSessionsBefore24Hrs(supabase).catch((error) => {
    //   console.error('Background task error:', error);
    // });

    //notify after sessions
    await notifyAfterSessions(supabase);
    // notifyAfterSessions(supabase).catch((error) => {
    //   console.error('Background task error:', error);
    // });

    return new Response('Notification scheduled successfully', { status: 200 });
  } catch (error) {
    console.error('Error in POST /api/cron/notification:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
