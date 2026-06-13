export interface HealthBreakdown {
  onTimeRate: number;
  avgDaysLate: number;
  recentTrend: 'improving' | 'stable' | 'declining';
  totalBills: number;
  paidBills: number;
  overdueBills: number;
}

export type HealthGrade = 'Excellent' | 'Good' | 'Fair' | 'At Risk' | 'Critical';

export interface HealthScore {
  score: number;
  grade: HealthGrade;
  breakdown: HealthBreakdown;
}

export interface HealthSummaryItem {
  supplierId: string;
  supplierName: string;
  score: number;
  grade: HealthGrade;
}
