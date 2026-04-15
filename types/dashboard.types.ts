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
  totalNewProducts?: number;        // BARU: produk baru periode ini

  weeklyData: ChartDataPoint[];

  moneyData?: { label: string; revenue?: number; modal?: number }[];
  unitData?:  { label: string; unitIn?: number; unitOut?: number }[];

  // StockFlowChart — 4 series dalam 1 array
  stockFlowData?: {
    label:      string;
    stockUnit?: number;
    stockVal?:  number;
    outUnit?:   number;
    revenue?:   number;
  }[];

  // BARU: Chart stok masuk — 3 metrik
  stockUnitData?:  ChartDataPoint[]; // jumlah unit masuk per periode
  stockValueData?: ChartDataPoint[]; // nilai rupiah per periode
  stockNewData?:   ChartDataPoint[]; // produk baru ditambahkan per periode

  profitData?: ChartDataPoint[];    // keuntungan/rugi per periode (bisa negatif)

  stockRanking: ProductStat[];
  salesRanking: ProductStat[];

  paymentData?:  { method: string; total: number }[];
  memberStats?: {
    memberTx:    number;
    nonMemberTx: number;
    totalTx:     number;
    memberSpend: number;
    memberRate:  number;
  };

  // NEW: TopCategoryChart
  categoryData?: { category: string; total: number; qty: number }[];

  // NEW: HourlyChart
  hourlyData?: { key: string; label: string; count: number; revenue: number }[];

  // NEW: DailyTarget
  todayRevenue?: number;

  dateRangeLabel?: string;
  userName?: string;
  photoURL?: string | null;
}

// paymentData & memberStats added