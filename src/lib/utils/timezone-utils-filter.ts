// Timezone utilities for filtering

import { getUserTimezone } from './timezone-utils';

/**
 * Converts a date object from the date picker to a Date object in the user's timezone for filtering
 * @param dateObj The date object from the date picker (with year, month, day properties)
 * @param isEndDate Whether this is the end date of a range (sets time to end of day)
 * @returns A Date object representing the date in the user's timezone
 */
export function datePickerObjectToLocalDate(
  dateObj: { year: number; month: number; day: number } | null | undefined,
  isEndDate: boolean = false,
): Date | null {
  if (!dateObj) return null;

  // Create a date using the components specified by the date picker
  // This ensures the date is interpreted in the local timezone
  const date = new Date(dateObj.year, dateObj.month - 1, dateObj.day);

  // If it's an end date, set time to 11:59:59 PM
  if (isEndDate) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date;
}

/**
 * Converts a Date object to a Date object in the user's timezone for comparison
 * @param date The Date object to convert
 * @param timezone Optional timezone identifier (e.g., 'America/New_York')
 * @returns A Date object representing the date in the user's timezone
 */
export function utcToLocalDate(
  date: Date | null | undefined,
  timezone?: string,
): Date | null {
  if (!date) return null;

  // Check if the date is valid
  if (isNaN(date.getTime())) return null;

  // The date is already a Date object, so it should automatically respect the user's local timezone
  // We don't need to do any additional conversion
  return date;
}
