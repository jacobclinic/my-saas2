//  Utility functions for handling month selection and formatting
//  Used by both TutorPaymentList and AdminTutorPaymentsView components

export interface MonthOption {
  label: string;
  value: string;
}

// Generates month options for tutor payment filtering
// Returns next month + current month + last 9 months (11 total months)
// Format: "YYYY-MM" for value, "Month YYYY" for label

export function generateMonthOptions(): MonthOption[] {
  const options: MonthOption[] = [];
  const currentDate = new Date();

  // Add next month first
  const nextMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
  );
  const nextPeriod = `${nextMonth.getFullYear()}-${(nextMonth.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`;
  options.push({
    label: formatPeriod(nextPeriod),
    value: nextPeriod,
  });

  // Add current month and last 9 months (total 10 months)
  for (let i = 0; i < 10; i++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
    );
    const period = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`;
    options.push({
      label: formatPeriod(period),
      value: period,
    });
  }

  return options;
}

export function formatPeriod(period: string): string {
  const [year, month] = period.split('-');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[parseInt(month) - 1];
  return `${monthName} ${year}`;
}

export function getCurrentMonthPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`;
}

export function getPreviousMonthPeriod(): string {
  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1);
  return `${previousMonth.getFullYear()}-${(previousMonth.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`;
}

// Converts a period string (YYYY-MM) to just the month name

export function periodToMonthName(period: string): string {
  const [year, month] = period.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long' });
}

// Converts a month name to the appropriate year's period (YYYY-MM)
// Uses smart logic to determine the correct year based on available months

export function monthNameToPeriod(monthName: string): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (June = 5)

  // Find the month number for the given month name
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const monthIndex = monthNames.findIndex((name) => name === monthName);
  if (monthIndex === -1) {
    throw new Error(`Invalid month name: ${monthName}`);
  }

  // Smart year determination based on the available month range:
  // Available months: next month + current month + last 9 months
  // This means we have 11 months total spanning potentially 2 years
  let year = currentYear;

  if (monthIndex === (currentMonth + 1) % 12) {
    // Next month case
    year = currentYear;
  } else if (monthIndex <= currentMonth) {
    // Current month or past months that fit in current year
    year = currentYear;
  } else {
    // Future months beyond next month must be from previous year
    // This handles cases like: current=June, input=August -> August 2024 (previous year)
    year = currentYear - 1;
  }

  // Special handling for months that span across years
  // Calculate how many months back this month would be
  let monthsBack = 0;
  if (monthIndex <= currentMonth) {
    monthsBack = currentMonth - monthIndex;
  } else {
    // Month is after current month, so it must be from previous year
    monthsBack = currentMonth + (12 - monthIndex);
  }

  // If this month is more than 9 months back, it's not in our available range
  // but we'll still calculate it correctly for the previous year
  if (monthsBack > 9 && monthIndex > currentMonth) {
    year = currentYear - 1;
  }

  return `${year}-${(monthIndex + 1).toString().padStart(2, '0')}`;
}
