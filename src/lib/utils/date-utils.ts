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
    timeSlot: TimeSlot, startDate: string, count: number
  ) : {
    startTime: Date, endTime: Date
  }[] {
  // Parse the starting date
  let start = new Date(startDate);
  if (start.getTime() < Date.now()) {
    start = new Date();
  }
  
  const targetDay = dayMap[timeSlot.day.toLowerCase()];
  
  // Find the first occurrence of the day from the start date
  let firstOccurrence = startOfWeek(start);
  firstOccurrence = addDays(firstOccurrence, targetDay);
  if (firstOccurrence < start) {
    firstOccurrence = addDays(firstOccurrence, 7);
  }
  
  // Generate the next N occurrences
  const occurrences: {startTime: Date, endTime: Date}[] = [];
  let currentDate = firstOccurrence;
  
  for (let i = 0; i < count; i++) {
    // Parse the start time from the time slot
    const [startHours, startMinutes] = timeSlot.startTime.split(':').map(Number);
    const dateWithStartTime = new Date(currentDate);
    dateWithStartTime.setHours(startHours, startMinutes, 0, 0);
    
    // Parse the end time from the time slot
    const [endHours, endMinutes] = timeSlot.endTime.split(':').map(Number);
    const dateWithEndTime = new Date(currentDate);
    dateWithEndTime.setHours(endHours, endMinutes, 0, 0);
    
    occurrences.push({
      startTime: dateWithStartTime,
      endTime: dateWithEndTime
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
  if (start.getTime() < Date.now()) {
    start = new Date();
  }

  const targetDay = dayMap[timeSlot.day.toLowerCase()];

  // Find the first occurrence of the day from the start date
  let firstOccurrence = startOfWeek(start);
  firstOccurrence = addDays(firstOccurrence, targetDay);
  if (firstOccurrence < start) {
    firstOccurrence = addDays(firstOccurrence, 7);
  }

  // Get the last date of the current year
  const endOfYearDate = endOfYear(start);

  // Generate occurrences until the end of the year
  const occurrences: { startTime: Date; endTime: Date }[] = [];
  let currentDate = firstOccurrence;

  while (currentDate <= endOfYearDate) {
    // Parse the start time from the time slot
    const [startHours, startMinutes] = timeSlot.startTime
      .split(":")
      .map(Number);
    const dateWithStartTime = new Date(currentDate);
    dateWithStartTime.setHours(startHours, startMinutes, 0, 0);

    // Parse the end time from the time slot
    const [endHours, endMinutes] = timeSlot.endTime.split(":").map(Number);
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
  endDate: string
): { startTime: Date; endTime: Date }[] {
  // Parse the starting date
  let start = new Date(startDate);
  if (start.getTime() < Date.now()) {
    start = new Date();
  }

  const targetDay = dayMap[timeSlot.day.toLowerCase()];

  // Find the first occurrence of the day from the start date
  let firstOccurrence = startOfWeek(start);
  firstOccurrence = addDays(firstOccurrence, targetDay);
  if (firstOccurrence < start) {
    firstOccurrence = addDays(firstOccurrence, 7);
  }

  // Get the last date of the current year
  const end_Date = endDate;

  // Generate occurrences until the end of the year
  const occurrences: { startTime: Date; endTime: Date }[] = [];
  let currentDate = firstOccurrence;

  while (currentDate.toISOString() <= end_Date) {
    // Parse the start time from the time slot
    const [startHours, startMinutes] = timeSlot.startTime
      .split(":")
      .map(Number);
    const dateWithStartTime = new Date(currentDate);
    dateWithStartTime.setHours(startHours, startMinutes, 0, 0);

    // Parse the end time from the time slot
    const [endHours, endMinutes] = timeSlot.endTime.split(":").map(Number);
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

export function getUpcomingOccurrencesForMonth(
  timeSlot: TimeSlot,
  startDate: string
): { startTime: Date; endTime: Date }[] {
  // Parse the starting date
  let start = new Date(startDate);
  if (start.getTime() < Date.now()) {
    start = new Date(); // Use current date if startDate is in the past
  }

  const targetDay = dayMap[timeSlot.day.toLowerCase()];

  // Find the first occurrence of the day from the start date
  let firstOccurrence = startOfWeek(start); // Start of the week (Sunday)
  firstOccurrence = addDays(firstOccurrence, targetDay); // Move to target day
  if (firstOccurrence < start) {
    firstOccurrence = addDays(firstOccurrence, 7); // Move to next week if before start
  }

  // Get the last date of the current month
  const endOfMonthDate = endOfMonth(start);

  // Generate occurrences until the end of the month
  const occurrences: { startTime: Date; endTime: Date }[] = [];
  let currentDate = firstOccurrence;

  while (currentDate <= endOfMonthDate) {
    // Parse the start time from the time slot
    const [startHours, startMinutes] = timeSlot.startTime
      .split(":")
      .map(Number);
    const dateWithStartTime = new Date(currentDate);
    dateWithStartTime.setHours(startHours, startMinutes, 0, 0);

    // Parse the end time from the time slot
    const [endHours, endMinutes] = timeSlot.endTime.split(":").map(Number);
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
        throw new Error(
          'Invalid time range format. Expected "h:mm A - h:mm A"',
        );
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