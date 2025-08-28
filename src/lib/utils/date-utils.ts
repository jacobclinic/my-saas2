import {
  addDays,
  startOfWeek,
  endOfYear,
  endOfMonth,
  subHours,
  isAfter,
  isBefore,
  isWithinInterval,
} from 'date-fns';
import { TimeSlot } from '../classes/types/class-v2';
import { dayMap } from '../constants-v2';
import { parse, format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
// export function getNextNOccurrences(timeSlot: TimeSlot, startDate: string, count: number): Date[] {

export { format, parse };

interface TimeRange {
  startTime: string; // e.g., "2025-05-03T06:13:00Z"
  endTime: string; // e.g., "2025-05-03T06:22:00Z"
}

export function getCurrentDateTimeISO(): string {
  return new Date().toISOString();
}

/**
 * Gets today's date in Sri Lanka timezone (Asia/Colombo) in YYYY-MM-DD format
 * @returns Today's date in Sri Lanka timezone as YYYY-MM-DD string
 */
export function getTodayInSriLankaTimezone(): string {
  const now = new Date();
  return formatInTimeZone(now, 'Asia/Colombo', 'yyyy-MM-dd');
}

/**
 * Gets today's date in the user's local timezone in YYYY-MM-DD format
 * @returns Today's date in local timezone as YYYY-MM-DD string
 */
export function getTodayInLocalTimezone(): string {
  const now = new Date();
  return format(now, 'yyyy-MM-dd');
}

export function getNextNOccurrences(
  timeSlot: TimeSlot,
  startDate: string,
  count: number,
): {
  startTime: Date;
  endTime: Date;
}[] {
  // Parse the starting date
  let start = new Date(startDate);

  // Get current day and target day
  const targetDay = dayMap[timeSlot.day.toLowerCase()];
  const currentDay = start.getDay(); // Get current day (0-6, where 0 is Sunday)

  // Set first occurrence date
  let firstOccurrence: Date;

  // Check if today is the target day
  if (currentDay === targetDay) {
    // Today is the target day
    firstOccurrence = new Date(start);
  } else {
    // Not today, find the next occurrence of the target day
    firstOccurrence = new Date(start);

    // Calculate days to add to get to the target day
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // Ensure we're moving forward to the next occurrence
    }

    firstOccurrence.setDate(firstOccurrence.getDate() + daysToAdd);
  }

  // Generate the next N occurrences
  const occurrences: { startTime: Date; endTime: Date }[] = [];
  let currentDate = firstOccurrence;

  for (let i = 0; i < count; i++) {
    // Parse the start time from the time slot
    const [startHours, startMinutes] = timeSlot.startTime
      .split(':')
      .map(Number);
    const dateWithStartTime = new Date(currentDate);
    dateWithStartTime.setHours(startHours, startMinutes, 0, 0);

    // Parse the end time from the time slot
    const [endHours, endMinutes] = timeSlot.endTime.split(':').map(Number);
    const dateWithEndTime = new Date(currentDate);
    dateWithEndTime.setHours(endHours, endMinutes, 0, 0);

    occurrences.push({
      startTime: dateWithStartTime,
      endTime: dateWithEndTime,
    });

    currentDate = addDays(currentDate, 7);
  }

  return occurrences;
}

export function getUpcomingOccurrencesForYear(
  timeSlot: TimeSlot,
  startDate: string,
): { startTime: Date; endTime: Date }[] {
  // Parse the starting date
  let start = new Date(startDate);

  // Get current day and target day
  const targetDay = dayMap[timeSlot.day.toLowerCase()];
  const currentDay = start.getDay(); // Get current day (0-6, where 0 is Sunday)

  // Set first occurrence date
  let firstOccurrence: Date;

  // Check if today is the target day
  if (currentDay === targetDay) {
    // Today is the target day
    firstOccurrence = new Date(start);
  } else {
    // Not today, find the next occurrence of the target day
    firstOccurrence = new Date(start);

    // Calculate days to add to get to the target day
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // Ensure we're moving forward to the next occurrence
    }

    firstOccurrence.setDate(firstOccurrence.getDate() + daysToAdd);
  }

  // Get the last date of the current year
  const endOfYearDate = endOfYear(start);

  // Generate occurrences until the end of the year
  const occurrences: { startTime: Date; endTime: Date }[] = [];
  let currentDate = firstOccurrence;

  while (currentDate <= endOfYearDate) {
    // Parse the start time from the time slot
    const [startHours, startMinutes] = timeSlot.startTime
      .split(':')
      .map(Number);
    const dateWithStartTime = new Date(currentDate);
    dateWithStartTime.setHours(startHours, startMinutes, 0, 0);

    // Parse the end time from the time slot
    const [endHours, endMinutes] = timeSlot.endTime.split(':').map(Number);
    const dateWithEndTime = new Date(currentDate);
    dateWithEndTime.setHours(endHours, endMinutes, 0, 0);

    occurrences.push({
      startTime: dateWithStartTime,
      endTime: dateWithEndTime,
    });

    currentDate = addDays(currentDate, 7);
  }

  return occurrences;
}

export function getUpcomingOccurrences(
  timeSlot: TimeSlot,
  startDate: string,
  endDate: string,
): { startTime: Date; endTime: Date }[] {
  // Function to create date objects from date strings
  function createDateObject(dateStr: string, timeStr: string = '00:00:00') {
    // Just parse the date directly without timezone adjustment
    return new Date(`${dateStr.split('T')[0]}T${timeStr}`);
  }

  // Create date objects from the input strings
  const startDateObj = createDateObject(startDate);
  const endDateObj = createDateObject(endDate, '23:59:59');
  // Get the day numbers (0-6 Sunday-Saturday)
  const targetDay = dayMap[timeSlot.day.toLowerCase()];
  const startDateDay = startDateObj.getDay();

  // Collection for all occurrences
  const occurrences: { startTime: Date; endTime: Date }[] = [];

  // Parse time components once
  const [startHours, startMinutes] = timeSlot.startTime.split(':').map(Number);
  const [endHours, endMinutes] = timeSlot.endTime.split(':').map(Number);

  let firstOccurrenceDate: Date;

  // For classes, we always want to include the session on the start date
  // if it's the same day of week, regardless of time
  if (startDateDay === targetDay) {
    // If start date is the target day, use it directly
    firstOccurrenceDate = new Date(startDateObj);

    // Create today's session time objects
    const todayStartTime = new Date(startDateObj);
    todayStartTime.setHours(startHours, startMinutes, 0, 0);

    const todayEndTime = new Date(startDateObj);
    todayEndTime.setHours(endHours, endMinutes, 0, 0);

    // Always add today's session for new classes
    occurrences.push({
      startTime: todayStartTime,
      endTime: todayEndTime,
    });

    // For next weekly occurrence
    firstOccurrenceDate = addDays(startDateObj, 7);
  } else {
    // Find the next occurrence of the target day after start date
    const daysToAdd = (targetDay - startDateDay + 7) % 7;
    firstOccurrenceDate = addDays(startDateObj, daysToAdd);
  }

  // Generate all future weekly occurrences
  let currentDate = firstOccurrenceDate;

  while (currentDate <= endDateObj) {
    // Create times for this occurrence
    const occStartTime = new Date(currentDate);
    occStartTime.setHours(startHours, startMinutes, 0, 0);

    const occEndTime = new Date(currentDate);
    occEndTime.setHours(endHours, endMinutes, 0, 0);

    // Add this occurrence
    occurrences.push({
      startTime: occStartTime,
      endTime: occEndTime,
    });

    // Move to next week
    currentDate = addDays(currentDate, 7);
  }

  // Log the first few occurrences for debugging
  occurrences.slice(0, 3).forEach((occ, i) => {
    console.log(`Occurrence ${i + 1}:`, {
      date: occ.startTime.toDateString(),
      time: occ.startTime.toTimeString().split(' ')[0],
    });
  });

  if (occurrences.length === 0) {
    console.warn('No occurrences found. This should never happen.');
  }

  return occurrences;
}

export function getUpcomingOccurrencesForMonth(
  timeSlot: TimeSlot,
  startDate: string,
): { startTime: Date; endTime: Date }[] {
  // Parse the starting date
  let start = new Date(startDate);

  // Get current day and target day
  const targetDay = dayMap[timeSlot.day.toLowerCase()];
  const currentDay = start.getDay(); // Get current day (0-6, where 0 is Sunday)

  // Set first occurrence date
  let firstOccurrence: Date;

  // Check if today is the target day
  if (currentDay === targetDay) {
    // Today is the target day
    firstOccurrence = new Date(start);
  } else {
    // Not today, find the next occurrence of the target day
    firstOccurrence = new Date(start);

    // Calculate days to add to get to the target day
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // Ensure we're moving forward to the next occurrence
    }

    firstOccurrence.setDate(firstOccurrence.getDate() + daysToAdd);
  }

  // Get the last date of the current month
  const endOfMonthDate = endOfMonth(start);

  // Generate occurrences until the end of the month
  const occurrences: { startTime: Date; endTime: Date }[] = [];
  let currentDate = firstOccurrence;

  while (currentDate <= endOfMonthDate) {
    // Parse the start time from the time slot
    const [startHours, startMinutes] = timeSlot.startTime
      .split(':')
      .map(Number);
    const dateWithStartTime = new Date(currentDate);
    dateWithStartTime.setHours(startHours, startMinutes, 0, 0);

    // Parse the end time from the time slot
    const [endHours, endMinutes] = timeSlot.endTime.split(':').map(Number);
    const dateWithEndTime = new Date(currentDate);
    dateWithEndTime.setHours(endHours, endMinutes, 0, 0);
    occurrences.push({
      startTime: dateWithStartTime,
      endTime: dateWithEndTime,
    });

    currentDate = addDays(currentDate, 7); // Move to next week
  }

  return occurrences;
}

export function getPaymentPeriodFromDate(date: Date): string {
  const utcDate = new Date(date.toISOString());
  const year = utcDate.getUTCFullYear();
  const month = (utcDate.getUTCMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

export function isFirstWeekOfMonth(checkDate: string | Date): boolean {
  const date = new Date(checkDate);
  const dayOfMonth = date.getDate();
  return dayOfMonth <= 7;
}

export function formatToLocalHHmmAMPM(date: string | Date): string {
  return format(new Date(date), 'hh:mm aaa');
}

export function formatDateStandard(
  date: string | Date,
  dateFormat: string = 'dd/MM/yyyy',
): string {
  return format(new Date(date), dateFormat);
}

export function formatToHumanReadableDate(date: string | Date): string {
  return format(new Date(date), 'EEEE, MMMM dd, yyyy');
}

/**
 * Checks if the current time is within 1 hour before the given start time
 * @param startTime - ISO string or Date object representing session start time
 * @returns boolean indicating if within 1 hour before start
 */
export function isOneHourBefore(startTime: string | Date): boolean {
  const now = new Date();
  const sessionStart = new Date(startTime);
  const oneHourBefore = subHours(sessionStart, 1);

  return isWithinInterval(now, { start: oneHourBefore, end: sessionStart });
}

/**
 * Parses a session date and time string into an ISO datetime string
 * @param sessionDate - Date string like "Thursday, August 14, 2025"
 * @param sessionTime - Time range string like "4:30 PM - 9:30 PM"
 * @returns ISO datetime string or null if parsing fails
 */
export function parseSessionDateTime(
  sessionDate: string,
  sessionTime: string,
): string | null {
  try {
    // Extract start time from session time range
    const timeRange = sessionTime.split(' - ');
    const startTime = timeRange[0]?.trim();

    if (!startTime) return null;

    // Parse the date and time using date-fns
    const dateTimeString = `${sessionDate} ${startTime}`;
    const parsedDate = new Date(dateTimeString);

    if (isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate.toISOString();
  } catch (error) {
    console.error('Error parsing session date/time:', error);
    return null;
  }
}

export function getSessionStatus(
  startTime: string,
  endTime?: string,
): 'Upcoming' | 'Starting soon' | 'Ongoing' {
  const now = new Date();
  const sessionStart = new Date(startTime);

  if (isNaN(sessionStart.getTime())) {
    return 'Upcoming';
  }

  // If endTime is provided, check if session is ongoing
  if (endTime) {
    const sessionEnd = new Date(endTime);
    if (isWithinInterval(now, { start: sessionStart, end: sessionEnd })) {
      return 'Ongoing';
    }
  }

  // Check if within 1 hour before start time using date-fns
  if (isOneHourBefore(sessionStart)) {
    return 'Starting soon';
  }

  return 'Upcoming';
}

export function getCurrentUTCDate(): string {
  return new Date().toISOString();
}

export function getInvoicePeriodUTC(date: Date): string {
  return formatInTimeZone(date, 'UTC', 'yyyy-MM');
}

export function getFullDateUTC(date: Date): string {
  return formatInTimeZone(date, 'UTC', 'yyyy-MM-dd');
}

export function getDueDateUTC(date: Date): string {
  const year = formatInTimeZone(date, 'UTC', 'yyyy');
  const month = formatInTimeZone(date, 'UTC', 'MM');
  return `${year}-${month}-15`;
}

export function getShortYearMonthUTC(date: Date): string {
  return formatInTimeZone(date, 'UTC', 'yyMM');
}
