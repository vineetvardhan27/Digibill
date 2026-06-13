/**
 * Supplier Health Score Calculator
 *
 * Evaluates payment behaviour for a single supplier based on their bill history.
 * Returns a 0-100 score, a letter grade, and a detailed breakdown.
 */

/**
 * @param {import('mongoose').Document[]} bills  — All bills for one supplier
 * @returns {{ score: number, grade: string, breakdown: object }}
 */
export function calculateHealthScore(bills) {
  const now = new Date();

  // ── Classify bills ──────────────────────────────────────────────────────
  const totalBills = bills.length;

  if (totalBills === 0) {
    return {
      score: 100,
      grade: 'Excellent',
      breakdown: {
        onTimeRate: 100,
        avgDaysLate: 0,
        recentTrend: 'stable',
        totalBills: 0,
        paidBills: 0,
        overdueBills: 0
      }
    };
  }

  const paidBills = bills.filter(b => b.isPaid);
  const paidCount = paidBills.length;

  // Overdue = still pending AND past dueDate
  const overdueBills = bills.filter(b => {
    if (b.isPaid) return false;
    if (!b.dueDate) return false;
    return new Date(b.dueDate) < now;
  });
  const overdueCount = overdueBills.length;

  // ── On-Time Rate (only among paid bills that have a dueDate) ──────────
  const paidWithDue = paidBills.filter(b => b.dueDate);
  let onTimeCount = 0;
  let totalDaysLate = 0;
  let lateCount = 0;

  for (const bill of paidWithDue) {
    const dueDate = new Date(bill.dueDate);
    const paidDate = bill.paidDate ? new Date(bill.paidDate) : new Date(bill.updatedAt);

    if (paidDate <= dueDate) {
      onTimeCount++;
    } else {
      const daysLate = Math.ceil((paidDate - dueDate) / (1000 * 60 * 60 * 24));
      totalDaysLate += daysLate;
      lateCount++;
    }
  }

  // If no paid bills have a dueDate, treat on-time rate as 100%
  const onTimeRate = paidWithDue.length > 0
    ? (onTimeCount / paidWithDue.length) * 100
    : 100;

  const avgDaysLate = lateCount > 0
    ? Math.round((totalDaysLate / lateCount) * 10) / 10
    : 0;

  // ── Recent Trend (last 3 vs previous 3 paid bills, by date) ───────────
  const sortedPaid = [...paidWithDue].sort(
    (a, b) => new Date(b.paidDate || b.updatedAt) - new Date(a.paidDate || a.updatedAt)
  );

  let recentTrend = 'stable';

  if (sortedPaid.length >= 6) {
    const recent3 = sortedPaid.slice(0, 3);
    const previous3 = sortedPaid.slice(3, 6);

    const avgLateness = (group) => {
      let total = 0;
      for (const bill of group) {
        const dueDate = new Date(bill.dueDate);
        const paidDate = new Date(bill.paidDate || bill.updatedAt);
        const diff = Math.ceil((paidDate - dueDate) / (1000 * 60 * 60 * 24));
        total += diff; // negative = early, positive = late
      }
      return total / group.length;
    };

    const recentAvg = avgLateness(recent3);
    const previousAvg = avgLateness(previous3);

    if (recentAvg < previousAvg - 1) {
      recentTrend = 'improving';
    } else if (recentAvg > previousAvg + 1) {
      recentTrend = 'declining';
    }
  } else if (sortedPaid.length >= 2) {
    // With fewer bills, compare first half vs second half
    const mid = Math.floor(sortedPaid.length / 2);
    const recentHalf = sortedPaid.slice(0, mid);
    const olderHalf = sortedPaid.slice(mid);

    const onTimePercent = (group) => {
      let count = 0;
      for (const bill of group) {
        const paidDate = new Date(bill.paidDate || bill.updatedAt);
        if (paidDate <= new Date(bill.dueDate)) count++;
      }
      return count / group.length;
    };

    const recentPct = onTimePercent(recentHalf);
    const olderPct = onTimePercent(olderHalf);

    if (recentPct > olderPct + 0.1) {
      recentTrend = 'improving';
    } else if (recentPct < olderPct - 0.1) {
      recentTrend = 'declining';
    }
  }

  // ── Score Calculation ─────────────────────────────────────────────────
  let score = 100;

  // Penalize late payments (up to 30 points)
  score -= 30 * (1 - onTimeRate / 100);

  // Penalize severity of lateness (up to 30 points)
  score -= Math.min(avgDaysLate * 2, 30);

  // Penalize currently overdue bills (5 per bill)
  score -= overdueCount * 5;

  // Trend adjustment
  if (recentTrend === 'improving') score += 5;
  if (recentTrend === 'declining') score -= 5;

  // Clamp
  score = Math.round(Math.max(0, Math.min(100, score)));

  // ── Grade ─────────────────────────────────────────────────────────────
  let grade;
  if (score >= 80) grade = 'Excellent';
  else if (score >= 65) grade = 'Good';
  else if (score >= 50) grade = 'Fair';
  else if (score >= 35) grade = 'At Risk';
  else grade = 'Critical';

  return {
    score,
    grade,
    breakdown: {
      onTimeRate: Math.round(onTimeRate * 10) / 10,
      avgDaysLate,
      recentTrend,
      totalBills,
      paidBills: paidCount,
      overdueBills: overdueCount
    }
  };
}
