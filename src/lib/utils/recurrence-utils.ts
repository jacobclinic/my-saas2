import { RRule, Weekday } from 'rrule';
import { TimeSlot } from '../classes/types/class-v2';
import { format } from 'date-fns';

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

function localTimeToUTC(date: Date, timeString: string, timezone: string): Date {
    const dateStr = format(date, 'yyyy-MM-dd');
    const localDateTimeStr = `${dateStr}T${timeString}`;
    const utcDate = new Date(`${localDateTimeStr}Z`);
    const targetDate = new Date(localDateTimeStr);
    const utcTime = new Date(targetDate.toLocaleString('en-US', { timeZone: 'UTC' }));
    const targetTime = new Date(targetDate.toLocaleString('en-US', { timeZone: timezone }));
    const offset = targetTime.getTime() - utcTime.getTime();
    return new Date(utcDate.getTime() - offset);
}

export function generateWeeklyOccurrences(data: RecurrenceInput): RecurrenceOutput {
    try {
        if (!data.timeSlot) {
            throw new Error('Time slot is required');
        }

        if (!data.timeSlot.timezone) {
            throw new Error('Timezone is required');
        }

        const userTimezone = data.timeSlot.timezone;

        const startDateUTC = new Date(data.startDate);
        if (isNaN(startDateUTC.getTime())) {
            throw new Error('Invalid startDate format');
        }

        const rrule = new RRule({
            freq: RRule.WEEKLY,
            byweekday: data.dayOfWeek ? [getDayOfWeek(data.dayOfWeek)] : undefined,
            dtstart: startDateUTC,
            until: new Date(data.endDate)
        });

        const allOccurrences = rrule.all();

        let values = allOccurrences.map((occurrence) => {       
            const utcStart = localTimeToUTC(occurrence, data.timeSlot.startTime, userTimezone);
            const utcEnd = localTimeToUTC(occurrence, data.timeSlot.endTime, userTimezone);

            return {
                startTime: utcStart.toISOString(),
                endTime: utcEnd.toISOString(),
            };
        });
        
        return values;
    } catch (error) {
        console.error('Error generating weekly occurrences:', error);
        throw error;
    }
}