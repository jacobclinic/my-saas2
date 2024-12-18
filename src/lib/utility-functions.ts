import { add, formatISO } from 'date-fns';
import { TIME_SLOT_DAY_OPTIONS } from './classes/constants/class';

export const generateSecurePassword = (length = 12) => {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }

  return password;
};

type SessionInput = {
  day: string; // e.g., "Monday"
  time: string; // e.g., "20:00"
  duration?: string; // duration in minutes, as a string
  recurringPattern: string; // Assuming "weekly" for this use case
};

type SessionOutput = {
  startTime: string; // ISO string
  endTime?: string; // ISO string
};

// Helper function to get the next date for a given day of the week
function getNextDateForDay(day: string): Date {
  const today = new Date();
  const targetDay = TIME_SLOT_DAY_OPTIONS.findIndex(option => option.value === day);
  const currentDay = today.getDay();
  const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7; // Days until next occurrence
  return add(today, { days: daysUntilTarget });
}

// Function to calculate 4 weekly sessions
export function calculateSessionsTimes(input: SessionInput): SessionOutput[] {
  const { day, time, duration } = input;

  // Parse duration string into a number if available
  const durationInMinutes = duration ? parseInt(duration, 10) : null;

  // Determine the start date for the first session
  const firstSessionDate = getNextDateForDay(day);

  // Combine the date and time
  const [hours, minutes] = time.split(':').map(Number);
  firstSessionDate.setHours(hours, minutes, 0, 0);

  // Generate 4 sessions with weekly recurrence
  const sessions: SessionOutput[] = [];
  for (let i = 0; i < 4; i++) {
    const sessionStart = add(firstSessionDate, { weeks: i }); // Add weeks for recurrence

    const session: SessionOutput = {
      startTime: formatISO(sessionStart),
    };

    // Add endTime only if duration is provided
    if (durationInMinutes) {
      session.endTime = formatISO(add(sessionStart, { minutes: durationInMinutes }));
    }

    sessions.push(session);
  }

  return sessions;
}