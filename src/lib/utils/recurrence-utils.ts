import { RRule, Weekday } from 'rrule';
import { parse } from 'date-fns';
import { toZonedTime, getTimezoneOffset } from 'date-fns-tz';

export type TimeSlot = {
  startTime: string;
  endTime: string;
  timezone?: string;
};

export type RecurrenceInput = {
  startDate: string;
  endDate: string;
  timeSlot: TimeSlot;
  dayOfWeek?: string;
};

type RecurrenceRecord = {
  startTime: string;
  endTime: string;
};

type RecurrenceOutput = RecurrenceRecord[];

function getDayOfWeek(day: string): Weekday {
  switch (day.toLowerCase()) {
    case 'monday':
      return RRule.MO;
    case 'tuesday':
      return RRule.TU;
    case 'wednesday':
      return RRule.WE;
    case 'thursday':
      return RRule.TH;
    case 'friday':
      return RRule.FR;
    case 'saturday':
      return RRule.SA;
    case 'sunday':
      return RRule.SU;
    default:
      throw new Error('Invalid day of week');
  }
}

function userLocalTimeToUTC(timeString: string, timeZone: string, referenceDate: Date = new Date()): Date {
  const dateString = `${referenceDate.toISOString().split('T')[0]} ${timeString}`;
  const localDate = parse(dateString, 'yyyy-MM-dd HH:mm', referenceDate);
  const zonedDate = toZonedTime(localDate, timeZone);
  const offsetMs = getTimezoneOffset(timeZone, zonedDate);
  const utcDate = new Date(zonedDate.getTime() - offsetMs);
  return utcDate;
}

export function generateWeeklyOccurrences(data: RecurrenceInput): RecurrenceOutput {
  try {
    if (!data.timeSlot) {
      throw new Error('Time slot is required');
    }

    const userTimezone = data.timeSlot.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const startDate = new Date(data.startDate);
    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid startDate format');
    }

    const rrule = new RRule({
      freq: RRule.WEEKLY,
      byweekday: data.dayOfWeek ? [getDayOfWeek(data.dayOfWeek)] : undefined,
      dtstart: startDate,
      until: new Date(data.endDate),
    });

    const allOccurrences = rrule.all();
    return allOccurrences.map((occurrence) => {
      const utcStart = userLocalTimeToUTC(data.timeSlot.startTime, userTimezone, occurrence);
      const utcEnd = userLocalTimeToUTC(data.timeSlot.endTime, userTimezone, occurrence);

      return {
        startTime: utcStart.toISOString(),
        endTime: utcEnd.toISOString(),
      };
    });
  } catch (error) {
    console.error('Error generating weekly occurrences:', error);
    throw error;
  }
}