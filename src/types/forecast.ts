export interface ForecastItem {
  date: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  type: 'confirmed' | 'predicted';
  billId?: string;
}

export interface DailyTotal {
  date: string;
  confirmed: number;
  predicted: number;
  total: number;
}

export interface ForecastResponse {
  items: ForecastItem[];
  totalConfirmed: number;
  totalPredicted: number;
  dailyTotals: DailyTotal[];
}
