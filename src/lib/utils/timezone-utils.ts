import { format } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

/**
 * Gets the user's local timezone identifier (e.g. 'Asia/Colombo', 'America/New_York')
 * @returns The IANA timezone identifier
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Formats a UTC date to the user's local timezone
 * @param date The UTC date to format
 * @param formatStr The format string pattern to use
 * @returns Formatted date string in user's local timezone
 */
export function formatToLocalTime(
  date: Date | string | null,
  formatStr: string = 'hh:mm a',
): string {
  if (!date) return 'N/A';

  const timezone = getUserTimezone();
  const dateObj = date instanceof Date ? date : new Date(date);

  // Handle invalid date
  if (isNaN(dateObj.getTime())) return 'Invalid date';

  try {
    return formatInTimeZone(dateObj, timezone, formatStr);
  } catch (error) {
    console.error('Error formatting date to local time:', error);
    return dateObj.toLocaleTimeString();
  }
}

/**
 * Formats a date range in the user's local timezone
 * @param startDate The UTC start date
 * @param endDate The UTC end date
 * @param dateFormatStr Format string for the date part
 * @param timeFormatStr Format string for the time part
 * @returns Formatted date range string
 */
export function formatDateTimeRange(
  startDate: Date | string | null,
  endDate: Date | string | null,
  dateFormatStr: string = 'EEEE, MMMM d, yyyy',
  timeFormatStr: string = 'h:mm a',
): { formattedDate: string; formattedTime: string } {
  if (!startDate) {
    return { formattedDate: 'N/A', formattedTime: 'N/A' };
  }

  const timezone = getUserTimezone();
  const startDateObj =
    startDate instanceof Date ? startDate : new Date(startDate);

  if (isNaN(startDateObj.getTime())) {
    return { formattedDate: 'Invalid date', formattedTime: 'Invalid time' };
  }

  try {
    const formattedDate = formatInTimeZone(
      startDateObj,
      timezone,
      dateFormatStr,
    );

    let formattedTime = '';
    if (endDate) {
      const endDateObj = endDate instanceof Date ? endDate : new Date(endDate);
      if (!isNaN(endDateObj.getTime())) {
        formattedTime = `${formatInTimeZone(startDateObj, timezone, timeFormatStr)} - ${formatInTimeZone(endDateObj, timezone, timeFormatStr)}`;
      } else {
        formattedTime = formatInTimeZone(startDateObj, timezone, timeFormatStr);
      }
    } else {
      formattedTime = formatInTimeZone(startDateObj, timezone, timeFormatStr);
    }

    return { formattedDate, formattedTime };
  } catch (error) {
    console.error('Error formatting date time range:', error);
    return {
      formattedDate: startDateObj.toLocaleDateString(),
      formattedTime: startDateObj.toLocaleTimeString(),
    };
  }
}

/**
 * Converts a UTC date to the user's local timezone
 * @param date The UTC date to convert
 * @returns Date object adjusted to the user's timezone
 */
export function convertToLocalTime(date: Date | string | null): Date | null {
  if (!date) return null;

  const timezone = getUserTimezone();
  const dateObj = date instanceof Date ? date : new Date(date);

  // Handle invalid date
  if (isNaN(dateObj.getTime())) return null;

  try {
    return toZonedTime(dateObj, timezone);
  } catch (error) {
    console.error('Error converting date to local time:', error);
    return dateObj;
  }
}
