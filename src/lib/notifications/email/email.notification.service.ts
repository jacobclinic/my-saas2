import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getAllUpcomingSessionsWithin24Hrs } from '../quieries';
import sendEmail from '~/core/email/send-email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!, {
  auth: {
    persistSession: false,
  },
});

async function sendUpcomingSessionEmails(data: NotificationClass[]) {
  try {
    // Flatten all students across all sessions into a single array of promises
    const emailPromises = data.flatMap(
      (session) =>
        session.class?.students.map((student) =>
          sendEmail({
            from: process.env.EMAIL_SENDER!,
            to: student.student.email,
            subject: `Upcoming Class Notification`,
            html: `<p>Dear ${student.student.first_name},</p><p>This is a reminder for your upcoming class "${session.class?.name}" scheduled on ${new Date(session.start_time).toLocaleString()}.</p><p>Best regards,<br>Your Team</p>`,
            text: `Dear ${student.student.first_name},\n\nThis is a reminder for your upcoming class "${session.class?.name}" scheduled on ${new Date(session.start_time).toLocaleString()}.\n\nBest regards,\nYour Team`,
          }),
        ) || [], // Fallback to empty array if session.class or students is undefined
    );

    // Wait for all emails to be sent
    await Promise.all(emailPromises);

    console.log('All email notifications sent successfully');
  } catch (error) {
    console.error('Error sending email notifications:', error);
    throw error; // Or handle it as needed
  }
}

export async function notifyUpcomingSessionsBefore24Hrs() {
  const sessions = await getAllUpcomingSessionsWithin24Hrs(supabase);
  await sendUpcomingSessionEmails(sessions);
}
