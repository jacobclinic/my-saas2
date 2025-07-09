// interfaces.ts

import { SupabaseClient } from '@supabase/supabase-js';
import {
  getAllUpcomingSessionsWithin1_2Hrs,
  getAllUpcomingSessionsWithin24_25Hrs,
  getSessions2_1HrsAfterSession,
  getUpcomingSessionsWithUnpaidStudentsBetween2_3Days,
  getTutorsForSessionsWithin1Hr,
} from '../quieries';
import { stat } from 'fs';
import getLogger from '~/core/logger';

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

const logger = getLogger();

const smsConfig: APIConfig = {
  id: process.env.TEXTIT_ID!,
  password: process.env.TEXTIT_PASSWORD!,
  baseUrl: process.env.TEXTIT_BASE_URL!,
};
async function sendBulkSMS(request: SMSRequest): Promise<APIResponse> {
  try {
    const numbers = request.phoneNumbers.join(',');
    const encodedMessage = encodeURIComponent(request.message);

    logger.info('📱 Attempting to send bulk SMS', {
      phoneNumbers: request.phoneNumbers,
      messagePreview: request.message.substring(0, 100) + '...',
      numberCount: request.phoneNumbers.length
    });

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
      logger.info('✅ Bulk SMS sent successfully', {
        phoneNumbers: request.phoneNumbers,
        messageId: textResponse.split(':')[1],
        response: textResponse
      });
      return {
        success: true,
        messageId: textResponse.split(':')[1],
      };
    } else {
      logger.error('❌ Bulk SMS failed', {
        phoneNumbers: request.phoneNumbers,
        error: textResponse
      });
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
export async function remindPayments2DaysPriorSMS(
  client: SupabaseClient,
): Promise<void> {
  try {
    const sessions: SessionWithUnpaidStudents[] =
      await getUpcomingSessionsWithUnpaidStudentsBetween2_3Days(client);

    if (sessions.length === 0) {
      logger.info('📱 No sessions with unpaid students found for SMS reminders');
      console.log('📱 No sessions with unpaid students found for SMS reminders');
      return;
    }

    logger.info(`📱 Starting payment reminder SMS batch`, {
      totalSessions: sessions.length,
      sessionsData: sessions.map(s => ({
        sessionId: s.session_id,
        className: s.class.name,
        unpaidStudentCount: s.class.unpaid_students?.length || 0
      }))
    });
    console.log(`📱 Starting payment reminder SMS for ${sessions.length} sessions`);
    
    let totalSMSAttempts = 0;
    let successfulSMSCount = 0;
    let failedSMSCount = 0;
    const successfulNumbers: string[] = [];
    const failedNumbers: string[] = [];

    for (const session of sessions) {
      const phoneNumbers = session.class.unpaid_students
        .map((unpaid) => unpaid.student.phone_number)
        .filter((phone): phone is string => phone !== null);

      if (phoneNumbers.length === 0) {
        logger.info(`📱 No unpaid students with phone numbers for session`, {
          sessionId: session.session_id,
          className: session.class.name
        });
        console.log(
          `📱 No unpaid students with phone numbers found for session ${session.session_id}`,
        );
        continue;
      }

      logger.info(`📱 Processing payment reminder SMS`, {
        sessionId: session.session_id,
        className: session.class.name,
        phoneNumbers,
        recipientCount: phoneNumbers.length
      });
      console.log(`📱 Processing payment reminder SMS for session ${session.session_id}, class: ${session.class.name}, recipients: ${phoneNumbers.length}`);

      const message = `Friendly reminder: Payment for ${session.class.name} is due on (2 days). Submit receipt here: ${process.env.NEXT_PUBLIC_SITE_URL}/sessions/student/${session.session_id} 
      \n- Comma Education`;

      const smsRequest: SMSRequest = {
        phoneNumbers,
        message,
      };

      totalSMSAttempts++;
      
      const result = await sendBulkSMS(smsRequest);

      if (result.success) {
        successfulSMSCount++;
        successfulNumbers.push(...phoneNumbers);
        logger.info(`✅ Payment reminder SMS sent successfully`, {
          sessionId: session.session_id,
          className: session.class.name,
          phoneNumbers,
          messageId: result.messageId
        });
        console.log(
          `✅ Payment reminder SMS sent to ${phoneNumbers.length} students for session ${session.session_id}. Message ID: ${result.messageId}`,
        );
      } else {
        failedSMSCount++;
        failedNumbers.push(...phoneNumbers);
        logger.error(`❌ Payment reminder SMS failed`, {
          sessionId: session.session_id,
          className: session.class.name,
          phoneNumbers,
          error: result.error
        });
        console.error(
          `❌ Failed to send payment reminder SMS for session ${session.session_id}: ${result.error}`,
        );
      }
    }

    // Final summary
    logger.info(`📱 Payment reminder SMS batch completed`, {
      totalSessions: sessions.length,
      totalSMSAttempts,
      successfulSMSCount,
      failedSMSCount,
      successfulNumbers,
      failedNumbers
    });
    console.log(`📱 Payment Reminder SMS Summary:`);
    console.log(`✅ Successfully sent: ${successfulSMSCount} SMS batches to ${successfulNumbers.length} numbers`);
    console.log(`❌ Failed to send: ${failedSMSCount} SMS batches to ${failedNumbers.length} numbers`);
    console.log(`✅ Successful phone numbers:`, successfulNumbers);
    if (failedNumbers.length > 0) {
      console.log(`❌ Failed phone numbers:`, failedNumbers);
    }
  } catch (error) {
    logger.error('❌ Error in remindPayments2DaysPriorSMS', {
      error: error instanceof Error ? error.message : String(error)
    });
    console.error('❌ Error in remindPayments2DaysPriorSMS:', error);
  }
}

/**
 * Sends notification SMS for a single session
 * @param session The session to notify about
 * @param status Whether this is before or after the session
 */
async function sendNotificationSms(
  session: NotificationClass,
  status: 'before' | 'after' | 'before1Hour',
): Promise<void> {
  try {
    const phoneNumbers = session.class.students
      .map((student) => student.student.phone_number)
      .filter((phone): phone is string => phone !== null);

    if (phoneNumbers.length === 0) {
      console.log(`📱 No students with phone numbers found for session ${session.id}`);
      return;
    }

    console.log(`📱 Processing ${status} SMS notification for session ${session.id}, class: ${session.class.name}, recipients: ${phoneNumbers.length}`);

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
      message = `REMINDER: Your ${session.class.name} class is tomorrow ${localDate} at ${localTime}. \nJoin & get materials: ${process.env.NEXT_PUBLIC_SITE_URL}/sessions/student/${session.id}\n-Comma Education`;
    } else if (status === 'after') {
      message = `The recording for your ${session.class.name} class is ready! Access it and all class materials here: ${process.env.NEXT_PUBLIC_SITE_URL}/sessions/student/${session.id} \n-Comma Education`;
    } else {
      message = `Your ${session.class.name} class is starting at ${localTime} today! \nJoin & get materials: ${process.env.NEXT_PUBLIC_SITE_URL}/sessions/student/${session.id} \n-Comma Education`;
    }

    const smsRequest: SMSRequest = {
      phoneNumbers,
      message,
    };

    console.log('📱 SMS request details:', {
      sessionId: session.id,
      className: session.class.name,
      status,
      phoneNumbers,
      message: message.substring(0, 100) + '...'
    });
    
    const result = await sendBulkSMS(smsRequest);

    if (result.success) {
      console.log(
        `✅ ${status === 'before' ? 'Pre-session' : status === 'after' ? 'Post-session' : '1-hour'} SMS notifications sent to ${phoneNumbers.length} students for session ${session.id}. Message ID: ${result.messageId}`,
      );
      console.log(`✅ Successful phone numbers:`, phoneNumbers);
    } else {
      console.error(
        `❌ Failed to send ${status} SMS notifications for session ${session.id}: ${result.error}`,
      );
      console.log(`❌ Failed phone numbers:`, phoneNumbers);
    }
  } catch (error) {
    console.error(
      `❌ Error in sendNotificationSms for session ${session.id}:`,
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
      console.log('📱 No sessions found for post-session SMS notifications');
      return;
    }

    console.log(
      `📱 Found ${sessions.length} sessions for post-session SMS notifications`,
    );

    let successCount = 0;
    let failureCount = 0;
    const allSuccessfulNumbers: string[] = [];
    const allFailedNumbers: string[] = [];

    // Process each session individually
    for (const session of sessions) {
      // Log session details for debugging
      console.log(
        `📱 Processing after-session SMS notification for: ${session.id}, class: ${session.class.name}, time: ${session.end_time}`,
      );
      
      const phoneNumbers = session.class.students
        .map((student) => student.student.phone_number)
        .filter((phone): phone is string => phone !== null);

      if (phoneNumbers.length > 0) {
        try {
          await sendNotificationSms(session, 'after');
          successCount++;
          allSuccessfulNumbers.push(...phoneNumbers);
        } catch (error) {
          failureCount++;
          allFailedNumbers.push(...phoneNumbers);
          console.error(`❌ Failed to process after-session SMS for session ${session.id}:`, error);
        }
      }
    }

    // Final summary
    console.log(`📱 After-Session SMS Summary:`);
    console.log(`✅ Successfully processed: ${successCount} sessions`);
    console.log(`❌ Failed to process: ${failureCount} sessions`);
    console.log(`✅ Total successful phone numbers: ${allSuccessfulNumbers.length}`, allSuccessfulNumbers);
    if (allFailedNumbers.length > 0) {
      console.log(`❌ Total failed phone numbers: ${allFailedNumbers.length}`, allFailedNumbers);
    }
  } catch (error) {
    console.error('❌ Error in notifyAfterSessionSMS:', error);
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
        '📱 No upcoming sessions found for pre-session SMS notifications (24-25 hours)',
      );
      return;
    }

    console.log(
      `📱 Found ${sessions.length} upcoming sessions for SMS notifications in the 24-25 hour window`,
    ); 
    
    let successCount = 0;
    let failureCount = 0;
    const allSuccessfulNumbers: string[] = [];
    const allFailedNumbers: string[] = [];
    
    // Log details of each session for debugging
    sessions.forEach((session, index) => {
      // Use standard date formatting for logging
      const sessionTime = new Date(session.start_time);
      console.log(
        `📱 Upcoming Session ${index + 1}: ID: ${session.id}, Class: ${session.class.name}, Start Time (UTC): ${sessionTime.toISOString()}`,
      );
    });

    // Process each session individually
    for (const session of sessions) {
      const phoneNumbers = session.class.students
        .map((student) => student.student.phone_number)
        .filter((phone): phone is string => phone !== null);

      if (phoneNumbers.length > 0) {
        try {
          await sendNotificationSms(session, 'before');
          successCount++;
          allSuccessfulNumbers.push(...phoneNumbers);
        } catch (error) {
          failureCount++;
          allFailedNumbers.push(...phoneNumbers);
          console.error(`❌ Failed to process 24-hour SMS for session ${session.id}:`, error);
        }
      }
    }

    // Final summary
    console.log(`📱 24-Hour SMS Notification Summary:`);
    console.log(`✅ Successfully processed: ${successCount} sessions`);
    console.log(`❌ Failed to process: ${failureCount} sessions`);
    console.log(`✅ Total successful phone numbers: ${allSuccessfulNumbers.length}`, allSuccessfulNumbers);
    if (allFailedNumbers.length > 0) {
      console.log(`❌ Total failed phone numbers: ${allFailedNumbers.length}`, allFailedNumbers);
    }
  } catch (error) {
    console.error('❌ Error in notifyUpcomingSessionsSMS:', error);
  }
}

export async function notifyUpcomingSessionsBefore1HourSMS(
  client: SupabaseClient,
): Promise<void> {
  try {
    const sessions: NotificationClass[] =
      await getAllUpcomingSessionsWithin1_2Hrs(client);

    if (sessions.length === 0) {
      console.log(
        '📱 No upcoming sessions found for pre-session SMS notifications (1-2 hours)',
      );
      return;
    }

    console.log(
      `📱 Found ${sessions.length} upcoming sessions for SMS notifications in the 1-2 hour window`,
    ); 
    
    let successCount = 0;
    let failureCount = 0;
    const allSuccessfulNumbers: string[] = [];
    const allFailedNumbers: string[] = [];
    
    // Log details of each session for debugging
    sessions.forEach((session, index) => {
      // Use standard date formatting for logging
      const sessionTime = new Date(session.start_time);
      console.log(
        `📱 Upcoming Session ${index + 1}: ID: ${session.id}, Class: ${session.class.name}, Start Time (UTC): ${sessionTime.toISOString()}`,
      );
    });

    // Process each session individually
    for (const session of sessions) {
      const phoneNumbers = session.class.students
        .map((student) => student.student.phone_number)
        .filter((phone): phone is string => phone !== null);

      if (phoneNumbers.length > 0) {
        try {
          await sendNotificationSms(session, 'before1Hour');
          successCount++;
          allSuccessfulNumbers.push(...phoneNumbers);
        } catch (error) {
          failureCount++;
          allFailedNumbers.push(...phoneNumbers);
          console.error(`❌ Failed to process 1-hour SMS for session ${session.id}:`, error);
        }
      }
    }

    // Final summary
    console.log(`📱 1-Hour SMS Notification Summary:`);
    console.log(`✅ Successfully processed: ${successCount} sessions`);
    console.log(`❌ Failed to process: ${failureCount} sessions`);
    console.log(`✅ Total successful phone numbers: ${allSuccessfulNumbers.length}`, allSuccessfulNumbers);
    if (allFailedNumbers.length > 0) {
      console.log(`❌ Total failed phone numbers: ${allFailedNumbers.length}`, allFailedNumbers);
    }
  } catch (error) {
    console.error('❌ Error in notifyUpcomingSessionsBefore1HourSMS:', error);
  }
}

export async function sendSingleSMS(
  request: SingleSMSRequest,
): Promise<APIResponse> {
  try {
    const encodedMessage = encodeURIComponent(request.message);

    logger.info('📱 Attempting to send single SMS', {
      phoneNumber: request.phoneNumber,
      messagePreview: request.message.substring(0, 100) + '...'
    });

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
      logger.info('✅ Single SMS sent successfully', {
        phoneNumber: request.phoneNumber,
        messageId: textResponse.split(':')[1],
        response: textResponse
      });
      return {
        success: true,
        messageId: textResponse.split(':')[1],
      };
    } else {
      logger.error('❌ Single SMS failed', {
        phoneNumber: request.phoneNumber,
        error: textResponse
      });
      return {
        success: false,
        error: textResponse,
      };
    }
  } catch (error) {
    logger.error('❌ Error sending single SMS', {
      phoneNumber: request.phoneNumber,
      error: error instanceof Error ? error.message : String(error)
    });
    console.error('Error sending single SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
/**
 * Sends reminder SMS to tutors within 1 hour before their sessions
 * @param client Supabase client instance
 */
export async function notifyTutorsWithin1HourSMS(
  client: SupabaseClient,
): Promise<void> {
  try {
    const tutorSessions: TutorNotificationClass[] =
      await getTutorsForSessionsWithin1Hr(client);

    if (tutorSessions.length === 0) {
      console.log('📱 No upcoming sessions found for tutor 1-hour SMS notifications');
      return;
    }

    console.log(
      `📱 Found ${tutorSessions.length} sessions for tutor SMS notifications within 1 hour`,
    );

    let successCount = 0;
    let failureCount = 0;
    const successfulNumbers: string[] = [];
    const failedNumbers: string[] = [];

    // Process each tutor session individually
    for (const tutorSession of tutorSessions) {
      // Skip if tutor has no phone number
      if (!tutorSession.tutor_phone_number) {
        console.log(
          `📱 No phone number found for tutor of class: ${tutorSession.class_name}`,
        );
        continue;
      }

      // Parse the session start time for proper date formatting
      const sessionDate = new Date(tutorSession.next_session_time);
      // Format time for India timezone (IST)
      const localTime = Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      }).format(sessionDate);

      // todo - update the link to the tutor session
      const message = `Hi ${tutorSession.tutor_name || 'Tutor'}, your ${tutorSession.class_name} class is starting at ${localTime} today! Link to join: ${process.env.NEXT_PUBLIC_SITE_URL}/upcoming-sessions 
- Comma Education`;

      const smsRequest: SingleSMSRequest = {
        phoneNumber: tutorSession.tutor_phone_number,
        message,
      };

      console.log(
        `📱 Sending 1-hour reminder SMS to tutor for class: ${tutorSession.class_name}, Phone: ${tutorSession.tutor_phone_number}, Tutor: ${tutorSession.tutor_name}`,
      );

      const result = await sendSingleSMS(smsRequest);

      if (result.success) {
        successCount++;
        successfulNumbers.push(tutorSession.tutor_phone_number);
        console.log(
          `✅ Tutor 1-hour reminder SMS sent successfully for class ${tutorSession.class_name}. Message ID: ${result.messageId}`,
        );
      } else {
        failureCount++;
        failedNumbers.push(tutorSession.tutor_phone_number);
        console.error(
          `❌ Failed to send tutor 1-hour reminder SMS for class ${tutorSession.class_name}: ${result.error}`,
        );
      }

      // Add a small delay between SMS sends to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Final summary
    console.log(`📱 Tutor 1-Hour SMS Notification Summary:`);
    console.log(`✅ Successfully sent: ${successCount} SMS messages`);
    console.log(`❌ Failed to send: ${failureCount} SMS messages`);
    console.log(`✅ Successful tutor phone numbers:`, successfulNumbers);
    if (failedNumbers.length > 0) {
      console.log(`❌ Failed tutor phone numbers:`, failedNumbers);
    }
  } catch (error) {
    console.error('❌ Error in notifyTutorsWithin1HourSMS:', error);
  }
}
