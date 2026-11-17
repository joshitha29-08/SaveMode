
/**
 * Money Helper Functions for SaveMode
 * INR formatting, validation, parsing and calculations.
 */

// Maximum allowed amount: ₹99,99,99,999.99
export const MAX_AMOUNT = 999999999.99;

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const AMOUNT_FORMATTER = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Format currency
// 123456.5 -> ₹1,23,456.50
export function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return "₹0.00";
  return INR_FORMATTER.format(amount);
}

// Format amount without currency symbol
// 123456.5 -> 1,23,456.50
export function formatAmount(amount: number): string {
  if (!Number.isFinite(amount)) return "0.00";
  return AMOUNT_FORMATTER.format(amount);
}

// Format using K, L and Cr
// 1500 -> ₹1.5K
// 150000 -> ₹1.5L
// 15000000 -> ₹1.5Cr
export function formatCompactCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return "₹0.00";

  const absoluteAmount = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (absoluteAmount >= 10000000) {
    return `${sign}₹${compactNumber(absoluteAmount / 10000000)}Cr`;
  }

  if (absoluteAmount >= 100000) {
    return `${sign}₹${compactNumber(absoluteAmount / 100000)}L`;
  }

  if (absoluteAmount >= 1000) {
    return `${sign}₹${compactNumber(absoluteAmount / 1000)}K`;
  }

  return formatCurrency(amount);
}

function compactNumber(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(amount);
}

// Validate amount
export function isValidAmount(amount: number): boolean {
  return (
    Number.isFinite(amount) &&
    amount >= 0 &&
    amount <= MAX_AMOUNT &&
    Math.abs(amount * 100 - Math.round(amount * 100)) < 0.000001
  );
}

// Parse user-entered amount
// Supports:
// 1200
// 1,200.50
// 1,23,456.78
// ₹1,200.50
// Rs. 1,200.50
// INR 1,200.50
export function parseAmount(value: string): number | null {
  if (typeof value !== "string") return null;

  let cleaned = value.trim();

  // Remove supported currency prefixes
  cleaned = cleaned.replace(/^(?:₹|rs\.?|inr)\s*/i, "").trim();

  if (!cleaned) return null;

  // Allow either ungrouped, Western grouping or Indian grouping.
  const validNumber =
    /^\d+(?:\.\d{1,2})?$/.test(cleaned) ||
    /^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?$/.test(cleaned) ||
    /^\d{1,2}(?:,\d{2})*,\d{3}(?:\.\d{1,2})?$/.test(cleaned);

  if (!validNumber) return null;

  const amount = Number(cleaned.replace(/,/g, ""));

  return isValidAmount(amount) ? amount : null;
}

// Calculate remaining balance
export function calculateBalance(
  totalIncome: number,
  totalExpense: number
): number {
  return totalIncome - totalExpense;
}

// Calculate available credit
export function calculateAvailableCredit(
  creditLimit: number,
  outstandingAmount: number
): number {
  return creditLimit - outstandingAmount;
}

// Calculate total transaction amount
export function calculateTotal(amounts: number[]): number {
  return amounts.reduce((total, amount) => total + amount, 0);
}
