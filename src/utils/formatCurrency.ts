/** Round to 2 decimal places (paise) for INR amounts. */
export function roundInrPaise(amount: number): number {
  return Math.round((Number(amount) || 0) * 100) / 100;
}

/**
 * Indian-grouped rupee string with exactly 2 fraction digits.
 * Use for Grand Total (and other totals) so Billing, print, and Invoice list match.
 */
export function formatInrAmount(amount: number): string {
  return roundInrPaise(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
