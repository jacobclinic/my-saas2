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
      // Flatten all students across all sessions into a single array
      const emailTasks = data.flatMap((session) =>
        session.class?.students.map((student) => ({
          to: student.student.email,
          first_name: student.student.first_name,
          class_name: session.class?.name ?? 'Unnamed Class',
          start_time: new Date(session.start_time).toLocaleString(),
        })) || []
      );
  
      // Function to send a single email
      const sendSingleEmail = async (task: typeof emailTasks[number]) => {
        await sendEmail({
          from: process.env.EMAIL_SENDER!,
          to: task.to,
          subject: `Upcoming Class Notification`,
          html: `<p>Dear ${task.first_name},</p><p>This is a reminder for your upcoming class "${task.class_name}" scheduled on ${task.start_time}.</p><p>Best regards,<br>Your Team</p>`,
          text: `Dear ${task.first_name},\n\nThis is a reminder for your upcoming class "${task.class_name}" scheduled on ${task.start_time}.\n\nBest regards,\nYour Team`,
        });
      };
  
      // Process emails with a throttle (2 per second = 500ms per request)
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const rateLimitDelay = 500; // 500ms = 2 requests per second
  
      for (let i = 0; i < emailTasks.length; i++) {
        await sendSingleEmail(emailTasks[i]);
        // Add delay after every email, except the last one
        if (i < emailTasks.length - 1) {
          await delay(rateLimitDelay);
        }
      }
  
      console.log('All email notifications sent successfully');
    } catch (error) {
      console.error('Error sending email notifications:', error);
      throw error;
    }
  }

export async function notifyUpcomingSessionsBefore24Hrs() {
  const sessions = await getAllUpcomingSessionsWithin24Hrs(supabase);
  await sendUpcomingSessionEmails(sessions);
}
