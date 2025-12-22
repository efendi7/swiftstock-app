import { collection, getDocs, query, where, Timestamp, limit, orderBy } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { DashboardStats, ProductStat, DateRange } from '../types/dashboard.types';

export class DashboardService {
  /**
   * Fetch riwayat aktivitas terbaru untuk dashboard
   */
  static async fetchRecentActivities(limitCount: number = 20) {
    try {
      const q = query(
        collection(db, 'activities'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type,
          message: data.message,
          userName: data.userName,
          time: this.formatRelativeTime(data.createdAt?.toDate()),
          createdAt: data.createdAt
        };
      });
    } catch (error) {
      console.error("Error fetching activities:", error);
      return [];
    }
  }

  private static formatRelativeTime(date: Date) {
    if (!date) return 'Baru saja';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}j lalu`;
    return date.toLocaleDateString('id-ID');
  }

  static async fetchDashboardStats(
    dateRange: DateRange,
    preset: 'today' | 'week' | 'month' | 'year'
  ): Promise<DashboardStats> {
    try {
      const startTimestamp = Timestamp.fromDate(dateRange.startDate);
      const endTimestamp = Timestamp.fromDate(dateRange.endDate);

      // --- 1. DATA PRODUK (STOK) ---
      const productsSnap = await getDocs(collection(db, 'products'));
      let lowStockCount = 0;
      const productsData: Array<{ id: string; name: string; stock: number }> = [];

      productsSnap.forEach((doc) => {
        const data = doc.data();
        const stockValue = Number(data.stock || 0);
        
        if (stockValue < 10) lowStockCount++;
        
        productsData.push({
          id: doc.id,
          name: data.name || 'Tanpa Nama',
          stock: stockValue,
        });
      });

      // --- 2. DATA TRANSAKSI (untuk menghitung sold) ---
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('date', '>=', startTimestamp),
        where('date', '<=', endTimestamp)
      );
      const transactionsSnap = await getDocs(transactionsQuery);

      let totalRevenue = 0;
      let totalOut = 0;
      
      // ✅ Map untuk menghitung jumlah terjual per produk (SAMA seperti ProductScreen)
      const soldMap = new Map<string, number>();
      
      // Map untuk nama produk (untuk salesRanking)
      const productNameMap = new Map<string, string>();
      
      const chartDataMap = this.generateChartDataMap(preset);

      transactionsSnap.forEach((doc) => {
        const data = doc.data();
        const total = Number(data.total || 0);
        totalRevenue += total;

        const tDate = data.date?.toDate();
        if (tDate) {
          const key = this.getChartKey(tDate, preset);
          if (chartDataMap.has(key)) {
            chartDataMap.set(key, (chartDataMap.get(key) || 0) + total);
          }

          if (Array.isArray(data.items)) {
            data.items.forEach((item: any) => {
              const qty = Number(item.qty || 0);
              const productId = item.productId;
              
              totalOut += qty;
              
              // ✅ Hitung sold per produk (KONSISTEN dengan ProductScreen)
              if (productId) {
                soldMap.set(productId, (soldMap.get(productId) || 0) + qty);
                productNameMap.set(productId, item.productName || 'Produk Terhapus');
              }
            });
          }
        }
      });

      // --- 3. STOCK RANKING (Urutkan dari stok terkecil) ---
      const stockRanking: ProductStat[] = productsData
        .map(p => ({
          id: p.id,
          name: p.name,
          value: p.stock,
        }))
        .sort((a, b) => a.value - b.value)
        .slice(0, 10);

      // --- 4. SALES RANKING (Produk terlaris berdasarkan transaksi) ---
      const salesRanking: ProductStat[] = Array.from(soldMap, ([id, qty]) => ({
        id,
        name: productNameMap.get(id) || 'Produk Tidak Diketahui',
        value: qty,
      }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      // --- 5. DATA PENGELUARAN ---
      const expenseQuery = query(
        collection(db, 'stock_purchases'),
        where('date', '>=', startTimestamp),
        where('date', '<=', endTimestamp)
      );
      const expenseSnap = await getDocs(expenseQuery);
      
      let totalExpense = 0;
      let totalIn = 0;
      expenseSnap.forEach((doc) => {
        const data = doc.data();
        totalExpense += Number(data.totalCost || 0);
        totalIn += Number(data.quantity || 0);
      });

      return {
        totalProducts: productsSnap.size,
        totalTransactions: transactionsSnap.size,
        totalRevenue,
        totalExpense,
        totalProfit: totalRevenue - totalExpense,
        lowStockCount,
        totalIn,
        totalOut,
        weeklyData: Array.from(chartDataMap, ([label, value]) => ({ label, value })),
        stockRanking,
        salesRanking,
      };
    } catch (error) {
      console.error('DashboardService Error:', error);
      throw error;
    }
  }

  private static generateChartDataMap(preset: string): Map<string, number> {
    const map = new Map<string, number>();
    if (preset === 'today') {
      ['06', '09', '12', '15', '18', '21', '00', '03'].forEach((h) => map.set(h, 0));
    } else if (preset === 'month') {
      ['Mg 1', 'Mg 2', 'Mg 3', 'Mg 4'].forEach((w) => map.set(w, 0));
    } else if (preset === 'year') {
      ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].forEach((m) => map.set(m, 0));
    } else {
      ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].forEach((d) => map.set(d, 0));
    }
    return map;
  }

  private static getChartKey(date: Date, preset: string): string {
    if (preset === 'today') {
      const h = date.getHours();
      if (h >= 6 && h < 9) return '06';
      if (h >= 9 && h < 12) return '09';
      if (h >= 12 && h < 15) return '12';
      if (h >= 15 && h < 18) return '15';
      if (h >= 18 && h < 21) return '18';
      if (h >= 21 || h < 0) return '21';
      if (h >= 0 && h < 3) return '00';
      return '03';
    }
    if (preset === 'month') {
      const d = date.getDate();
      if (d <= 7) return 'Mg 1';
      if (d <= 14) return 'Mg 2';
      if (d <= 21) return 'Mg 3';
      return 'Mg 4';
    }
    if (preset === 'year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return months[date.getMonth()];
    }
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return days[date.getDay()];
  }

  static getPresetDateRange(preset: 'today' | 'week' | 'month' | 'year'): DateRange {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    if (preset === 'week') {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
    } else if (preset === 'month') {
      start.setDate(1);
    } else if (preset === 'year') {
      start.setMonth(0);
      start.setDate(1);
    }
    return { startDate: start, endDate: end };
  }

  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}