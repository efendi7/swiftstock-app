import { db } from './firebaseConfig';
import {
  collection, query, where, getDocs, orderBy,
  limit, startAfter, getCountFromServer,
  QueryDocumentSnapshot, DocumentData,
  doc, runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { Transaction } from '../types/transaction.type';

// ─────────────────────────────────────────────────────────
// handleCheckoutProcess
// ─────────────────────────────────────────────────────────
export const handleCheckoutProcess = async (
  cart:          any[],
  total:         number,
  user:          any,
  cash:          number,
  change:        number,
  paymentMethod: string,
  tenantId?:     string,
  cashierName?:  string
) => {
  const resolvedTenantId = tenantId || user?.tenantId;
  if (!resolvedTenantId) throw new Error('tenantId tidak ditemukan. Silakan login ulang.');

  const transactionNumber = `TRX-${Date.now()}`;

  try {
    await runTransaction(db, async (trx) => {
      for (const item of cart) {
        const productRef  = doc(db, 'tenants', resolvedTenantId, 'products', item.id);
        const productSnap = await trx.get(productRef);
        if (!productSnap.exists()) throw new Error(`Produk "${item.name}" tidak ditemukan!`);
        const currentStock = productSnap.data().stock;
        if (currentStock < item.qty) throw new Error(`Stok "${item.name}" tidak cukup (sisa: ${currentStock})`);
        trx.update(productRef, {
          stock:     currentStock - item.qty,
          soldCount: (productSnap.data().soldCount || 0) + item.qty,
        });
      }
      const transRef = doc(collection(db, 'tenants', resolvedTenantId, 'transactions'));
      trx.set(transRef, {
        transactionNumber,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, subtotal: i.price * i.qty })),
        total,
        cashPaid:     cash,
        changeAmount: change,
        paymentMethod,
        cashierId:    user.uid,
        cashierName:  cashierName || user.displayName || user.email || '',
        tenantId:     resolvedTenantId,
        date:         serverTimestamp(),
      });
    });
    return { success: true, transactionNumber };
  } catch (error: any) {
    throw new Error(error.message || 'Gagal memproses transaksi');
  }
};

export interface PaginatedTransactions {
  transactions: Transaction[];
  totalCount:   number;
  lastDoc:      QueryDocumentSnapshot<DocumentData> | null;
  hasMore:      boolean;
}

export const TransactionService = {

  // ── HALAMAN PERTAMA ───────────────────────────────────────
  getTransactionsFirstPage: async (
    tenantId:  string,
    pageSize = 20,
    cashierId?: string   // isi jika role kasir (filter by cashier)
  ): Promise<PaginatedTransactions> => {
    try {
      const col       = collection(db, 'tenants', tenantId, 'transactions');
      const countSnap = await getCountFromServer(col);

      const q = cashierId
        ? query(col, where('cashierId', '==', cashierId), orderBy('date', 'desc'), limit(pageSize))
        : query(col, orderBy('date', 'desc'), limit(pageSize));

      const snap = await getDocs(q);
      return {
        transactions: snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)),
        totalCount:   countSnap.data().count,
        lastDoc:      snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
        hasMore:      snap.docs.length === pageSize,
      };
    } catch (error: any) {
      throw new Error('Gagal memuat transaksi: ' + error.message);
    }
  },

  // ── HALAMAN BERIKUTNYA ────────────────────────────────────
  getTransactionsNextPage: async (
    tenantId:  string,
    lastDoc:   QueryDocumentSnapshot<DocumentData>,
    pageSize = 20,
    cashierId?: string
  ): Promise<PaginatedTransactions> => {
    try {
      const col       = collection(db, 'tenants', tenantId, 'transactions');
      const countSnap = await getCountFromServer(col);

      const q = cashierId
        ? query(col, where('cashierId', '==', cashierId), orderBy('date', 'desc'), startAfter(lastDoc), limit(pageSize))
        : query(col, orderBy('date', 'desc'), startAfter(lastDoc), limit(pageSize));

      const snap = await getDocs(q);
      return {
        transactions: snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)),
        totalCount:   countSnap.data().count,
        lastDoc:      snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
        hasMore:      snap.docs.length === pageSize,
      };
    } catch (error: any) {
      throw new Error('Gagal memuat halaman berikutnya: ' + error.message);
    }
  },
};