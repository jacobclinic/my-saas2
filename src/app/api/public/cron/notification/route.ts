import { createClient } from '@supabase/supabase-js';
import {
  notifyAfterSessionsEmail,
  notifyUpcomingSessionsBefore24Hrs,
} from '~/lib/notifications/email/email.notification.service';
import {
  notifyAfterSessionSMS,
  notifyUpcomingSessionsBefore1HourSMS,
  notifyUpcomingSessionsSMS,
} from '~/lib/notifications/sms/sms.notification.service';

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
    console.log('Starting notification cron job...');

    // Notify upcoming sessions before 24 hours - run one at a time for better debugging
    console.log('Processing upcoming session notifications (email)...');
    await notifyUpcomingSessionsBefore24Hrs(supabase);

    console.log('Processing upcoming session notifications (SMS)...');
    await notifyUpcomingSessionsSMS(supabase);

    // Notify after completed sessions - run one at a time for better debugging
    console.log('Processing after-session notifications (email)...');
    await notifyAfterSessionsEmail(supabase);

    console.log('Processing after-session notifications (SMS)...');
    await notifyAfterSessionSMS(supabase);

    console.log('Processing upcoming session before 1 hour notifications (SMS)...');
    await notifyUpcomingSessionsBefore1HourSMS(supabase);
    
    console.log('All notification processes completed.');

    return new Response('Notification sent successfully', { status: 200 });
  } catch (error) {
    console.error('Error in POST /api/cron/notification:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
