/**
 * Supplier Health Score Calculator
 * Computes a 0–100 health score based on real bill data:
 *   - Overdue ratio (40% weight)   — fewer overdue bills = higher score
 *   - Avg payment delay (25%)      — faster payments = higher score
 *   - Total spend volume (15%)     — higher spend = higher score (capped)
 *   - Payment consistency (20%)    — more paid bills = higher score
 */

/**
 * Computes a supplier health score.
 * @param {object} params
 * @param {number} params.totalBills        — Total number of bills
 * @param {number} params.paidBills         — Number of fully paid bills
 * @param {number} params.overdueBills      — Number of overdue bills
 * @param {number} params.avgPaymentDays    — Average days between bill date and payment
 * @param {number} params.totalSpend        — Total amount spent (₹)
 * @returns {number} Health score between 0 and 100
 */
export function computeHealthScore({
  totalBills = 0,
  paidBills = 0,
  overdueBills = 0,
  avgPaymentDays = 0,
  totalSpend = 0,
}) {
  if (totalBills === 0) return 50; // Default for new suppliers

  // 1. Overdue ratio score (40%) — 0 overdue = 100, all overdue = 0
  const overdueRatio = overdueBills / totalBills;
  const overdueScore = Math.max(0, 100 - overdueRatio * 100);

  // 2. Payment delay score (25%) — 0 days = 100, 60+ days = 0
  const delayScore = Math.max(0, 100 - (avgPaymentDays / 60) * 100);

  // 3. Spend volume score (15%) — ₹0 = 0, ₹5,00,000+ = 100
  const spendScore = Math.min(100, (totalSpend / 500000) * 100);

  // 4. Payment consistency (20%) — all paid = 100, none paid = 0
  const consistencyScore = (paidBills / totalBills) * 100;

  // Weighted average
  const score =
    overdueScore * 0.40 +
    delayScore * 0.25 +
    spendScore * 0.15 +
    consistencyScore * 0.20;

  return Math.round(Math.max(0, Math.min(100, score)));
}
