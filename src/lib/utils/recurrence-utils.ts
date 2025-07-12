import { datetime, RRule, RRuleSet, rrulestr, Weekday } from 'rrule'
import { TimeSlot } from '../classes/types/class-v2';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

export type RecurrenceInput = {
    startDate: string;
    endDate: string;
    timeSlot: TimeSlot;
    dayOfWeek?: string;
}

type RecurrenceRecord = {
    startTime: string;
    endTime: string;
}

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

export function generateWeeklyOccurrences(data: RecurrenceInput): RecurrenceOutput {
    try {
        if (!data.timeSlot) {
            throw new Error('Time slot is required');
        }

        const userTimezone = data.timeSlot.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

        const [year, month, day] = data.startDate.split('-').map(Number);

        const rrule = new RRule({
            freq: RRule.WEEKLY,
            byweekday: data.dayOfWeek ? [getDayOfWeek(data.dayOfWeek)] : undefined,
            dtstart: new Date(Date.UTC(year, month - 1, day)),
            until: new Date(data.endDate),
        })

        const allOccurrences = rrule.all();
        return allOccurrences.map((occurrence) => {

            // Use your working function for timezone conversion
            const utcStart = userLocalTimeToUTC(data.timeSlot.startTime, userTimezone);
            const utcEnd = userLocalTimeToUTC(data.timeSlot.endTime, userTimezone);

            // Set the correct date for each occurrence
            const startDate = new Date(occurrence);
            startDate.setHours(utcStart.getHours(), utcStart.getMinutes(), 0, 0);
            const endDate = new Date(occurrence);
            endDate.setHours(utcEnd.getHours(), utcEnd.getMinutes(), 0, 0);

            return {
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString()
            };
        });
    } catch (error) {
        console.error('Error generating weekly occurrences:', error);
        throw error;
    }
}

function userLocalTimeToUTC(timeString: string, timeZone: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);

    const dateString = new Date().toLocaleString('en-US', { timeZone });
    const localDate = new Date(dateString);

    localDate.setHours(hours, minutes, 0, 0);

    return new Date(localDate.toISOString());
}