// interfaces.ts

import { SupabaseClient } from '@supabase/supabase-js';
import {
  getAllUpcomingSessionsWithin1_2Hrs,
  getAllUpcomingSessionsWithin24_25Hrs,
  getSessions2_1HrsAfterSession,
  getUpcomingSessionsWithUnpaidStudentsBetween2_3Days,
  getTutorsForSessionsWithin1Hr,
  getStudentsByClassId,
} from '../queries';
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

// Debug configuration on module load
console.log('🔵 SMS CONFIG DEBUG: SMS configuration loaded');
console.log('🔵 SMS CONFIG DEBUG: TEXTIT_ID present:', !!process.env.TEXTIT_ID);
console.log('🔵 SMS CONFIG DEBUG: TEXTIT_PASSWORD present:', !!process.env.TEXTIT_PASSWORD);
console.log('🔵 SMS CONFIG DEBUG: TEXTIT_BASE_URL present:', !!process.env.TEXTIT_BASE_URL);
console.log('🔵 SMS CONFIG DEBUG: TEXTIT_BASE_URL value:', process.env.TEXTIT_BASE_URL || 'default');

// Validation function for SMS configuration
function validateSMSConfig(): { isValid: boolean; missingVars: string[] } {
  const missingVars: string[] = [];
  
  if (!process.env.TEXTIT_ID) missingVars.push('TEXTIT_ID');
  if (!process.env.TEXTIT_PASSWORD) missingVars.push('TEXTIT_PASSWORD');
  if (!process.env.TEXTIT_BASE_URL) missingVars.push('TEXTIT_BASE_URL');
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

// Phone number formatting function
function formatPhoneNumber(phoneNumber: string): { formatted: string; isValid: boolean; error?: string } {
  console.log('🔵 SMS DEBUG: Formatting phone number:', phoneNumber);
  
  if (!phoneNumber || phoneNumber.trim() === '') {
    return { formatted: '', isValid: false, error: 'Phone number is empty' };
  }
  
  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  console.log('🔵 SMS DEBUG: Cleaned phone number:', cleaned);
  
  // If it starts with +, keep it
  if (cleaned.startsWith('+')) {
    console.log('🔵 SMS DEBUG: Phone number has international format');
    return { formatted: cleaned, isValid: true };
  }
  
  // If it starts with 0, replace with +94 (Sri Lanka)
  if (cleaned.startsWith('0')) {
    cleaned = '+94' + cleaned.substring(1);
    console.log('🔵 SMS DEBUG: Converted local format to international:', cleaned);
  }
  // If it starts with 94, add +
  else if (cleaned.startsWith('94')) {
    cleaned = '+' + cleaned;
    console.log('🔵 SMS DEBUG: Added + to country code:', cleaned);
  }
  // If it doesn't start with country code, assume Sri Lanka
  else if (cleaned.match(/^[1-9]/)) {
    cleaned = '+94' + cleaned;
    console.log('🔵 SMS DEBUG: Added Sri Lanka country code:', cleaned);
  }
  
  // Basic validation - should be at least 10 digits after country code
  const digitsOnly = cleaned.replace(/[^\d]/g, '');
  if (digitsOnly.length < 10) {
    return { formatted: cleaned, isValid: false, error: 'Phone number too short' };
  }
  
  console.log('🔵 SMS DEBUG: Final formatted phone number:', cleaned);
  return { formatted: cleaned, isValid: true };
}
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
export async function remindPayments2DaysPriorSMS(
  client: SupabaseClient,
): Promise<void> {
  try {
    const sessions: SessionWithUnpaidStudents[] =
      await getUpcomingSessionsWithUnpaidStudentsBetween2_3Days(client);

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

      const message = `Friendly reminder: Payment for ${session.class.name} is due on (2 days). Submit receipt here: ${process.env.NEXT_PUBLIC_SITE_URL}/sessions/student/${session.session_id} 
      \n- Comma Education`;

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
  status: 'before' | 'after' | 'before1Hour',
): Promise<void> {
  try {
    const phoneNumbers = session.class.students
      .map((student) => student.student.phone_number)
      .filter((phone): phone is string => phone !== null);

    if (phoneNumbers.length === 0) {
      console.log(
        `No students with phone numbers found for session ${session.id}`,
      );
      return;
    }

    console.log(
      `Processing ${status} SMS notification for session ${session.id}, class: ${session.class.name}, recipients: ${phoneNumbers.length}`,
    );

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

    console.log('SMS request details:', {
      sessionId: session.id,
      className: session.class.name,
      status,
      phoneNumbers,
      message: message.substring(0, 100) + '...',
    });

    const result = await sendBulkSMS(smsRequest);

    if (result.success) {
      console.log(
        `${status === 'before' ? 'Pre-session' : status === 'after' ? 'Post-session' : '1-hour'} SMS notifications sent to ${phoneNumbers.length} students for session ${session.id}. Message ID: ${result.messageId}`,
      );
      console.log(`Successful phone numbers:`, phoneNumbers);
    } else {
      console.error(
        `Failed to send ${status} SMS notifications for session ${session.id}: ${result.error}`,
      );
      console.log(`Failed phone numbers:`, phoneNumbers);
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
      console.log('No sessions found for post-session SMS notifications');
      return;
    }

    console.log(
      `Found ${sessions.length} sessions for post-session SMS notifications`,
    );

    let successCount = 0;
    let failureCount = 0;
    const allSuccessfulNumbers: string[] = [];
    const allFailedNumbers: string[] = [];

    // Process each session individually
    for (const session of sessions) {
      // Log session details for debugging
      console.log(
        `Processing after-session SMS notification for: ${session.id}, class: ${session.class.name}, time: ${session.end_time}`,
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
          console.error(
            `Failed to process after-session SMS for session ${session.id}:`,
            error,
          );
        }
      }
    }

    // Final summary
    console.log(`After-Session SMS Summary:`);
    console.log(`Successfully processed: ${successCount} sessions`);
    console.log(`Failed to process: ${failureCount} sessions`);
    console.log(
      `Total successful phone numbers: ${allSuccessfulNumbers.length}`,
      allSuccessfulNumbers,
    );
    if (allFailedNumbers.length > 0) {
      console.log(
        `Total failed phone numbers: ${allFailedNumbers.length}`,
        allFailedNumbers,
      );
    }
  } catch (error) {
    console.error('Error in notifyAfterSessionSMS:', error);
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
        'No upcoming sessions found for pre-session SMS notifications (24-25 hours)',
      );
      return;
    }

    console.log(
      `Found ${sessions.length} upcoming sessions for SMS notifications in the 24-25 hour window`,
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
        `Upcoming Session ${index + 1}: ID: ${session.id}, Class: ${session.class.name}, Start Time (UTC): ${sessionTime.toISOString()}`,
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
          console.error(
            `Failed to process 24-hour SMS for session ${session.id}:`,
            error,
          );
        }
      }
    }

    // Final summary
    console.log(`24-Hour SMS Notification Summary:`);
    console.log(`Successfully processed: ${successCount} sessions`);
    console.log(`Failed to process: ${failureCount} sessions`);
    console.log(
      `Total successful phone numbers: ${allSuccessfulNumbers.length}`,
      allSuccessfulNumbers,
    );
    if (allFailedNumbers.length > 0) {
      console.log(
        `Total failed phone numbers: ${allFailedNumbers.length}`,
        allFailedNumbers,
      );
    }
  } catch (error) {
    console.error('Error in notifyUpcomingSessionsSMS:', error);
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
        'No upcoming sessions found for pre-session SMS notifications (1-2 hours)',
      );
      return;
    }

    console.log(
      `Found ${sessions.length} upcoming sessions for SMS notifications in the 1-2 hour window`,
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
        `Upcoming Session ${index + 1}: ID: ${session.id}, Class: ${session.class.name}, Start Time (UTC): ${sessionTime.toISOString()}`,
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
          console.error(
            `Failed to process 1-hour SMS for session ${session.id}:`,
            error,
          );
        }
      }
    }

    // Final summary
    console.log(`1-Hour SMS Notification Summary:`);
    console.log(`Successfully processed: ${successCount} sessions`);
    console.log(`Failed to process: ${failureCount} sessions`);
    console.log(
      `Total successful phone numbers: ${allSuccessfulNumbers.length}`,
      allSuccessfulNumbers,
    );
    if (allFailedNumbers.length > 0) {
      console.log(
        `Total failed phone numbers: ${allFailedNumbers.length}`,
        allFailedNumbers,
      );
    }
  } catch (error) {
    console.error('Error in notifyUpcomingSessionsBefore1HourSMS:', error);
  }
}

export async function sendSingleSMS(
  request: SingleSMSRequest,
): Promise<APIResponse> {
  console.log('🔵 SMS DEBUG: Starting sendSingleSMS');
  console.log('🔵 SMS DEBUG: request:', JSON.stringify(request, null, 2));
  console.log('🔵 SMS DEBUG: phoneNumber:', request.phoneNumber);
  console.log('🔵 SMS DEBUG: message length:', request.message?.length);
  
  // Validate SMS configuration
  const configValidation = validateSMSConfig();
  console.log('🔵 SMS DEBUG: Config validation:', configValidation);
  
  if (!configValidation.isValid) {
    console.error('❌ SMS DEBUG: SMS configuration invalid. Missing:', configValidation.missingVars);
    return {
      success: false,
      error: `SMS configuration invalid. Missing: ${configValidation.missingVars.join(', ')}`,
    };
  }
  
  // Check SMS configuration
  console.log('🔵 SMS DEBUG: smsConfig check:');
  console.log('🔵 SMS DEBUG: smsConfig.id:', smsConfig.id ? 'Present' : 'Missing');
  console.log('🔵 SMS DEBUG: smsConfig.password:', smsConfig.password ? 'Present' : 'Missing');
  console.log('🔵 SMS DEBUG: smsConfig.baseUrl:', smsConfig.baseUrl || 'Using default');
  
  if (!request.phoneNumber || request.phoneNumber.trim() === '') {
    console.error('❌ SMS DEBUG: phoneNumber is empty or null');
    return {
      success: false,
      error: 'Phone number is required',
    };
  }
  
  // Format and validate phone number
  const phoneValidation = formatPhoneNumber(request.phoneNumber);
  console.log('🔵 SMS DEBUG: Phone validation result:', phoneValidation);
  
  if (!phoneValidation.isValid) {
    console.error('❌ SMS DEBUG: Invalid phone number:', phoneValidation.error);
    return {
      success: false,
      error: `Invalid phone number: ${phoneValidation.error}`,
    };
  }
  
  const formattedPhone = phoneValidation.formatted;
  console.log('🔵 SMS DEBUG: Using formatted phone:', formattedPhone);
  
  if (!request.message || request.message.trim() === '') {
    console.error('❌ SMS DEBUG: message is empty or null');
    return {
      success: false,
      error: 'Message is required',
    };
  }

  try {
    const encodedMessage = encodeURIComponent(request.message);
    console.log('🔵 SMS DEBUG: encodedMessage:', encodedMessage);

    const baseUrl = smsConfig.baseUrl || 'https://www.textit.biz';
    const url = new URL(`${baseUrl}/sendmsg/`);
    const params = new URLSearchParams({
      id: smsConfig.id,
      pw: smsConfig.password,
      to: formattedPhone,
      text: encodedMessage, // URL-encode the message
    });

    const fullUrl = `${url}?${params.toString()}`;
    console.log('🔵 SMS DEBUG: Full URL (without password):', fullUrl.replace(/pw=[^&]*/, 'pw=****'));
    console.log('🔵 SMS DEBUG: Making GET request to TextIt API');

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('🔵 SMS DEBUG: Response status:', response.status);
    console.log('🔵 SMS DEBUG: Response headers:', Object.fromEntries(response.headers));

    const textResponse = await response.text();
    console.log('🔵 SMS DEBUG: Raw response text:', textResponse);

    if (textResponse.startsWith('OK:')) {
      const messageId = textResponse.split(':')[1];
      console.log('✅ SMS DEBUG: SMS sent successfully, messageId:', messageId);
      return {
        success: true,
        messageId: messageId,
      };
    } else {
      console.error('❌ SMS DEBUG: SMS failed with response:', textResponse);
      return {
        success: false,
        error: textResponse,
      };
    }
  } catch (error) {
    console.error('❌ SMS DEBUG: Exception in sendSingleSMS:', error);
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
      console.log(
        'No upcoming sessions found for tutor 1-hour SMS notifications',
      );
      return;
    }

    console.log(
      `Found ${tutorSessions.length} sessions for tutor SMS notifications within 1 hour`,
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
          `No phone number found for tutor of class: ${tutorSession.class_name}`,
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
        `Sending 1-hour reminder SMS to tutor for class: ${tutorSession.class_name}, Phone: ${tutorSession.tutor_phone_number}, Tutor: ${tutorSession.tutor_name}`,
      );

      const result = await sendSingleSMS(smsRequest);

      if (result.success) {
        successCount++;
        successfulNumbers.push(tutorSession.tutor_phone_number);
        console.log(
          `Tutor 1-hour reminder SMS sent successfully for class ${tutorSession.class_name}. Message ID: ${result.messageId}`,
        );
      } else {
        failureCount++;
        failedNumbers.push(tutorSession.tutor_phone_number);
        console.error(
          `Failed to send tutor 1-hour reminder SMS for class ${tutorSession.class_name}: ${result.error}`,
        );
      }

      // Add a small delay between SMS sends to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Final summary
    console.log(`Tutor 1-Hour SMS Notification Summary:`);
    console.log(`Successfully sent: ${successCount} SMS messages`);
    console.log(`Failed to send: ${failureCount} SMS messages`);
    console.log(`Successful tutor phone numbers:`, successfulNumbers);
    if (failedNumbers.length > 0) {
      console.log(`Failed tutor phone numbers:`, failedNumbers);
    }
  } catch (error) {
    console.error('Error in notifyTutorsWithin1HourSMS:', error);
  }
}

/**
 * Sends reminder SMS to students after a class schedule update
 * @param client Supabase client instance
 * @param params Parameters containing class and schedule update details
 */
export async function notifyStudentsAfterClassScheduleUpdateSMS(
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
  } = params;

  try {
    // Get all students enrolled in the class
    const students = await getStudentsByClassId(client, classId);

    console.log(
      `Found ${students.length} students to notify via SMS for class schedule update: ${className}`,
    );

    if (students.length === 0) {
      console.log('No students found for this class');
      return;
    }

    // Filter students who have phone numbers
    const studentsWithPhones = students.filter(
      (student) =>
        student.student.phone_number &&
        student.student.phone_number.trim() !== '',
    );

    if (studentsWithPhones.length === 0) {
      console.log('No students with phone numbers found for this class');
      return;
    }

    console.log(
      `Sending SMS to ${studentsWithPhones.length} students with phone numbers`,
    );

    // Format the time
    const timeRange =
      updatedStartTime === updatedEndTime
        ? updatedStartTime
        : `${updatedStartTime} - ${updatedEndTime}`;

    // Create the SMS message
    const message = `Important: The schedule for your ${className} class has been updated. All future classes are now on ${updatedClassDay} at ${timeRange}. \n- Comma Education`;

    let successCount = 0;
    let failureCount = 0;
    const successfulNumbers: string[] = [];
    const failedNumbers: string[] = [];

    // Send SMS to each student
    for (const student of studentsWithPhones) {
      try {
        const result = await sendSingleSMS({
          phoneNumber: student.student.phone_number!,
          message: message,
        });

        if (result.success) {
          successCount++;
          successfulNumbers.push(student.student.phone_number!);
          console.log(
            `Successfully sent class schedule update SMS to: ${student.student.phone_number} (${student.student.first_name})`,
          );
        } else {
          failureCount++;
          failedNumbers.push(student.student.phone_number!);
          console.error(
            `Failed to send class schedule update SMS to: ${student.student.phone_number} (${student.student.first_name}) - ${result.error}`,
          );
        }
      } catch (error) {
        failureCount++;
        failedNumbers.push(student.student.phone_number!);
        console.error(
          `Error sending class schedule update SMS to: ${student.student.phone_number} (${student.student.first_name})`,
          error,
        );
      }

      // Add a small delay between SMS sends to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Final summary
    console.log(`Class Schedule Update SMS Notification Summary:`);
    console.log(`Successfully sent: ${successCount} SMS messages`);
    console.log(`Failed to send: ${failureCount} SMS messages`);
    console.log(`Successful phone numbers:`, successfulNumbers);
    if (failedNumbers.length > 0) {
      console.log(`Failed phone numbers:`, failedNumbers);
    }

    console.log('All class schedule update SMS notifications processed');
  } catch (error) {
    console.error(
      'Error sending class schedule update SMS notifications:',
      error,
    );
    throw error;
  }
}

export async function sendTutorRegistrationSMS(
  client: SupabaseClient,
  tutorName: string,
  tutorPhone: string,
) {
  console.log('🔵 SMS DEBUG: Starting sendTutorRegistrationSMS');
  console.log('🔵 SMS DEBUG: tutorName:', tutorName);
  console.log('🔵 SMS DEBUG: tutorPhone:', tutorPhone);
  console.log('🔵 SMS DEBUG: tutorPhone type:', typeof tutorPhone);
  console.log('🔵 SMS DEBUG: tutorPhone length:', tutorPhone?.length);
  
  if (!tutorPhone || tutorPhone.trim() === '') {
    console.error('❌ SMS DEBUG: tutorPhone is empty or null');
    return;
  }

  try {
    const message = `Thanks for applying to Comma Education, ${tutorName}! We're reviewing your application. We'll notify you once accepted, then you can log in to the tutor portal with your registration email/password
`;
    console.log('🔵 SMS DEBUG: Message:', message);
    console.log('🔵 SMS DEBUG: About to call sendSingleSMS');
    
    const result = await sendSingleSMS({
      phoneNumber: tutorPhone,
      message: message,
    });
    
    console.log('🔵 SMS DEBUG: sendSingleSMS result:', result);
    
    if (result.success) {
      console.log(`✅ Successfully sent tutor registration SMS to: ${tutorPhone}`);
    } else {
      console.error(
        `❌ Failed to send tutor registration SMS to: ${tutorPhone} - ${result.error}`,
      );
    }
  } catch (error) {
    console.error('❌ Error sending tutor registration SMS:', error);
  }
}

export async function sendTutorApprovalSMS(
  tutorName: string,
  tutorPhone: string,
  is_approved: boolean,
) {
  console.log('🔵 SMS DEBUG: Starting sendTutorApprovalSMS');
  console.log('🔵 SMS DEBUG: tutorName:', tutorName);
  console.log('🔵 SMS DEBUG: tutorPhone:', tutorPhone);
  console.log('🔵 SMS DEBUG: is_approved:', is_approved);
  console.log('🔵 SMS DEBUG: tutorPhone type:', typeof tutorPhone);
  console.log('🔵 SMS DEBUG: tutorPhone length:', tutorPhone?.length);
  
  if (!tutorPhone || tutorPhone.trim() === '') {
    console.error('❌ SMS DEBUG: tutorPhone is empty or null');
    return;
  }

  try {
    let message = '';
    if (is_approved) {
      message = `Congratulations, ${tutorName}! Your Comma Education application is accepted! Access your Tutor Portal: ${process.env.NEXT_PUBLIC_SITE_URL}.\nLogin with your registration email/password.\nWelcome aboard!`;
    } else {
      //update rejection mail
      message = `Hi ${tutorName}, We are sorry to inform you that your Comma Education application has been rejected!\n Your documents could not be verified.\nTry again with proper documents`;
    }
    
    console.log('🔵 SMS DEBUG: Message:', message);
    console.log('🔵 SMS DEBUG: About to call sendSingleSMS');
    
    const result = await sendSingleSMS({
      phoneNumber: tutorPhone,
      message: message,
    });
    
    console.log('🔵 SMS DEBUG: sendSingleSMS result:', result);
    
    if (result.success) {
      console.log(`✅ Successfully sent tutor ${is_approved ? 'approval' : 'rejection'} SMS to: ${tutorPhone}`);
    } else {
      console.error(
        `❌ Failed to send tutor ${is_approved ? 'approval' : 'rejection'} SMS to: ${tutorPhone} - ${result.error}`,
      );
    }
  } catch (error) {
    console.error('❌ Error sending tutor approval SMS:', error);
  }
}
