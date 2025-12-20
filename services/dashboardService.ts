import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { DashboardStats, ChartDataPoint, DateRange } from '../types/dashboard.types';

export class DashboardService {
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
    }).format(amount);
  }

  static async fetchDashboardStats(
    dateRange: DateRange, 
    preset: 'today' | 'week' | 'month' | 'year'
  ): Promise<DashboardStats> {
    try {
      const startTimestamp = Timestamp.fromDate(dateRange.startDate);
      const endTimestamp = Timestamp.fromDate(dateRange.endDate);

      // 1. Total Produk (Static/Global)
      const productsSnap = await getDocs(collection(db, 'products'));
      let lowStockCount = 0;
      productsSnap.forEach(doc => {
        if (Number(doc.data().stock || 0) < 10) lowStockCount++;
      });

      // 2. Stock In (Filtered)
      const inQuery = query(collection(db, 'stock_purchases'), 
        where('date', '>=', startTimestamp), where('date', '<=', endTimestamp));
      const inSnap = await getDocs(inQuery);
      let totalExpense = 0, totalIn = 0;
      inSnap.forEach(doc => {
        totalExpense += Number(doc.data().totalCost || 0);
        totalIn += Number(doc.data().quantity || 0);
      });

      // 3. Transactions (Filtered)
      const outQuery = query(collection(db, 'transactions'), 
        where('date', '>=', startTimestamp), where('date', '<=', endTimestamp));
      const outSnap = await getDocs(outQuery);
      let totalRevenue = 0, totalOut = 0;
      
      // Generate chart data based on preset
      const chartDataMap = this.generateChartDataMap(preset);

      outSnap.forEach(doc => {
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
            data.items.forEach((item: any) => totalOut += Number(item.qty || 0));
          }
        }
      });

      const weeklyData = Array.from(chartDataMap, ([label, value]) => ({ value, label }));

      return {
        totalProducts: productsSnap.size,
        totalTransactions: outSnap.size,
        totalRevenue,
        totalExpense,
        totalProfit: totalRevenue - totalExpense,
        lowStockCount,
        totalIn,
        totalOut,
        weeklyData,
      };
    } catch (error) { 
      throw error; 
    }
  }

  private static generateChartDataMap(preset: 'today' | 'week' | 'month' | 'year'): Map<string, number> {
    const map = new Map<string, number>();

    switch (preset) {
      case 'today':
        // Jam: 6, 9, 12, 15, 18, 21, 24, 3
        ['06', '09', '12', '15', '18', '21', '24', '03'].forEach(hour => {
          map.set(hour, 0);
        });
        break;

      case 'week':
        // Hari: Senin - Minggu
        const daysName = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          map.set(daysName[d.getDay()], 0);
        }
        break;

      case 'month':
        // Minggu: Mg 1, Mg 2, Mg 3, Mg 4
        ['Mg 1', 'Mg 2', 'Mg 3', 'Mg 4'].forEach(week => {
          map.set(week, 0);
        });
        break;

      case 'year':
        // Bulan: Jan - Des
        ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'].forEach(month => {
          map.set(month, 0);
        });
        break;
    }

    return map;
  }

  private static getChartKey(date: Date, preset: 'today' | 'week' | 'month' | 'year'): string {
    switch (preset) {
      case 'today':
        // Group by 3-hour intervals
        const hour = date.getHours();
        if (hour >= 6 && hour < 9) return '06';
        if (hour >= 9 && hour < 12) return '09';
        if (hour >= 12 && hour < 15) return '12';
        if (hour >= 15 && hour < 18) return '15';
        if (hour >= 18 && hour < 21) return '18';
        if (hour >= 21 && hour < 24) return '21';
        if (hour >= 0 && hour < 3) return '24';
        if (hour >= 3 && hour < 6) return '03';
        return '06';

      case 'week':
        const daysName = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        return daysName[date.getDay()];

      case 'month':
        // Week of month (1-4)
        const dayOfMonth = date.getDate();
        if (dayOfMonth <= 7) return 'Mg 1';
        if (dayOfMonth <= 14) return 'Mg 2';
        if (dayOfMonth <= 21) return 'Mg 3';
        return 'Mg 4';

      case 'year':
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return months[date.getMonth()];

      default:
        return '';
    }
  }

  static getPresetDateRange(preset: 'today' | 'week' | 'month' | 'year'): DateRange {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    if (preset === 'week') {
      // Start from Monday of current week
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
    } else if (preset === 'month') {
      // Start from first day of current month
      start.setDate(1);
    } else if (preset === 'year') {
      // Start from January 1st of current year
      start.setMonth(0);
      start.setDate(1);
    }

    return { startDate: start, endDate: end };
  }
}