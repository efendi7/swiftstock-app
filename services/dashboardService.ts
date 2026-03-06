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
  Unsubscribe,
  writeBatch,
  doc
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { DashboardStats, ProductStat, DateRange } from '../types/dashboard.types';

export class DashboardService {

  static async fetchRecentActivities(tenantId: string, limitCount: number = 5) {
    try {
      const q = query(
        collection(db, 'tenants', tenantId, 'activities'),
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

  static subscribeToRecentActivities(
    tenantId: string,
    limitCount: number = 5,
    callback: (activities: any[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'tenants', tenantId, 'activities'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    return onSnapshot(q,
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
  }

  static async fetchActivitiesPaginated(
    tenantId: string,
    pageSize: number = 20,
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null
  ): Promise<{
    activities: any[];
    lastDocument: QueryDocumentSnapshot<DocumentData> | null;
    hasMore: boolean;
  }> {
    try {
      let q = query(
        collection(db, 'tenants', tenantId, 'activities'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
      if (lastDoc) {
        q = query(
          collection(db, 'tenants', tenantId, 'activities'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }
      const snap = await getDocs(q);
      if (snap.empty) return { activities: [], lastDocument: null, hasMore: false };

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
      return { activities: [], lastDocument: null, hasMore: false };
    }
  }

  public static formatRelativeTime(date: Date) {
    if (!date) return 'Baru saja';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}j lalu`;
    const diffInDays = Math.floor(diffInSeconds / 86400);
    if (diffInDays === 1) return 'Kemarin';
    if (diffInDays < 7) return `${diffInDays} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  static formatFullDate(date: Date): string {
    if (!date) return '';
    return date.toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long',
      year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  static getDateRangeLabel(preset: 'today' | 'week' | 'month' | 'year', dateRange: DateRange): string {
    const { startDate, endDate } = dateRange;
    if (preset === 'today') {
      return startDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (preset === 'week') {
      const s = startDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const e = endDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${s} - ${e}`;
    }
    if (preset === 'month') return startDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    if (preset === 'year') return startDate.getFullYear().toString();
    return '';
  }

  // ─────────────────────────────────────────────────────────
  // FETCH DASHBOARD STATS — dengan stock purchases chart
  // ─────────────────────────────────────────────────────────
  static async fetchDashboardStats(
    tenantId: string,
    dateRange: DateRange,
    preset: 'today' | 'week' | 'month' | 'year'
  ): Promise<DashboardStats> {
    try {
      const startTimestamp = Timestamp.fromDate(dateRange.startDate);
      const endTimestamp   = Timestamp.fromDate(dateRange.endDate);

      // ── PRODUCTS ────────────────────────────────────────
      const productsSnap = await getDocs(collection(db, 'tenants', tenantId, 'products'));
      let lowStockCount = 0;
      const productsData = productsSnap.docs.map(doc => {
        const data = doc.data();
        const stock    = Number(data.stock    || 0);
        const soldCount= Number(data.soldCount|| 0);
        if (stock < 10) lowStockCount++;
        return { id: doc.id, name: data.name || 'Tanpa Nama', stock, soldCount };
      });

      // ── TRANSACTIONS (chart penjualan) ───────────────────
      const transQ = query(
        collection(db, 'tenants', tenantId, 'transactions'),
        where('date', '>=', startTimestamp),
        where('date', '<=', endTimestamp)
      );
      const transSnap = await getDocs(transQ);

      let totalRevenue = 0;
      let totalOut     = 0;
      const salesChartMap = this.generateChartDataMap(preset);

      transSnap.forEach(doc => {
        const data  = doc.data();
        const total = Number(data.total || 0);
        totalRevenue += total;

        const tDate = data.date?.toDate();
        if (tDate) {
          const key = this.getChartKey(tDate, preset);
          if (salesChartMap.has(key)) salesChartMap.set(key, (salesChartMap.get(key) || 0) + total);
          if (Array.isArray(data.items)) {
            data.items.forEach((item: any) => { totalOut += Number(item.qty || 0); });
          }
        }
      });

      // ── STOCK PURCHASES (chart stok masuk) ───────────────
      const purchaseQ = query(
        collection(db, 'tenants', tenantId, 'stock_purchases'),
        where('date', '>=', startTimestamp),
        where('date', '<=', endTimestamp)
      );
      const purchaseSnap = await getDocs(purchaseQ);

      let totalExpense = 0;
      let totalIn      = 0;
      let totalNewProducts = 0; // produk baru ditambahkan (type TAMBAH)

      // Chart maps untuk 3 metrik stok masuk
      const stockUnitMap  = this.generateChartDataMap(preset); // unit masuk
      const stockValueMap = this.generateChartDataMap(preset); // nilai rupiah
      const stockNewMap   = this.generateChartDataMap(preset); // produk baru

      purchaseSnap.forEach(doc => {
        const data      = doc.data();
        const qty       = Number(data.quantity  || 0);
        const cost      = Number(data.totalCost || 0);
        const isNew     = data.isNewProduct === true;

        totalExpense += cost;
        totalIn      += qty;
        if (isNew) totalNewProducts++;

        const pDate = data.date?.toDate();
        if (pDate) {
          const key = this.getChartKey(pDate, preset);
          if (stockUnitMap.has(key))  stockUnitMap.set(key,  (stockUnitMap.get(key)  || 0) + qty);
          if (stockValueMap.has(key)) stockValueMap.set(key, (stockValueMap.get(key) || 0) + cost);
          if (isNew && stockNewMap.has(key)) stockNewMap.set(key, (stockNewMap.get(key) || 0) + 1);
        }
      });

      // ── RANKINGS ─────────────────────────────────────────
      const stockRanking: ProductStat[] = [...productsData]
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 10)
        .map(p => ({ id: p.id, name: p.name, value: p.stock }));

      const salesRanking: ProductStat[] = [...productsData]
        .filter(p => p.soldCount > 0)
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 10)
        .map(p => ({ id: p.id, name: p.name, value: p.soldCount }));

      return {
        totalProducts:    productsSnap.size,
        totalTransactions:transSnap.size,
        totalRevenue,
        totalExpense,
        totalProfit:      totalRevenue - totalExpense,
        lowStockCount,
        totalIn,
        totalOut,
        totalNewProducts,

        // Chart penjualan (sudah ada sebelumnya)
        weeklyData: Array.from(salesChartMap, ([label, value]) => ({ label, value })),

        // ✅ BARU: Chart stok masuk — 3 metrik
        stockUnitData:  Array.from(stockUnitMap,  ([label, value]) => ({ label, value })),
        stockValueData: Array.from(stockValueMap, ([label, value]) => ({ label, value })),
        stockNewData:   Array.from(stockNewMap,   ([label, value]) => ({ label, value })),

        stockRanking,
        salesRanking,
        dateRangeLabel: this.getDateRangeLabel(preset, dateRange),
      };
    } catch (error) {
      console.error('DashboardService Error:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────
  // TAMBAH: Simpan stock purchase saat admin tambah/update stok
  // Panggil ini dari ProductService.updateProduct atau modal stok masuk
  // ─────────────────────────────────────────────────────────
  static async recordStockPurchase(
    tenantId: string,
    data: {
      productId:     string;
      productName:   string;
      quantity:      number;
      purchasePrice: number;
      isNewProduct?: boolean; // true jika produk baru ditambahkan
      addedBy:       string;
    }
  ): Promise<void> {
    try {
      const ref = doc(collection(db, 'tenants', tenantId, 'stock_purchases'));
      const batch = writeBatch(db);
      batch.set(ref, {
        productId:     data.productId,
        productName:   data.productName,
        quantity:      data.quantity,
        purchasePrice: data.purchasePrice,
        totalCost:     data.quantity * data.purchasePrice,
        isNewProduct:  data.isNewProduct ?? false,
        addedBy:       data.addedBy,
        date:          Timestamp.now(),
        createdAt:     Timestamp.now(),
      });
      await batch.commit();
    } catch (error) {
      console.error('Error recording stock purchase:', error);
    }
  }

  private static generateChartDataMap(preset: string): Map<string, number> {
    const map = new Map<string, number>();
    if (preset === 'today') {
      ['06','09','12','15','18','21','00','03'].forEach(h => map.set(h, 0));
    } else if (preset === 'month') {
      ['Mg 1','Mg 2','Mg 3','Mg 4'].forEach(w => map.set(w, 0));
    } else if (preset === 'year') {
      ['1','2','3','4','5','6','7','8','9','10','11','12'].forEach(m => map.set(m, 0));
    } else {
      ['Sen','Sel','Rab','Kam','Jum','Sab','Min'].forEach(d => map.set(d, 0));
    }
    return map;
  }

  private static getChartKey(date: Date, preset: string): string {
    if (preset === 'today') {
      const h = date.getHours();
      if (h >= 6  && h < 9)  return '06';
      if (h >= 9  && h < 12) return '09';
      if (h >= 12 && h < 15) return '12';
      if (h >= 15 && h < 18) return '15';
      if (h >= 18 && h < 21) return '18';
      if (h >= 21)            return '21';
      if (h >= 0  && h < 3)  return '00';
      return '03';
    }
    if (preset === 'month') {
      const d = date.getDate();
      if (d <= 7)  return 'Mg 1';
      if (d <= 14) return 'Mg 2';
      if (d <= 21) return 'Mg 3';
      return 'Mg 4';
    }
    if (preset === 'year') return String(date.getMonth() + 1);
    return ['Min','Sen','Sel','Rab','Kam','Jum','Sab'][date.getDay()];
  }

  static getPresetDateRange(preset: 'today' | 'week' | 'month' | 'year'): DateRange {
    const end   = new Date(); end.setHours(23, 59, 59, 999);
    const start = new Date(); start.setHours(0, 0, 0, 0);
    if (preset === 'week') {
      const day  = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
    } else if (preset === 'month') {
      start.setDate(1);
    } else if (preset === 'year') {
      start.setMonth(0); start.setDate(1);
    }
    return { startDate: start, endDate: end };
  }

  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(value);
  }

  static async fetchCashierPerformance(tenantId: string) {
    try {
      const usersRef = collection(db, 'users');
      const qUsers   = query(usersRef, where('role', '==', 'kasir'), where('tenantId', '==', tenantId));
      const userSnap = await getDocs(qUsers);

      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

      const transRef = collection(db, 'tenants', tenantId, 'transactions');
      const qTrans   = query(
        transRef,
        where('date', '>=', Timestamp.fromDate(todayStart)),
        where('date', '<=', Timestamp.fromDate(todayEnd))
      );
      const transSnap = await getDocs(qTrans);
      const allTodayTransactions = transSnap.docs.map(d => d.data());

      return userSnap.docs.map(userDoc => {
        const userData  = userDoc.data();
        const userId    = userDoc.id;
        const myTrans   = allTodayTransactions.filter(t => t.cashierId === userId);
        let totalRevenue = 0, totalQty = 0;
        myTrans.forEach(t => {
          totalRevenue += Number(t.total || 0);
          if (t.items) t.items.forEach((item: any) => { totalQty += (item.qty || 0); });
        });
        return {
          id: userId,
          name: userData.displayName || 'Tanpa Nama',
          email: userData.email,
          photoURL: userData.photoURL,
          status: userData.status || 'active',
          todayRevenue: totalRevenue,
          transactionCount: myTrans.length,
          todayOut: totalQty
        };
      });
    } catch (error) {
      console.error("Error Detail:", error);
      return [];
    }
  }

  static async clearAllActivities(tenantId: string) {
    try {
      const activityRef = collection(db, 'tenants', tenantId, 'activities');
      const snapshot    = await getDocs(activityRef);
      if (snapshot.empty) return { success: true, count: 0 };
      const batch = writeBatch(db);
      snapshot.docs.forEach(docSnap => { batch.delete(docSnap.ref); });
      await batch.commit();
      return { success: true, count: snapshot.size };
    } catch (error) {
      console.error("Gagal menghapus aktivitas:", error);
      throw error;
    }
  }
}