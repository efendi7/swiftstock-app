import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from './firebaseConfig';
import {
  collection, query, where, getDocs,
  doc, setDoc, updateDoc, serverTimestamp,
  orderBy, limit, startAfter, getCountFromServer,
  QueryDocumentSnapshot, DocumentData,
} from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyAfZ63azjsqeQ2ImPUhuZACgCB1NSdmoW4",
  authDomain: "posreactnativeapp.firebaseapp.com",
  projectId: "posreactnativeapp",
  storageBucket: "posreactnativeapp.firebasestorage.app",
  messagingSenderId: "15853364504",
  appId: "1:15853364504:web:5d51e256a481369a2eea6d",
};

// ── TYPES ─────────────────────────────────────────────────

export type ShiftType = 'pagi' | 'siang' | 'malam' | 'full';

export interface Shift {
  type:      ShiftType;
  startTime: string;   // "07:00"
  endTime:   string;   // "15:00"
  days:      number[]; // 0=Min,1=Sen,...,6=Sab — hari aktif shift ini
}

export interface Cashier {
  id:          string;
  uid:         string;
  displayName: string;
  email:       string;
  role:        'kasir';           // ✅ selalu 'kasir'
  status:      'active' | 'inactive';
  tenantId:    string;
  storeName:   string;
  phoneNumber: string | null;
  photoURL:    string | null;
  shift:       Shift | null;      // null = belum dijadwalkan
  createdAt:   any;
  updatedAt:   any;
}

export interface PaginatedCashiers {
  cashiers:   Cashier[];
  totalCount: number;
  lastDoc:    QueryDocumentSnapshot<DocumentData> | null;
  hasMore:    boolean;
}

export const SHIFT_PRESETS: Record<ShiftType, Omit<Shift, 'days'>> = {
  pagi:  { type: 'pagi',  startTime: '07:00', endTime: '15:00' },
  siang: { type: 'siang', startTime: '15:00', endTime: '22:00' },
  malam: { type: 'malam', startTime: '22:00', endTime: '07:00' },
  full:  { type: 'full',  startTime: '08:00', endTime: '21:00' },
};

export const SHIFT_LABELS: Record<ShiftType, string> = {
  pagi:  'Pagi  (07.00–15.00)',
  siang: 'Siang (15.00–22.00)',
  malam: 'Malam (22.00–07.00)',
  full:  'Full  (08.00–21.00)',
};

export const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// ─────────────────────────────────────────────────────────
// CashierService
// Subcollection: tenants/{tenantId}/cashiers/{uid}
// users/{uid} tetap ada untuk keperluan Auth login
// ─────────────────────────────────────────────────────────
export const CashierService = {

  // ── GET ─────────────────────────────────────────────────

  // ── GET ALL (untuk filter client-side, data kecil) ──────
  getCashiersByTenant: async (tenantId: string): Promise<Cashier[]> => {
    try {
      const q    = query(
        collection(db, 'tenants', tenantId, 'cashiers'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Cashier));
    } catch (error) {
      console.error('Error fetching cashiers:', error);
      throw error;
    }
  },

  // ── PAGINATION — halaman pertama ─────────────────────────
  getCashiersFirstPage: async (
    tenantId: string,
    pageSize = 20
  ): Promise<PaginatedCashiers> => {
    try {
      const col       = collection(db, 'tenants', tenantId, 'cashiers');
      const countSnap = await getCountFromServer(col);
      const q         = query(col, orderBy('createdAt', 'desc'), limit(pageSize));
      const snap      = await getDocs(q);
      return {
        cashiers:   snap.docs.map(d => ({ id: d.id, ...d.data() } as Cashier)),
        totalCount: countSnap.data().count,
        lastDoc:    snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
        hasMore:    snap.docs.length === pageSize,
      };
    } catch (error: any) {
      throw new Error('Gagal memuat kasir: ' + error.message);
    }
  },

  // ── PAGINATION — halaman berikutnya ──────────────────────
  getCashiersNextPage: async (
    tenantId: string,
    lastDoc:  QueryDocumentSnapshot<DocumentData>,
    pageSize = 20
  ): Promise<PaginatedCashiers> => {
    try {
      const col       = collection(db, 'tenants', tenantId, 'cashiers');
      const countSnap = await getCountFromServer(col);
      const q         = query(col, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
      const snap      = await getDocs(q);
      return {
        cashiers:   snap.docs.map(d => ({ id: d.id, ...d.data() } as Cashier)),
        totalCount: countSnap.data().count,
        lastDoc:    snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
        hasMore:    snap.docs.length === pageSize,
      };
    } catch (error: any) {
      throw new Error('Gagal memuat halaman berikutnya: ' + error.message);
    }
  },

  // Filter kasir berdasarkan shift aktif hari ini
  getCashiersByShift: async (tenantId: string, shift: ShiftType): Promise<Cashier[]> => {
    try {
      const all     = await CashierService.getCashiersByTenant(tenantId);
      const today   = new Date().getDay(); // 0=Min
      return all.filter(c =>
        c.shift?.type === shift &&
        (c.shift.days.length === 0 || c.shift.days.includes(today))
      );
    } catch (error) {
      console.error('Error fetching cashiers by shift:', error);
      throw error;
    }
  },

  // ── REGISTER ─────────────────────────────────────────────

  registerCashier: async (cashierData: {
    name:      string;
    email:     string;
    password:  string;
    tenantId:  string;
    storeName: string;
    shift?:    Shift | null;
  }): Promise<{ success: boolean; uid: string }> => {

    const secondaryApp  = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      // 1. Buat akun Firebase Auth
      const { user } = await createUserWithEmailAndPassword(
        secondaryAuth,
        cashierData.email.trim().toLowerCase(),
        cashierData.password
      );

      const payload = {
        uid:         user.uid,
        displayName: cashierData.name.trim(),
        email:       cashierData.email.trim().toLowerCase(),
        role:        'kasir' as const,   // ✅ FIX: 'kasir' bukan 'cashier'
        status:      'active' as const,
        tenantId:    cashierData.tenantId,
        storeName:   cashierData.storeName || '',
        phoneNumber: null,
        photoURL:    null,
        shift:       cashierData.shift ?? null,
        createdAt:   serverTimestamp(),
        updatedAt:   serverTimestamp(),
      };

      // 2. Simpan ke subcollection tenant (pakai uid sebagai doc id)
      await setDoc(
        doc(db, 'tenants', cashierData.tenantId, 'cashiers', user.uid),
        payload
      );

      // 3. Simpan juga ke root users (untuk login useAuth)
      await setDoc(doc(db, 'users', user.uid), payload);

      return { success: true, uid: user.uid };

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') throw new Error('Email ini sudah terdaftar.');
      if (error.code === 'auth/weak-password')        throw new Error('Password minimal 6 karakter.');
      if (error.code === 'auth/invalid-email')        throw new Error('Format email tidak valid.');
      throw new Error(error.message || 'Gagal membuat akun kasir.');
    } finally {
      await deleteApp(secondaryApp);
    }
  },

  // ── UPDATE SHIFT ──────────────────────────────────────────

  updateShift: async (
    tenantId: string,
    cashierId: string,
    shift: Shift | null
  ): Promise<void> => {
    try {
      const payload = { shift, updatedAt: serverTimestamp() };
      // Update di kedua tempat agar konsisten
      await updateDoc(doc(db, 'tenants', tenantId, 'cashiers', cashierId), payload);
      await updateDoc(doc(db, 'users', cashierId), payload);
    } catch (error: any) {
      throw new Error('Gagal update shift: ' + error.message);
    }
  },

  // ── UPDATE STATUS ─────────────────────────────────────────

  updateStatus: async (
    tenantId:  string,
    cashierId: string,
    status:    'active' | 'inactive'
  ): Promise<void> => {
    try {
      const payload = { status, updatedAt: serverTimestamp() };
      await updateDoc(doc(db, 'tenants', tenantId, 'cashiers', cashierId), payload);
      await updateDoc(doc(db, 'users', cashierId), payload);
    } catch (error: any) {
      throw new Error('Gagal update status: ' + error.message);
    }
  },

  // ── HELPER: kasir aktif hari ini ─────────────────────────

  getActiveTodayCashiers: async (tenantId: string): Promise<Cashier[]> => {
    const all   = await CashierService.getCashiersByTenant(tenantId);
    const today = new Date().getDay();
    return all.filter(c =>
      c.status === 'active' &&
      (!c.shift || c.shift.days.length === 0 || c.shift.days.includes(today))
    );
  },
};