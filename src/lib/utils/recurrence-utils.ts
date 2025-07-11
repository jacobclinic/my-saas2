import { datetime, RRule, RRuleSet, rrulestr } from 'rrule'
import { TimeSlot } from '../classes/types/class-v2';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

export type RecurrenceInput = {
    startDate: string;
    endDate: string;
    timeSlot: TimeSlot;
}

type RecurrenceRecord = {
    startTime: string;
    endTime: string;
}

type RecurrenceOutput = RecurrenceRecord[];

export function generateWeeklyOccurrences(data: RecurrenceInput): RecurrenceOutput {
    try {
        const userTimezone = data.timeSlot.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

        const startDate = new Date(`${data.startDate}T00:00:00`);

        const timezoneOffset = startDate.getTimezoneOffset();

        const rrule = new RRule({
            freq: RRule.WEEKLY,
            dtstart: new Date(data.startDate),
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