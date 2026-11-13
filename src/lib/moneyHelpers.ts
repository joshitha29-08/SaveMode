

/**
 * Money Helper Functions for SaveMode
 * Handles INR currency formatting and money calculations.
 */

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format an amount as Indian Rupees.
 * Example: 123456.5 -> ₹1,23,456.50
 */
export function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) {
    return "₹0.00";
  }

  return INR_FORMATTER.format(amount);
}

/**
 * Format an amount without the currency symbol.
 * Example: 123456.5 -> 1,23,456.50
 */
export function formatAmount(amount: number): string {
  if (!Number.isFinite(amount)) {
    return "0.00";
  }

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Check whether an amount is valid and non-negative,
 * with a maximum of two decimal places.
 */
export function isValidAmount(amount: number): boolean {
  return (
    Number.isFinite(amount) &&
    amount >= 0 &&
    Math.round(amount * 100) === amount * 100
  );
}

/**
 * Convert a user-entered amount into a number.
 * Supports "1200", "1,200.50" and "₹1,200.50".
 * Returns null when the input is invalid.
 */
export function parseAmount(value: string): number | null {
  const cleanedValue = value.replace(/[₹,\s]/g, "");

  if (cleanedValue === "") {
    return null;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(cleanedValue)) {
    return null;
  }

  const amount = Number(cleanedValue);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return amount;
}

/**
 * Calculate the remaining balance.
 */
export function calculateBalance(
  totalIncome: number,
  totalExpense: number,
): number {
  return totalIncome - totalExpense;
}

/**
 * Calculate the available credit.
 */
export function calculateAvailableCredit(
  creditLimit: number,
  outstandingAmount: number,
): number {
  return creditLimit - outstandingAmount;
}

/**
 * Calculate the total of transaction amounts.
 */
export function calculateTotal(amounts: number[]): number {
  return amounts.reduce((total, amount) => total + amount, 0);
}
