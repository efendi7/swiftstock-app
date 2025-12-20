// ====================================
// 1. types/dashboard.types.ts
// ====================================
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface DashboardStats {
  totalProducts: number;
  totalTransactions: number;
  totalRevenue: number;
  totalExpense: number;
  totalProfit: number;
  lowStockCount: number;
  totalIn: number;  // ✅ Konsisten dengan service
  totalOut: number; // ✅ Konsisten dengan service
  weeklyData: ChartDataPoint[];
  dateRange?: DateRange; // ⚠️ Optional karena initial state
}

export interface ChartDataPoint {
  value: number;
  label: string;
}