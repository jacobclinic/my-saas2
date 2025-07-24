import { createClient } from '@supabase/supabase-js';
import {
  notifyAfterSessionsEmail,
  notifyUpcomingSessionsBefore1Hrs,
  notifyUpcomingSessionsBefore24Hrs,
  sendTutorClassReminder,
} from '~/lib/notifications/email/email.notification.service';
import {
  notifyAfterSessionSMS,
  notifyTutorsWithin1HourSMS,
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

    await Promise.all([
      notifyUpcomingSessionsBefore24Hrs (supabase),
      notifyUpcomingSessionsSMS(supabase)
    ])

    // Notify after completed sessions - run one at a time for better debugging
    await Promise.all([
      notifyAfterSessionsEmail(supabase),
      notifyAfterSessionSMS(supabase)
    ])

    // Notify upcoming sessions before 1 hour notifications
    console.log('Processing upcoming session before 1 hour notifications (SMS)...');
    await Promise.all([
      notifyUpcomingSessionsBefore1HourSMS(supabase),
      notifyUpcomingSessionsBefore1Hrs(supabase)
    ])

    //Notify upcoming session within 1 hour for tutors
    await Promise.all([
      notifyTutorsWithin1HourSMS(supabase),
      sendTutorClassReminder(supabase)
    ])

    console.log('All notification processes completed.');

    return new Response('Notification sent successfully', { status: 200 });
  } catch (error) {
    console.error('Error in POST /api/cron/notification:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
