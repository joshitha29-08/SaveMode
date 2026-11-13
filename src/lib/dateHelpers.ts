
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MIN_YEAR = 2000;
export const MIN_MONTH = 0;

// Check whether a year is a leap year
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Get the number of days in a month (month: 0-11)
export function daysInMonth(year: number, month: number): number {
  if (month < 0 || month > 11) {
    throw new RangeError("Month must be between 0 and 11.");
  }

  if (month === 1) {
    return isLeapYear(year) ? 29 : 28;
  }

  return [3, 5, 8, 10].includes(month) ? 30 : 31;
}

// Get the start of a day
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Format date: Sun, 04 Oct 2026
export function formatFullDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS[date.getMonth()].slice(0, 3);

  return `${DAYS[date.getDay()]}, ${day} ${month} ${date.getFullYear()}`;
}

// Format date as Today, Yesterday, or full date
export function formatRelativeDate(
  date: Date,
  now: Date = new Date()
): string {
  const difference = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) /
      86400000
  );

  if (difference === 0) return "Today";
  if (difference === 1) return "Yesterday";

  return formatFullDate(date);
}

// Format month and year: October 2026
export function formatMonthYear(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// Check whether the user can navigate to the previous month
export function canGoPrevMonth(year: number, month: number): boolean {
  return year > MIN_YEAR ||
    (year === MIN_YEAR && month > MIN_MONTH);
}

// Check whether the user can navigate to the next month
export function canGoNextMonth(
  year: number,
  month: number,
  now: Date = new Date()
): boolean {
  return year < now.getFullYear() ||
    (year === now.getFullYear() && month < now.getMonth());
}

// Get the previous month
export function prevMonth(year: number, month: number) {
  if (!canGoPrevMonth(year, month)) {
    return { year, month };
  }

  return month === 0
    ? { year: year - 1, month: 11 }
    : { year, month: month - 1 };
}

// Get the next month
export function nextMonth(
  year: number,
  month: number,
  now: Date = new Date()
) {
  if (!canGoNextMonth(year, month, now)) {
    return { year, month };
  }

  return month === 11
    ? { year: year + 1, month: 0 }
    : { year, month: month + 1 };
}
