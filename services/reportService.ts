import {
  collection, query, getDocs, orderBy,
  limit, startAfter, getCountFromServer,
  QueryDocumentSnapshot, DocumentData, Timestamp, where,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { PaginatedStockHistory, StockHistoryItem } from '../types/report.types';

export const ReportService = {
  /**
   * Mengambil riwayat stok (Stock History) dengan pagination dan filter tanggal opsional.
   * @param tenantId ID Tenant
   * @param pageSize jumlah data per halaman
   * @param startDate filter tanggal awal (opsional)
   * @param endDate filter tanggal akhir (opsional)
   * @param lastDoc document cursor untuk pagination
   */
  async getStockHistory(
    tenantId: string,
    pageSize = 20,
    startDate?: Date | null,
    endDate?: Date | null,
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null,
  ): Promise<PaginatedStockHistory> {
    try {
      const col = collection(db, 'tenants', tenantId, 'stock_history');
      const constraints: any[] = [];

      // Filter by date range if provided
      if (startDate) {
        constraints.push(where('date', '>=', Timestamp.fromDate(startDate)));
      }
      if (endDate) {
        // Tambahkan ke akhir hari (23:59:59) agar inklusif
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        constraints.push(where('date', '<=', Timestamp.fromDate(endOfDay)));
      }

      // Order by date desc
      constraints.push(orderBy('date', 'desc'));

      // Pagination cursor
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      // Limit
      constraints.push(limit(pageSize));

      const q = query(col, ...constraints);

      // Hitung total document (opsional, jika difilter maka hitung dari query tanpa limit/startAfter)
      // Note: getCountFromServer dengan where yang complex kadang perlu index composite
      const countConstraints = [...constraints];
      // Hapus limit dan startAfter untuk menghitung total keseluruhan dengan filter yg sama
      const countFilter = countConstraints.filter(c => c.type !== 'startAfter' && c.type !== 'limit');
      
      const [countSnap, snap] = await Promise.all([
        startDate || endDate 
           ? getCountFromServer(query(col, ...countFilter)) 
           : getCountFromServer(col),
        getDocs(q),
      ]);

      return this.buildPaginatedResult(snap, countSnap.data().count, pageSize);
    } catch (e: any) {
      console.error("Error fetching stock history:", e);
      throw new Error('Gagal memuat riwayat stok: ' + e.message);
    }
  },

  buildPaginatedResult(
    snap: QuerySnapshot<DocumentData>,
    totalCount: number,
    pageSize: number,
  ): PaginatedStockHistory {
    return {
      data: snap.docs.map(d => ({ id: d.id, ...d.data() } as StockHistoryItem)),
      totalCount,
      lastDoc: snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
      hasMore: snap.docs.length === pageSize,
    };
  }
};
