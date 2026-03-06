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
  totalNewProducts?: number;        // ✅ BARU: produk baru periode ini

  // Chart penjualan (sudah ada)
  weeklyData: ChartDataPoint[];

  // ✅ BARU: Chart stok masuk — 3 metrik
  stockUnitData?:  ChartDataPoint[]; // jumlah unit masuk per periode
  stockValueData?: ChartDataPoint[]; // nilai rupiah per periode
  stockNewData?:   ChartDataPoint[]; // produk baru ditambahkan per periode

  stockRanking: ProductStat[];
  salesRanking: ProductStat[];
  dateRangeLabel?: string;
  userName?: string;
  photoURL?: string | null;
}