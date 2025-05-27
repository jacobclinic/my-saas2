import { addDays, startOfWeek, endOfYear, endOfMonth } from 'date-fns';
import { TimeSlot } from '../classes/types/class-v2';
import { dayMap } from '../constants-v2';
import { parse, format } from 'date-fns';
// export function getNextNOccurrences(timeSlot: TimeSlot, startDate: string, count: number): Date[] {

interface TimeRange {
  startTime: string; // e.g., "2025-05-03T06:13:00Z"
  endTime: string; // e.g., "2025-05-03T06:22:00Z"
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

export function convertTimeRangeToISO(
  timeRange: string,
  date: Date = new Date('2025-05-03'),
): TimeRange {
  try {
    // Validate and split the input (e.g., "6:13 AM - 6:22 AM" -> ["6:13 AM", "6:22 AM"])
    const timeParts = timeRange.split(' - ').map((part) => part.trim());
    if (timeParts.length !== 2) {
      throw new Error('Invalid time range format. Expected "h:mm A - h:mm A"');
    }

    // Parse start and end times
    const start = parse(timeParts[0], 'h:mm a', date);
    const end = parse(timeParts[1], 'h:mm a', date);

    // Validate parsed times
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid time format. Use "h:mm A" (e.g., "6:13 AM")');
    }

    // Convert to ISO 8601 (UTC)
    const startTime = format(start, "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const endTime = format(end, "yyyy-MM-dd'T'HH:mm:ss'Z'");

    return { startTime, endTime };
  } catch (error) {
    console.error(`Failed to convert time range "${timeRange}":`, error);
    throw new Error(`Invalid time range: ${(error as Error).message}`);
  }
}
