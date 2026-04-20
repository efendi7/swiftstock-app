/**
 * transactionService.ts
 *
 * Semua operasi transaksi POS:
 *   - Checkout (dengan atau tanpa member)
 *   - Pagination transaksi (admin lihat semua / kasir filter by cashier)
 *
 * Prinsip: SRP · DRY · tidak ada dynamic import · typed
 *
 * Sebelumnya ada 2 fungsi checkout yang 80% duplikat.
 * Sekarang: 1 fungsi `handleCheckout` dengan parameter opsional member.
 */

import {
  collection, query, where, getDocs, orderBy,
  limit, startAfter, getCountFromServer,
  QueryDocumentSnapshot, DocumentData,
  doc, runTransaction, serverTimestamp,
  WriteBatch, QuerySnapshot,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Transaction } from '../types/transaction.type';
import { TransactionMember } from '../types/member.types';
import { MemberService } from './memberService';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export interface PaginatedTransactions {
  transactions: Transaction[];
  totalCount:   number;
  lastDoc:      QueryDocumentSnapshot<DocumentData> | null;
  hasMore:      boolean;
}

export interface CartItem {
  id:       string;
  name:     string;
  price:    number;
  qty:      number;
}

export interface CheckoutParams {
  cart:           CartItem[];
  subtotal:       number;      // Total sebelum diskon member
  user:           any;
  cash:           number;
  change:         number;
  paymentMethod:  string;
  tenantId:       string;
  cashierName?:   string;
  /** Isi jika ada member aktif. null = walk-in */
  member?:        (TransactionMember & { finalTotal: number }) | null;
}

export interface CheckoutResult {
  success:         boolean;
  transactionNumber: string;
  transactionId:   string;
  total:           number;
}

// ─────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────

/** Serialize cart item untuk disimpan ke Firestore */
const serializeCartItems = (cart: CartItem[]) =>
  cart.map(item => ({
    id:       item.id,
    name:     item.name,
    price:    item.price,
    qty:      item.qty,
    subtotal: item.price * item.qty,
  }));

/** Bangun object member untuk disimpan ke transaksi, atau {} jika walk-in */
const buildMemberPayload = (member: CheckoutParams['member']): Record<string, any> => {
  if (!member) return {};
  return {
    member: {
      memberId:        member.memberId,
      memberName:      member.memberName,
      memberPhone:     member.memberPhone,
      tierName:        member.tierName,
      discountPercent: member.discountPercent,
      discountAmount:  member.discountAmount,
      pointsEarned:    member.pointsEarned,
      pointsRedeemed:  member.pointsRedeemed,
      redeemAmount:    member.redeemAmount,
    },
  };
};

/** Hitung total akhir dari parameter checkout */
const resolveTotal = (params: CheckoutParams): number =>
  params.member ? params.member.finalTotal : params.subtotal;

/** Bangun query transaksi dengan/tanpa filter cashier */
const buildTransactionQuery = (
  col:       ReturnType<typeof collection>,
  pageSize:  number,
  cashierId?: string,
  afterDoc?:  QueryDocumentSnapshot<DocumentData>,
) => {
  const constraints = [
    ...(cashierId ? [where('cashierId', '==', cashierId)] : []),
    orderBy('date', 'desc'),
    ...(afterDoc ? [startAfter(afterDoc)] : []),
    limit(pageSize),
  ];
  return query(col, ...constraints);
};

/** Bangun PaginatedTransactions dari snapshot */
const buildPaginatedResult = (
  snap:       QuerySnapshot<DocumentData>,
  totalCount: number,
  pageSize:   number,
): PaginatedTransactions => ({
  transactions: snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)),
  totalCount,
  lastDoc:      snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
  hasMore:      snap.docs.length === pageSize,
});

// ─────────────────────────────────────────────────────────
// Checkout — fungsi utama (menggantikan 2 fungsi lama)
// ─────────────────────────────────────────────────────────

/**
 * Proses checkout: validasi stok, update stok, simpan transaksi.
 * Jika `params.member` diisi, diskon & poin member ikut disimpan.
 * Semua operasi Firestore berjalan dalam satu atomic transaction.
 */
export const handleCheckout = async (params: CheckoutParams): Promise<CheckoutResult> => {
  const { cart, subtotal, user, cash, change, paymentMethod, tenantId, cashierName, member } = params;

  if (!tenantId) throw new Error('tenantId tidak ditemukan. Silakan login ulang.');

  const total             = resolveTotal(params);
  const transactionNumber = `TRX-${Date.now()}`;
  let   transactionId     = '';

  await runTransaction(db, async (trx) => {
    // 1. Baca semua dokumen produk dulu (Firestore rules: read before write)
    const productRefs  = cart.map(item => doc(db, 'tenants', tenantId, 'products', item.id));
    const productSnaps = await Promise.all(productRefs.map(ref => trx.get(ref)));

    // 2. Validasi stok sebelum menulis
    for (let i = 0; i < cart.length; i++) {
      const snap = productSnaps[i];
      if (!snap.exists()) throw new Error(`Produk "${cart[i].name}" tidak ditemukan!`);
      const currentStock = snap.data().stock;
      if (currentStock < cart[i].qty)
        throw new Error(`Stok "${cart[i].name}" tidak cukup (sisa: ${currentStock})`);
    }

    // 3. Update stok & soldCount tiap produk
    for (let i = 0; i < cart.length; i++) {
      const data = productSnaps[i].data()!;
      trx.update(productRefs[i], {
        stock:     data.stock - cart[i].qty,
        soldCount: (data.soldCount || 0) + cart[i].qty,
      });

      const historyRef = doc(collection(db, 'tenants', tenantId, 'stock_history'));
      trx.set(historyRef, {
        productId: cart[i].id,
        productName: cart[i].name,
        type: 'OUT',
        beforeStock: data.stock,
        afterStock: data.stock - cart[i].qty,
        qtyChange: cart[i].qty,
        reason: 'Transaksi Penjualan',
        reference: transactionNumber,
        date: serverTimestamp(),
        userId: user.uid,
        userName: cashierName || user.displayName || '',
      });
    }

    // 4. Simpan transaksi
    const transRef  = doc(collection(db, 'tenants', tenantId, 'transactions'));
    transactionId   = transRef.id;

    trx.set(transRef, {
      transactionNumber,
      items:         serializeCartItems(cart),
      subtotal,
      total,
      cashPaid:      cash,
      cashAmount:    cash,
      changeAmount:  change,
      paymentMethod,
      cashierId:     user.uid,
      cashierName:   cashierName || user.displayName || '',
      tenantId,
      date:          serverTimestamp(),
      ...buildMemberPayload(member),
    });
  });

  // 5. Update poin member di luar transaction (non-blocking, tidak batalkan checkout jika gagal)
  if (member) {
    MemberService.processCheckoutMember(
      tenantId,
      member.memberId,
      total,
      member.pointsEarned,
      member.pointsRedeemed,
    ).catch(e => console.error('[MemberService] Update poin gagal:', e));
  }

  return { success: true, transactionNumber, transactionId, total };
};

/**
 * @deprecated Gunakan `handleCheckout` — fungsi ini hanya alias untuk backward-compat
 */
export const handleCheckoutProcess = (
  cart: any[], total: number, user: any,
  cash: number, change: number, paymentMethod: string,
  tenantId?: string, cashierName?: string,
) => handleCheckout({
  cart, subtotal: total, user, cash, change,
  paymentMethod, tenantId: tenantId || user?.tenantId || '',
  cashierName,
});

/**
 * @deprecated Gunakan `handleCheckout` dengan `member` param
 */
export const handleCheckoutProcessWithMember = (
  cart: any[], subtotal: number, user: any,
  cash: number, change: number, paymentMethod: string,
  tenantId: string, cashierName?: string,
  memberData?: (TransactionMember & { finalTotal: number }) | null,
  overrideTotal?: number,
) => handleCheckout({
  cart, subtotal, user, cash, change,
  paymentMethod, tenantId, cashierName,
  member: memberData
    ? { ...memberData, finalTotal: overrideTotal ?? memberData.finalTotal }
    : null,
});

// ─────────────────────────────────────────────────────────
// TransactionService — pagination
// ─────────────────────────────────────────────────────────

export const TransactionService = {

  /**
   * Ambil halaman pertama transaksi.
   * @param cashierId  Isi untuk filter transaksi milik kasir tertentu (role kasir).
   */
  async getTransactionsFirstPage(
    tenantId:   string,
    pageSize  = 20,
    cashierId?: string,
  ): Promise<PaginatedTransactions> {
    try {
      const col = collection(db, 'tenants', tenantId, 'transactions');
      const [countSnap, snap] = await Promise.all([
        getCountFromServer(col),
        getDocs(buildTransactionQuery(col, pageSize, cashierId)),
      ]);
      return buildPaginatedResult(snap, countSnap.data().count, pageSize);
    } catch (e: any) {
      throw new Error('Gagal memuat transaksi: ' + e.message);
    }
  },

  /** Ambil halaman berikutnya (cursor-based pagination) */
  async getTransactionsNextPage(
    tenantId:  string,
    lastDoc:   QueryDocumentSnapshot<DocumentData>,
    pageSize = 20,
    cashierId?: string,
  ): Promise<PaginatedTransactions> {
    try {
      const col = collection(db, 'tenants', tenantId, 'transactions');
      const [countSnap, snap] = await Promise.all([
        getCountFromServer(col),
        getDocs(buildTransactionQuery(col, pageSize, cashierId, lastDoc)),
      ]);
      return buildPaginatedResult(snap, countSnap.data().count, pageSize);
    } catch (e: any) {
      throw new Error('Gagal memuat halaman berikutnya: ' + e.message);
    }
  },
};