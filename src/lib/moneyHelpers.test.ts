
import {
    MAX_AMOUNT,
    calculateAvailableCredit,
    calculateBalance,
    calculateTotal,
    formatAmount,
    formatCompactCurrency,
    formatCurrency,
    isValidAmount,
    parseAmount,
} from "./moneyHelpers";

describe("Money Helper Functions", () => {
  describe("Currency formatting", () => {
    test("formats Indian currency correctly", () => {
      expect(formatCurrency(123456.5)).toBe("₹1,23,456.50");
    });

    test("formats amount without currency symbol", () => {
      expect(formatAmount(123456.5)).toBe("1,23,456.50");
    });

    test("formats thousands using K", () => {
      expect(formatCompactCurrency(1500)).toBe("₹1.5K");
    });

    test("formats lakhs using L", () => {
      expect(formatCompactCurrency(150000)).toBe("₹1.5L");
    });

    test("formats crores using Cr", () => {
      expect(formatCompactCurrency(15000000)).toBe("₹1.5Cr");
    });

    test("formats small amounts normally", () => {
      expect(formatCompactCurrency(999)).toBe("₹999.00");
    });

    test("handles negative compact amounts", () => {
      expect(formatCompactCurrency(-1500)).toBe("-₹1.5K");
    });

    test("handles invalid currency values", () => {
      expect(formatCurrency(Infinity)).toBe("₹0.00");
      expect(formatAmount(NaN)).toBe("0.00");
    });
  });

  describe("Amount validation", () => {
    test("accepts valid amounts", () => {
      expect(isValidAmount(100)).toBe(true);
      expect(isValidAmount(100.50)).toBe(true);
      expect(isValidAmount(MAX_AMOUNT)).toBe(true);
    });

    test("rejects amounts above maximum", () => {
      expect(isValidAmount(MAX_AMOUNT + 0.01)).toBe(false);
    });

    test("rejects negative amounts", () => {
      expect(isValidAmount(-100)).toBe(false);
    });

    test("rejects more than two decimal places", () => {
      expect(isValidAmount(100.123)).toBe(false);
    });

    test("rejects NaN and Infinity", () => {
      expect(isValidAmount(NaN)).toBe(false);
      expect(isValidAmount(Infinity)).toBe(false);
    });

    test("accepts zero", () => {
      expect(isValidAmount(0)).toBe(true);
    });
  });

  describe("Amount parsing", () => {
    test("parses a normal number", () => {
      expect(parseAmount("1200")).toBe(1200);
    });

    test("parses comma-separated amount", () => {
      expect(parseAmount("1,200.50")).toBe(1200.50);
    });

    test("parses Indian comma grouping", () => {
      expect(parseAmount("1,23,456.78")).toBe(123456.78);
    });

    test("parses rupee symbol", () => {
      expect(parseAmount("₹1,200.50")).toBe(1200.50);
    });

    test("parses Rs. prefix", () => {
      expect(parseAmount("Rs. 1,200.50")).toBe(1200.50);
    });

    test("parses Rs prefix without period", () => {
      expect(parseAmount("Rs 1200")).toBe(1200);
    });

    test("parses INR prefix", () => {
      expect(parseAmount("INR 1,200.50")).toBe(1200.50);
    });

    test("supports case-insensitive INR", () => {
      expect(parseAmount("inr 1200")).toBe(1200);
    });

    test("parses maximum allowed amount", () => {
      expect(parseAmount("99,99,99,999.99")).toBe(MAX_AMOUNT);
    });

    test("rejects empty input", () => {
      expect(parseAmount("")).toBeNull();
      expect(parseAmount("   ")).toBeNull();
    });

    test("rejects invalid comma grouping", () => {
      expect(parseAmount("1,2,00")).toBeNull();
      expect(parseAmount("1,,200")).toBeNull();
      expect(parseAmount("1234,567")).toBeNull();
    });

    test("rejects more than two decimal places", () => {
      expect(parseAmount("1200.123")).toBeNull();
    });

    test("rejects negative amounts", () => {
      expect(parseAmount("-1200")).toBeNull();
    });

    test("rejects values above maximum", () => {
      expect(parseAmount("1000000000")).toBeNull();
    });

    test("rejects alphabetic input", () => {
      expect(parseAmount("abc")).toBeNull();
    });

    test("rejects invalid currency text", () => {
      expect(parseAmount("₹")).toBeNull();
      expect(parseAmount("1200 INR")).toBeNull();
    });
  });

  describe("Calculations", () => {
    test("calculates remaining balance", () => {
      expect(calculateBalance(10000, 3000)).toBe(7000);
    });

    test("supports negative balance", () => {
      expect(calculateBalance(2000, 3000)).toBe(-1000);
    });

    test("calculates available credit", () => {
      expect(calculateAvailableCredit(50000, 10000)).toBe(40000);
    });

    test("calculates total transaction amount", () => {
      expect(calculateTotal([100, 200, 300])).toBe(600);
    });

    test("returns zero for an empty transaction list", () => {
      expect(calculateTotal([])).toBe(0);
    });
  });
});
