// Pastikan ada kata kunci export di depan setiap interface
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ChartDataPoint {
  value: number;
  label: string;
}

export interface ProductStat {
  id: string;
  name: string;
  value: number;
}

export interface DashboardStats {
  totalProducts: number;
  totalTransactions: number;
  totalRevenue: number;
  totalExpense: number;
  totalProfit: number;
  lowStockCount: number;
  totalIn: number;
  totalOut: number;
  weeklyData: ChartDataPoint[];
  dateRange?: DateRange;
  stockRanking: ProductStat[];
  salesRanking: ProductStat[];
  // TAMBAHKAN DUA BARIS INI:
  userName?: string;    // Properti nama user
  photoURL?: string | null; // Properti foto user
}