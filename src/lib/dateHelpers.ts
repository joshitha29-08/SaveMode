
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

export const MIN_YEAR = 2000;
export const MIN_MONTH = 0;

// Check leap year
export function isLeapYear(year: number): boolean {
  return (
    Number.isInteger(year) &&
    ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)
  );
}

// Get days in a month (0-11)
export function daysInMonth(year: number, month: number): number {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 0 ||
    month > 11
  ) {
    throw new RangeError("Invalid year or month.");
  }

  if (month === 1) {
    return isLeapYear(year) ? 29 : 28;
  }

  return [3, 5, 8, 10].includes(month) ? 30 : 31;
}

// Get start of day
function startOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

// Validate transaction date
// Minimum: 01-Jan-2000
// Maximum: Tomorrow
export function isValidTransactionDate(
  date: Date,
  now: Date = new Date()
): boolean {
  if (
    !(date instanceof Date) ||
    !(now instanceof Date) ||
    !Number.isFinite(date.getTime()) ||
    !Number.isFinite(now.getTime())
  ) {
    return false;
  }

  const selectedDate = startOfDay(date);
  const minimumDate = new Date(MIN_YEAR, MIN_MONTH, 1);

  const maximumDate = startOfDay(now);
  maximumDate.setDate(maximumDate.getDate() + 1);

  return selectedDate >= minimumDate && selectedDate <= maximumDate;
}

// Format: Sun, 04 Oct 2026
export function formatFullDate(date: Date): string {
  if (
    !(date instanceof Date) ||
    !Number.isFinite(date.getTime())
  ) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS[date.getMonth()].slice(0, 3);

  return `${DAYS[date.getDay()]}, ${day} ${month} ${date.getFullYear()}`;
}

// Format Today, Yesterday or full date
export function formatRelativeDate(
  date: Date,
  now: Date = new Date()
): string {
  if (
    !(date instanceof Date) ||
    !(now instanceof Date) ||
    !Number.isFinite(date.getTime()) ||
    !Number.isFinite(now.getTime())
  ) {
    return "";
  }

  const difference = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) /
      86400000
  );

  if (difference === 0) return "Today";
  if (difference === 1) return "Yesterday";

  return formatFullDate(date);
}

// Format month and year
export function formatMonthYear(date: Date): string {
  if (
    !(date instanceof Date) ||
    !Number.isFinite(date.getTime())
  ) {
    return "";
  }

  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// Check previous month navigation
export function canGoPrevMonth(
  year: number,
  month: number
): boolean {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 0 ||
    month > 11
  ) {
    return false;
  }

  return (
    year > MIN_YEAR ||
    (year === MIN_YEAR && month > MIN_MONTH)
  );
}

// Check next month navigation
export function canGoNextMonth(
  year: number,
  month: number,
  now: Date = new Date()
): boolean {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 0 ||
    month > 11 ||
    !(now instanceof Date) ||
    !Number.isFinite(now.getTime())
  ) {
    return false;
  }

  return (
    year < now.getFullYear() ||
    (year === now.getFullYear() && month < now.getMonth())
  );
}

// Get previous month
export function prevMonth(year: number, month: number) {
  if (!canGoPrevMonth(year, month)) {
    return { year, month };
  }

  return month === 0
    ? { year: year - 1, month: 11 }
    : { year, month: month - 1 };
}

// Get next month
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
