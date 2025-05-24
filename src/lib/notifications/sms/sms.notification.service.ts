// interfaces.ts

import { SupabaseClient } from '@supabase/supabase-js';
import {
  getAllUpcomingSessionsWithin24_25Hrs,
  getSessions2_1HrsAfterSession,
  getUpcomingSessionsWithUnpaidStudentsBetween3_4Days,
} from '../quieries';
import { stat } from 'fs';

// Define interfaces for type safety
interface SMSRequest {
  phoneNumbers: string[];
  message: string;
}

interface SingleSMSRequest {
  phoneNumber: string;
  message: string;
}

interface APIResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface APIConfig {
  id: string;
  password: string;
  baseUrl: string;
}

// smsService.ts
// SMS sending functions

const smsConfig: APIConfig = {
  id: process.env.TEXTIT_ID!,
  password: process.env.TEXTIT_PASSWORD!,
  baseUrl: process.env.TEXTIT_BASE_URL!,
};
async function sendBulkSMS(request: SMSRequest): Promise<APIResponse> {
  try {
    const numbers = request.phoneNumbers.join(',');
    const encodedMessage = encodeURIComponent(request.message);

    const baseUrl = smsConfig.baseUrl || 'https://www.textit.biz';
    const url = new URL(`${baseUrl}/sendmsg/`);
    const params = new URLSearchParams({
      id: smsConfig.id,
      pw: smsConfig.password,
      to: numbers,
      text: encodedMessage, // URL-encode the message
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const textResponse = await response.text();

    if (textResponse.startsWith('OK:')) {
      return {
        success: true,
        messageId: textResponse.split(':')[1],
      };
    } else {
      return {
        success: false,
        error: textResponse,
      };
    }
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sends payment reminder SMS 3 days prior to unpaid students
 * @param client Supabase client instance
 */
export async function remindPayments3DaysPrior(
  client: SupabaseClient,
): Promise<void> {
  try {
    const sessions: SessionWithUnpaidStudents[] =
      await getUpcomingSessionsWithUnpaidStudentsBetween3_4Days(client);

    if (sessions.length === 0) {
      console.log('No sessions with unpaid students found for reminders');
      return;
    }

    for (const session of sessions) {
      const phoneNumbers = session.class.unpaid_students
        .map((unpaid) => unpaid.student.phone_number)
        .filter((phone): phone is string => phone !== null);

      if (phoneNumbers.length === 0) {
        console.log(
          `No unpaid students found for session ${session.session_id}`,
        );
        continue;
      }

      const message = `PAYMENT REMINDER: Your fees of Rs.${session.class.fee} for the class ${session.class.name} due on ${session.start_time!.split('T')[0].slice(0, 10)}. Upload your receipt here: ${process.env.NEXT_PUBLIC_SITE_URL}/sessions/student/${session.session_id}
                        \nBank: Commercial Bank
                        \nAcc: 1234567890
                        \nName: Comma Education
                        \n-Comma Education`;

      const smsRequest: SMSRequest = {
        phoneNumbers,
        message,
      };

      console.log('sms request payment', smsRequest);
      const result = await sendBulkSMS(smsRequest);

      if (result.success) {
        console.log(
          `Payment reminders sent to ${phoneNumbers.length} students for session ${session.session_id}. Message ID: ${result.messageId}`,
        );
      } else {
        console.error(
          `Failed to send payment reminders for session ${session.session_id}: ${result.error}`,
        );
      }
    }
  } catch (error) {
    console.error('Error in remindPayments3DaysPrior:', error);
  }
}

/**
 * Sends notification SMS for a single session
 * @param session The session to notify about
 * @param status Whether this is before or after the session
 */
async function sendNotificationSms(
  session: NotificationClass,
  status: 'before' | 'after',
): Promise<void> {
  try {
    const phoneNumbers = session.class.students
      .map((student) => student.student.phone_number)
      .filter((phone): phone is string => phone !== null);

    if (phoneNumbers.length === 0) {
      console.log(`No students found for session ${session.id}`);
      return;
    }

    let message: string;
    // Parse the session start time for proper date formatting
    const sessionDate = new Date(session.start_time);
    // Format for India timezone (IST)
    const localDate = Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(sessionDate);
    // Format time for India timezone (IST)
    const localTime = Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }).format(sessionDate);

    if (status === 'before') {
      message = `REMINDER: Your ${session.class.name} is tomorrow ${localDate} at ${localTime}. \nAccess everything for this class here: ${process.env.NEXT_PUBLIC_SITE_URL}/sessions/student/${session.id}?type=upcoming \n-Comma Education`;
    } else {
      message = `Your ${session.class.name} recording from today is now available. Access it and all class materials here: ${process.env.NEXT_PUBLIC_SITE_URL}/sessions/student/${session.id} \n-Comma Education`;
    }

    const smsRequest: SMSRequest = {
      phoneNumbers,
      message,
    };

    console.log('sms request', smsRequest);
    const result = await sendBulkSMS(smsRequest);

    if (result.success) {
      console.log(
        `${status === 'before' ? 'Pre-session' : 'Post-session'} notifications sent to ${phoneNumbers.length} students for session ${session.id}. Message ID: ${result.messageId}`,
      );
    } else {
      console.error(
        `Failed to send ${status} notifications for session ${session.id}: ${result.error}`,
      );
    }
  } catch (error) {
    console.error(
      `Error in sendNotificationSms for session ${session.id}:`,
      error,
    );
  }
}

/**
 * Sends post-session notification SMS to students
 * @param client Supabase client instance
 */
export async function notifyAfterSessionSMS(
  client: SupabaseClient,
): Promise<void> {
  try {
    const sessions: NotificationClass[] =
      await getSessions2_1HrsAfterSession(client);

    if (sessions.length === 0) {
      console.log('No sessions found for post-session notifications');
      return;
    }

    console.log(
      `Found ${sessions.length} sessions for post-session notifications`,
    );

    // Process each session individually
    for (const session of sessions) {
      // Log session details for debugging
      console.log(
        `Processing after-session notification for: ${session.id}, class: ${session.class.name}, time: ${session.end_time}`,
      );
      await sendNotificationSms(session, 'after');
    }
  } catch (error) {
    console.error('Error in notifyAfterClass:', error);
  }
}

/**
 * Sends pre-session notification SMS 24-25 hours before sessions
 * @param client Supabase client instance
 */
export async function notifyUpcomingSessionsSMS(
  client: SupabaseClient,
): Promise<void> {
  try {
    const sessions: NotificationClass[] =
      await getAllUpcomingSessionsWithin24_25Hrs(client);

    if (sessions.length === 0) {
      console.log(
        'No upcoming sessions found for pre-session SMS notifications',
      );
      return;
    }

    console.log(
      `Found ${sessions.length} upcoming sessions for SMS notifications in the 24-25 hour window`,
    );

    // Log details of each session for debugging
    sessions.forEach((session, index) => {
      // Convert UTC time to IST for logging
      const sessionTime = new Date(session.start_time);
      const istTime = new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'full',
        timeStyle: 'long',
        timeZone: 'Asia/Kolkata',
      }).format(sessionTime);

      console.log(
        `Upcoming Session ${index + 1}: ID: ${session.id}, Class: ${session.class.name}, Start Time (IST): ${istTime}`,
      );
    });

    // Process each session individually
    for (const session of sessions) {
      await sendNotificationSms(session, 'before');
    }
  } catch (error) {
    console.error('Error in notifyUpcomingSessionsBefore24Hrs:', error);
  }
}

export async function sendSingleSMS(
  request: SingleSMSRequest,
): Promise<APIResponse> {
  try {
    const encodedMessage = encodeURIComponent(request.message);

    const baseUrl = smsConfig.baseUrl || 'https://www.textit.biz';
    const url = new URL(`${baseUrl}/sendmsg/`);
    const params = new URLSearchParams({
      id: smsConfig.id,
      pw: smsConfig.password,
      to: request.phoneNumber,
      text: encodedMessage, // URL-encode the message
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const textResponse = await response.text();

    if (textResponse.startsWith('OK:')) {
      return {
        success: true,
        messageId: textResponse.split(':')[1],
      };
    } else {
      return {
        success: false,
        error: textResponse,
      };
    }
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
