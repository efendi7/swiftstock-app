import { useState, useCallback } from 'react';
import { auth, db } from '../services/firebaseConfig';
import { collection, getDocs, query, where, Timestamp, orderBy } from 'firebase/firestore';

export interface ChartData {
  value: number;
  label: string;
}

export interface CashierStats {
  todayTransactions: number;
  todayRevenue: number;
  userName: string;
  totalProducts: number;
  itemsOut: number;
  weeklyData: ChartData[];
}

export const useCashierData = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CashierStats>({
    todayTransactions: 0,
    todayRevenue: 0,
    userName: 'Kasir',
    totalProducts: 0,
    itemsOut: 0,
    weeklyData: [],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startTimestamp = Timestamp.fromDate(startOfDay);

      // Ambil 7 hari terakhir (termasuk hari ini)
      const sevenDaysAgo = new Date(startOfDay);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const weeklyTimestamp = Timestamp.fromDate(sevenDaysAgo);

      // 1. Fetch Transaksi Hari Ini
      const qTransToday = query(
        collection(db, 'transactions'),
        where('cashierId', '==', currentUser.uid),
        where('createdAt', '>=', startTimestamp)
      );
      const transSnapshot = await getDocs(qTransToday);
      
      let revenue = 0;
      transSnapshot.forEach((doc) => {
        revenue += doc.data().total || 0;
      });

      // 2. Fetch Data Mingguan (Hanya milik kasir ini)
      const qWeekly = query(
        collection(db, 'transactions'),
        where('cashierId', '==', currentUser.uid),
        where('createdAt', '>=', weeklyTimestamp),
        orderBy('createdAt', 'asc')
      );
      const weeklySnapshot = await getDocs(qWeekly);

      // --- PERBAIKAN LOGIKA MAPPING CHART ---
      const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      
      // Buat array struktur 7 hari terakhir dengan urutan yang benar
      const chartMap = new Map();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(startOfDay);
        d.setDate(d.getDate() - i);
        const dayLabel = days[d.getDay()];
        chartMap.set(dayLabel, 0); // Gunakan Map agar urutan terjaga
      }

      // Isi data dari snapshot
      weeklySnapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.createdAt.toDate();
        const dayLabel = days[date.getDay()];
        if (chartMap.has(dayLabel)) {
          chartMap.set(dayLabel, chartMap.get(dayLabel) + (data.total || 0));
        }
      });

      // Ubah Map menjadi array format ChartData
      const formattedWeeklyData: ChartData[] = Array.from(chartMap, ([label, value]) => ({
        label,
        value,
      }));

      // 3. Fetch Total Produk
      const productSnapshot = await getDocs(collection(db, 'products'));

      // 4. Fetch Log Stok Keluar (Hari Ini)
      const qLogs = query(
        collection(db, 'stockLogs'),
        where('type', '==', 'out'),
        where('createdAt', '>=', startTimestamp)
      );
      const logsSnapshot = await getDocs(qLogs);

      setStats({
        todayTransactions: transSnapshot.size,
        todayRevenue: revenue,
        userName: currentUser.displayName || 'Kasir',
        totalProducts: productSnapshot.size,
        itemsOut: logsSnapshot.size,
        weeklyData: formattedWeeklyData,
      });
    } catch (error) {
      console.error('Error fetching cashier data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, stats, refreshData: fetchData };
};