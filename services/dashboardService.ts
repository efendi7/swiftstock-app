// services/dashboardService.ts
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { DashboardStats, ChartDataPoint } from '../types/dashboard.types';

export class DashboardService {
  /**
   * Fungsi untuk memformat angka ke mata uang Rupiah
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  static async fetchDashboardStats(): Promise<DashboardStats> {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const last7DaysMap = new Map<string, number>();
      const daysName = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7DaysMap.set(daysName[d.getDay()], 0);
      }

      // 1. Hitung jumlah produk & stok rendah
      const productsSnap = await getDocs(collection(db, 'products'));
      let lowStockCount = 0;
      let inToday = 0;

      productsSnap.forEach(doc => {
        const data = doc.data();
        const stock = Number(data.stock || 0);
        const createdAt = data.createdAt?.toDate();

        if (stock < 10) lowStockCount++;
        if (createdAt && createdAt >= startOfToday) inToday++;
      });

      // 2. 🔥 HITUNG TOTAL PENGELUARAN dari semua pembelian stok
      const stockPurchasesSnap = await getDocs(collection(db, 'stock_purchases'));
      let totalExpense = 0;

      stockPurchasesSnap.forEach(doc => {
        const data = doc.data();
        const totalCost = Number(data.totalCost || 0);
        totalExpense += totalCost;
      });

      // 3. Hitung pendapatan dari transaksi penjualan
      const transactionsSnap = await getDocs(collection(db, 'transactions'));
      let totalRevenue = 0;
      let outToday = 0;

      transactionsSnap.forEach(doc => {
        const data = doc.data();
        const tDate = data.date?.toDate();
        const total = Number(data.total || 0);

        totalRevenue += total;

        // Update chart 7 hari terakhir
        if (tDate) {
          const dayName = daysName[tDate.getDay()];
          if (last7DaysMap.has(dayName)) {
            last7DaysMap.set(dayName, (last7DaysMap.get(dayName) || 0) + total);
          }

          // Hitung barang keluar hari ini
          if (Array.isArray(data.items) && tDate >= startOfToday) {
            data.items.forEach((item: any) => {
              outToday += Number(item.qty || 0);
            });
          }
        }
      });

      const weeklyData: ChartDataPoint[] = Array.from(last7DaysMap, ([label, value]) => ({
        value,
        label,
      }));

      return {
        totalProducts: productsSnap.size,
        totalTransactions: transactionsSnap.size,
        totalRevenue,
        totalExpense, // ✅ Sekarang dari total pembelian stok
        totalProfit: totalRevenue - totalExpense,
        lowStockCount,
        inToday,
        outToday,
        weeklyData,
      };
    } catch (error) {
      console.error("Dashboard Service Error:", error);
      throw error;
    }
  }
}