
import {
    MIN_YEAR,
    canGoNextMonth,
    canGoPrevMonth,
    daysInMonth,
    formatFullDate,
    formatMonthYear,
    formatRelativeDate,
    isLeapYear,
    isValidTransactionDate,
    nextMonth,
    prevMonth,
} from "./dateHelpers";

describe("Date Helper Functions", () => {
  describe("Leap year calculation", () => {
    test("identifies leap year 2024", () => {
      expect(isLeapYear(2024)).toBe(true);
    });

    test("identifies non-leap year 2023", () => {
      expect(isLeapYear(2023)).toBe(false);
    });

    test("identifies century year 1900 as non-leap", () => {
      expect(isLeapYear(1900)).toBe(false);
    });

    test("identifies century year 2000 as leap", () => {
      expect(isLeapYear(2000)).toBe(true);
    });
  });

  describe("Days in month", () => {
    test("returns 29 days for February in leap year", () => {
      expect(daysInMonth(2024, 1)).toBe(29);
    });

    test("returns 28 days for February in normal year", () => {
      expect(daysInMonth(2023, 1)).toBe(28);
    });

    test("returns 31 days for January", () => {
      expect(daysInMonth(2026, 0)).toBe(31);
    });

    test("returns 30 days for April", () => {
      expect(daysInMonth(2026, 3)).toBe(30);
    });

    test("rejects invalid month", () => {
      expect(() => daysInMonth(2026, 12)).toThrow(RangeError);
      expect(() => daysInMonth(2026, -1)).toThrow(RangeError);
    });

    test("rejects invalid year", () => {
      expect(() => daysInMonth(2026.5, 0)).toThrow(RangeError);
    });
  });

  describe("Transaction date validation", () => {
    const now = new Date(2026, 10, 17, 12, 0, 0);

    test("accepts today's date", () => {
      expect(
        isValidTransactionDate(new Date(2026, 10, 17), now)
      ).toBe(true);
    });

    test("accepts yesterday's date", () => {
      expect(
        isValidTransactionDate(new Date(2026, 10, 16), now)
      ).toBe(true);
    });

    test("accepts tomorrow's date", () => {
      expect(
        isValidTransactionDate(new Date(2026, 10, 18), now)
      ).toBe(true);
    });

    test("rejects dates more than one day ahead", () => {
      expect(
        isValidTransactionDate(new Date(2026, 10, 19), now)
      ).toBe(false);
    });

    test("accepts minimum date", () => {
      expect(
        isValidTransactionDate(new Date(2000, 0, 1), now)
      ).toBe(true);
    });

    test("rejects dates before minimum year", () => {
      expect(
        isValidTransactionDate(new Date(1999, 11, 31), now)
      ).toBe(false);
    });

    test("rejects invalid Date objects", () => {
      expect(
        isValidTransactionDate(new Date("invalid"), now)
      ).toBe(false);
    });

    test("rejects invalid current date", () => {
      expect(
        isValidTransactionDate(new Date(2026, 10, 17), new Date("invalid"))
      ).toBe(false);
    });
  });

  describe("Date formatting", () => {
    test("formats full date correctly", () => {
      expect(formatFullDate(new Date(2026, 9, 4)))
        .toBe("Sun, 04 Oct 2026");
    });

    test("returns Today for current date", () => {
      const now = new Date(2026, 10, 17);

      expect(formatRelativeDate(now, now)).toBe("Today");
    });

    test("returns Yesterday for previous date", () => {
      const now = new Date(2026, 10, 17);
      const yesterday = new Date(2026, 10, 16);

      expect(formatRelativeDate(yesterday, now)).toBe("Yesterday");
    });

    test("returns full date for older dates", () => {
      const now = new Date(2026, 10, 17);
      const olderDate = new Date(2026, 9, 4);

      expect(formatRelativeDate(olderDate, now))
        .toBe("Sun, 04 Oct 2026");
    });

    test("formats month and year", () => {
      expect(formatMonthYear(new Date(2026, 9, 4)))
        .toBe("October 2026");
    });

    test("handles invalid date formatting", () => {
      const invalidDate = new Date("invalid");

      expect(formatFullDate(invalidDate)).toBe("");
      expect(formatMonthYear(invalidDate)).toBe("");
      expect(formatRelativeDate(invalidDate)).toBe("");
    });
  });

  describe("Month navigation", () => {
    const now = new Date(2026, 10, 17);

    test("does not allow previous month before minimum month", () => {
      expect(canGoPrevMonth(MIN_YEAR, 0)).toBe(false);
    });

    test("allows previous month when available", () => {
      expect(canGoPrevMonth(2026, 5)).toBe(true);
    });

    test("allows navigation to an earlier month", () => {
      expect(canGoNextMonth(2026, 9, now)).toBe(true);
    });

    test("does not allow navigation beyond current month", () => {
      expect(canGoNextMonth(2026, 10, now)).toBe(false);
    });

    test("rejects invalid month navigation", () => {
      expect(canGoPrevMonth(2026, 12)).toBe(false);
      expect(canGoNextMonth(2026, -1, now)).toBe(false);
    });

    test("gets previous month correctly", () => {
      expect(prevMonth(2026, 5)).toEqual({
        year: 2026,
        month: 4,
      });
    });

    test("moves January to previous December", () => {
      expect(prevMonth(2001, 0)).toEqual({
        year: 2000,
        month: 11,
      });
    });

    test("does not move before minimum month", () => {
      expect(prevMonth(2000, 0)).toEqual({
        year: 2000,
        month: 0,
      });
    });

    test("gets next month correctly", () => {
      expect(nextMonth(2026, 9, now)).toEqual({
        year: 2026,
        month: 10,
      });
    });

    test("moves December to next January when available", () => {
      const nextYear = new Date(2027, 0, 15);

      expect(nextMonth(2026, 11, nextYear)).toEqual({
        year: 2027,
        month: 0,
      });
    });

    test("does not move beyond current month", () => {
      expect(nextMonth(2026, 10, now)).toEqual({
        year: 2026,
        month: 10,
      });
    });
  });
});
