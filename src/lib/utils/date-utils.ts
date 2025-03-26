import { addDays, startOfWeek, endOfYear, endOfMonth } from 'date-fns';
import { TimeSlot } from '../classes/types/class-v2';
import { dayMap } from '../constants-v2';

// export function getNextNOccurrences(timeSlot: TimeSlot, startDate: string, count: number): Date[] {

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