import { SupabaseClient } from '@supabase/supabase-js';
import {
  getAllUpcomingSessionsWithin1_2Hrs,
  getAllUpcomingSessionsWithin24_25Hrs,
  getSessions2_1HrsAfterSession,
  getUpcomingSessionsWithUnpaidStudentsBetween2_3Days,
  getStudentsByClassId,
} from '../quieries';

import { format, parseISO } from 'date-fns';
import getLogger from '~/core/logger';
import { EmailService } from '~/core/email/send-email-mailtrap';
import {
  getStudentNotifyAfterEmailTemplate,
  getStudentNotifyBefore1HrEmailTemplate,
  getStudentNotifyBeforeEmailTemplate,
  paymentReminderEmaiTemplate,
  getNotifyClassUpdateTemplate,
} from '~/core/email/templates/emailTemplate';

const logger = getLogger();

// Process emails with a throttle (2 per second = 500ms per request)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const rateLimitDelay = 1000; // 1000ms = 1 requests per second

const emailService = EmailService.getInstance();

async function sendNotifySessionEmails(
  data: NotificationClass[],
  beforeOrAfter: 'before' | 'after' | 'before1Hour',
) {
  try {
    // Flatten all students across all sessions into a single array
    const emailTasks = data.flatMap((session) => {
      return (
        session.class?.students.map((student) => ({
          to: student.student.email,
          session_id: session.id,
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
          sessionId: task.session_id,
        });
        console.log('sending email to', task.to);

        await emailService.sendEmail({
          from: process.env.EMAIL_SENDER!,
          to: task.to,
          subject: `Upcoming Class Notification`,
          html: html,
          text: text,
        });
      } else if (beforeOrAfter === 'after') {
        const { html, text } = getStudentNotifyAfterEmailTemplate({
          studentName: task.first_name!,
          className: task.class_name,
          sessionDate: new Date(task.start_time).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          sessionId: task.session_id,
        });
        await emailService.sendEmail({
          from: process.env.EMAIL_SENDER!,
          to: task.to,
          subject: ` Recording for ${task.class_name} Class is Now Available`,
          html: html,
          text: text,
        });
      } else if (beforeOrAfter === 'before1Hour') {
        const { html, text } = getStudentNotifyBefore1HrEmailTemplate({
          studentName: task.first_name!,
          className: task.class_name,
          sessionDate: localDate,
          sessionTime: localTime,
          sessionId: task.session_id,
        });

        await emailService.sendEmail({
          from: process.env.EMAIL_SENDER!,
          to: task.to,
          subject: ` Starting Soon: Your ${task.class_name} Class!`,
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

export async function notifyUpcomingSessionsBefore1Hrs(client: SupabaseClient) {
  const sessions = await getAllUpcomingSessionsWithin1_2Hrs(client);
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

  await sendNotifySessionEmails(sessions, 'before1Hour');
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
          sessionId: session.session_id,
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
        sessionId: task.sessionId,
      });
      await emailService.sendEmail({
        from: process.env.EMAIL_SENDER!,
        to: task.to,
        subject: `Payment Reminder for ${task.class_name} class. Due in 2 days`,
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
    await getUpcomingSessionsWithUnpaidStudentsBetween2_3Days(client);
  await sendPaymentReminderEmails(sessions);
}

export async function notifyStudentsAfterClassScheduleUpdate(
  client: SupabaseClient,
  params: {
    classId: string;
    className: string;
    updatedClassDay: string;
    updatedStartTime: string;
    updatedEndTime: string;
    nextClassDate: string;
  },
) {
  const {
    classId,
    className,
    updatedClassDay,
    updatedStartTime,
    updatedEndTime,
    nextClassDate,
  } = params;

  try {
    // Get all students enrolled in the class
    const students = await getStudentsByClassId(client, classId);

    console.log(
      `Found ${students.length} students to notify for class schedule update: ${className}`,
    );

    if (students.length === 0) {
      console.log('No students found for this class');
      return;
    }

    // Format the updated class time
    const updatedClassTime = `${updatedStartTime} - ${updatedEndTime}`;

    // Function to send a single email
    const sendSingleEmail = async (
      student: Awaited<ReturnType<typeof getStudentsByClassId>>[number],
    ) => {
      const { html, text } = getNotifyClassUpdateTemplate({
        className: className,
        studentName: student.student.first_name || 'Student',
        firstClassDate: nextClassDate,
        updatedClassDay: updatedClassDay,
        updatedClassTime: updatedClassTime,
      });

      await emailService.sendEmail({
        from: process.env.EMAIL_SENDER!,
        to: student.student.email,
        subject: `Important Schedule Update for Your ${className} Class`,
        html: html,
        text: text,
      });
    };

    // Process emails with rate limiting
    for (let i = 0; i < students.length; i++) {
      try {
        await sendSingleEmail(students[i]);
        logger.info('Sending class schedule update email to', {
          email: students[i].student.email,
          className: className,
        });
      } catch (error) {
        logger.error('Failed to send class schedule update email to', {
          email: students[i].student.email,
          className: className,
          error,
        });
      }

      // Add delay after every email, except the last one
      if (i < students.length - 1) {
        await delay(rateLimitDelay);
      }
    }

    console.log('All class schedule update notifications sent successfully');
  } catch (error) {
    console.error('Error sending class schedule update notifications:', error);
    throw error;
  }
}
