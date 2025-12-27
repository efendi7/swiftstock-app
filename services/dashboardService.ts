import { 
  collection, 
  getDocs, 
  query, 
  where, 
  Timestamp, 
  limit, 
  orderBy,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { DashboardStats, ProductStat, DateRange } from '../types/dashboard.types';

export class DashboardService {
  /**
   * Fetch riwayat aktivitas terbaru untuk dashboard (preview)
   * @deprecated Gunakan subscribeToRecentActivities untuk real-time updates
   */
  static async fetchRecentActivities(limitCount: number = 5) {
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

  /**
   * Subscribe ke aktivitas terbaru secara REAL-TIME
   * @param limitCount - Jumlah aktivitas yang akan diambil
   * @param callback - Fungsi yang dipanggil saat ada perubahan data
   * @returns Unsubscribe function untuk membatalkan listener
   */
  static subscribeToRecentActivities(
    limitCount: number = 5,
    callback: (activities: any[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'activities'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    // Real-time listener
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const activities = snapshot.docs.map(doc => {
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
        callback(activities);
      },
      (error) => {
        console.error("Error listening to activities:", error);
        callback([]);
      }
    );

    return unsubscribe;
  }

  /**
   * Fetch aktivitas dengan pagination untuk modal
   * @param pageSize - Jumlah item per halaman
   * @param lastDoc - Dokumen terakhir dari halaman sebelumnya (untuk pagination)
   * @returns Object berisi activities, lastDocument, dan hasMore
   */
  static async fetchActivitiesPaginated(
    pageSize: number = 20,
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null
  ): Promise<{
    activities: any[];
    lastDocument: QueryDocumentSnapshot<DocumentData> | null;
    hasMore: boolean;
  }> {
    try {
      let q = query(
        collection(db, 'activities'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      // Jika ada lastDoc, mulai setelah dokumen tersebut
      if (lastDoc) {
        q = query(
          collection(db, 'activities'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const snap = await getDocs(q);
      
      if (snap.empty) {
        return {
          activities: [],
          lastDocument: null,
          hasMore: false
        };
      }

      const activities = snap.docs.map(doc => {
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

      return {
        activities,
        lastDocument: snap.docs[snap.docs.length - 1],
        hasMore: snap.docs.length === pageSize
      };
    } catch (error) {
      console.error("Error fetching paginated activities:", error);
      return {
        activities: [],
        lastDocument: null,
        hasMore: false
      };
    }
  }

  /**
   * Format waktu relatif (Baru saja, 5m lalu, 2j lalu, dll)
   */
  private static formatRelativeTime(date: Date) {
    if (!date) return 'Baru saja';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}j lalu`;
    
    const diffInDays = Math.floor(diffInSeconds / 86400);
    if (diffInDays === 1) return 'Kemarin';
    if (diffInDays < 7) return `${diffInDays} hari lalu`;
    
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Format tanggal lengkap untuk detail
   */
  static formatFullDate(date: Date): string {
    if (!date) return '';
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Generate label tanggal untuk chart berdasarkan preset
   */
  static getDateRangeLabel(preset: 'today' | 'week' | 'month' | 'year', dateRange: DateRange): string {
    const { startDate, endDate } = dateRange;
    
    if (preset === 'today') {
      // Format: "Senin, 7 Maret 2025"
      return startDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    
    if (preset === 'week') {
      // Format: "07/03/2025 - 14/03/2025"
      const startStr = startDate.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const endStr = endDate.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      return `${startStr} - ${endStr}`;
    }
    
    if (preset === 'month') {
      // Format: "Maret 2025"
      return startDate.toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric'
      });
    }
    
    if (preset === 'year') {
      // Format: "2025"
      return startDate.getFullYear().toString();
    }
    
    return '';
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
      
      // Map untuk menghitung jumlah terjual per produk
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
              
              // Hitung sold per produk
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
        // Tambahkan label tanggal
        dateRangeLabel: this.getDateRangeLabel(preset, dateRange),
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
      // Menggunakan angka bulan 1-12
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].forEach((m) => map.set(m, 0));
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
      // Return nomor bulan (1-12) sebagai string
      return String(date.getMonth() + 1);
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