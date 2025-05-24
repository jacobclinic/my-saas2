import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  getAllUpcomingSessionsWithin24_25Hrs,
  getSessions2_1HrsAfterSession,
  getUpcomingSessionsWithUnpaidStudentsBetween3_4Days,
} from '../quieries';
import sendEmail from '~/core/email/send-email';
import { getStudentNotifyBeforeEmailTemplate } from '~/core/email/templates/studentNotifyBefore';
import { getStudentNotifyAfterEmailTemplate } from '~/core/email/templates/studentNotifyAfter';
import { paymentReminderEmaiTemplate } from '~/core/email/templates/paymentReminder';
import { format, parseISO } from 'date-fns';
import getLogger from '~/core/logger';

const logger = getLogger();

// Process emails with a throttle (2 per second = 500ms per request)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const rateLimitDelay = 500; // 500ms = 2 requests per second

async function sendNotifySessionEmails(
  data: NotificationClass[],
  beforeOrAfter: 'before' | 'after',
) {
  try {
    // Flatten all students across all sessions into a single array
    const emailTasks = data.flatMap((session) => {
      logger.info('session', session);
      console.log('session', session);
      return (
        session.class?.students.map((student) => ({
          to: student.student.email,
          class_id: session.class.id,
          topic: session.title,
          first_name: student.student.first_name,
          class_name: session.class?.name ?? 'Unnamed Class',
          start_time: new Date(session.start_time).toLocaleString(),
        })) || []
      );
    });

    // Function to send a single email
    const sendSingleEmail = async (task: (typeof emailTasks)[number]) => {
      // Parse the session start time for proper date formatting
      const sessionDate = new Date(task.start_time);

      // Format the date in India timezone (IST)
      const localDate = new Intl.DateTimeFormat('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Kolkata',
      }).format(sessionDate);

      // Format the time in India timezone (IST)
      const localTime = new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      }).format(sessionDate);

      if (beforeOrAfter === 'before') {
        const { html, text } = getStudentNotifyBeforeEmailTemplate({
          studentName: task.first_name!,
          className: task.class_name,
          sessionDate: localDate,
          sessionTime: localTime,
          topic: task.topic,
          classId: task.class_id,
          studentEmail: task.to,
        });
        await sendEmail({
          from: process.env.EMAIL_SENDER!,
          to: task.to,
          subject: `Upcoming Class Notification`,
          html: html,
          text: text,
        });
      }
      if (beforeOrAfter === 'after') {
        const { html, text } = getStudentNotifyAfterEmailTemplate({
          studentName: task.first_name!,
          className: task.class_name,
          sessionDate: new Date(task.start_time).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          topic: task.topic,
          classId: task.class_id,
          studentEmail: task.to,
        });
        await sendEmail({
          from: process.env.EMAIL_SENDER!,
          to: task.to,
          subject: `Your ${task.class_name} Class Recording Is Now Available`,
          html: html,
          text: text,
        });
      }
    };

    // Process emails with a throttle (2 per second = 500ms per request)

    const rateLimitDelay = 500; // 500ms = 2 requests per second

    for (let i = 0; i < emailTasks.length; i++) {
      try {
        await sendSingleEmail(emailTasks[i]);
        logger.info('Sending notification email to', {
          email: emailTasks[i].to,
        });
      } catch (error) {
        logger.error('Failed to send email to', {
          email: emailTasks[i].to,
          error,
        });
      }
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

export async function notifyUpcomingSessionsBefore24Hrs(
  client: SupabaseClient,
) {
  const sessions = await getAllUpcomingSessionsWithin24_25Hrs(client);
  console.log(
    `Found ${sessions.length} upcoming sessions for email notifications in the 24-25 hour window`,
  );

  // Log details of each session for debugging
  sessions.forEach((session, index) => {
    // Use standard date formatting for logging
    const sessionTime = new Date(session.start_time);
    console.log(
      `Upcoming Session ${index + 1}: ID: ${session.id}, Class: ${session.class.name}, Start Time (UTC): ${sessionTime.toISOString()}`,
    );
  });

  await sendNotifySessionEmails(sessions, 'before');
}

export async function notifyAfterSessionsEmail(client: SupabaseClient) {
  const sessions = await getSessions2_1HrsAfterSession(client);
  console.log(
    `Found ${sessions.length} sessions for after-session email notifications`,
  );

  // Log details of each session for debugging
  sessions.forEach((session, index) => {
    console.log(
      `Session ${index + 1}: ID: ${session.id}, Class: ${session.class.name}, End Time: ${session.end_time}`,
    );
  });

  await sendNotifySessionEmails(sessions, 'after');
}

async function sendPaymentReminderEmails(data: SessionWithUnpaidStudents[]) {
  try {
    // Flatten all students across all sessions into a single array
    const emailTasks = data.flatMap((session) => {
      logger.info('session', session);
      // Split session.start_time into DATE and TIME
      const dt: Date = parseISO(session.start_time!);
      const DATE: string = format(dt, 'yyyy-MM-dd');
      const TIME: string = format(dt, 'HH:mm:ss');

      return (
        session.class?.unpaid_students.map((student) => ({
          to: student.student.email,
          first_name: student.student.first_name,
          class_name: session.class?.name ?? 'Unnamed Class',
          start_time: new Date(session.start_time!).toLocaleString(),
          fee: session.class.fee,
          paymentUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/sessions/student/${session.session_id}?type=upcoming&redirectUrl=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL}/sessions/student/${session.session_id}?type=upcoming&sessionId=${session.session_id}&className=${session.class.name}&sessionDate=${DATE}&sessionTime=${TIME}&sessionSubject=${session.class.subject}&sessionTitle=${session.title}`)}`,
        })) || []
      );
    });

    // Function to send a single email
    const sendSingleEmail = async (task: (typeof emailTasks)[number]) => {
      const { html, text } = paymentReminderEmaiTemplate({
        studentName: task.first_name!,
        className: task.class_name,
        sessionDate: new Date(task.start_time).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        sessionMonth: new Date(task.start_time).toLocaleString('en-US', {
          month: 'long',
        }),
        studentEmail: task.to,
        classFee: task.fee,
        paymentUrl: task.paymentUrl,
      });
      await sendEmail({
        from: process.env.EMAIL_SENDER!,
        to: task.to,
        subject: `Payment Reminder for class ${task.class_name} for ${new Date(
          task.start_time,
        ).toLocaleString('en-US', {
          month: 'long',
        })}`,
        html: html,
        text: text,
      });
    };

    for (let i = 0; i < emailTasks.length; i++) {
      try {
        await sendSingleEmail(emailTasks[i]);
        logger.info('sending payment reminder to', emailTasks[i].to);
      } catch (error) {
        logger.error('Failed to send email to', {
          email: emailTasks[i].to,
          error,
        });
      }
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

export async function remindPayments3DaysPrior(client: SupabaseClient) {
  const sessions =
    await getUpcomingSessionsWithUnpaidStudentsBetween3_4Days(client);
  await sendPaymentReminderEmails(sessions);
}
