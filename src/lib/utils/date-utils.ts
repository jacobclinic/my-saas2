import { addDays, format, parse, startOfWeek } from 'date-fns';
import { TimeSlot } from '../classes/types/class-v2';

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
  
  // Get the day number (0-6, where 0 is Sunday)
  const dayMap: { [key: string]: number } = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6
  };
  
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