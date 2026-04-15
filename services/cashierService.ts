import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from './firebaseConfig';
import {
  collection, query, where, getDocs,
  doc, setDoc, updateDoc, getDoc, serverTimestamp,
  orderBy, limit, startAfter, getCountFromServer,
  getFirestore, deleteField,
  QueryDocumentSnapshot, DocumentData, Timestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  ...(process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID && {
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  }),
};

// ── TYPES ─────────────────────────────────────────────────

export type ShiftType = 'pagi' | 'siang' | 'malam' | 'full';

/** Status absensi harian */
export type AttendanceStatus = 'hadir' | 'izin' | 'alpha';

export interface Shift {
  type:      ShiftType;
  startTime: string;   // "07:00"
  endTime:   string;   // "15:00"
  days:      number[]; // 0=Min … 6=Sab
}

export interface Cashier {
  id:          string;
  uid:         string;
  displayName: string;
  email:       string;
  role:        'kasir';
  status:      'active' | 'inactive';
  tenantId:    string;
  storeName:   string;
  phoneNumber: string | null;
  photoURL:    string | null;
  shift:       Shift | null;
  createdAt:   any;
  updatedAt:   any;
}

/**
 * Record absensi satu hari.
 * Disimpan di: tenants/{tenantId}/cashiers/{uid}/attendance/{YYYY-MM-DD}
 */
export interface AttendanceRecord {
  date:        string;           // "2026-03-12"
  status:      AttendanceStatus; // hadir / izin / alpha
  checkIn:     Timestamp | null; // waktu masuk aktual
  checkOut:    Timestamp | null; // waktu keluar aktual
  note:        string;           // keterangan (wajib jika izin)
  recordedBy:  string;           // uid admin atau 'self' jika kasir sendiri
  updatedAt:   Timestamp;
}

/** Ringkasan statistik seorang kasir */
export interface CashierStats {
  totalTransactions: number;
  totalRevenue:      number;
  joinDate:          Timestamp | null; // = createdAt kasir
  attendance: {
    hadir: number;
    izin:  number;
    alpha: number;
    total: number; // hari kerja yang dicatat
  };
}

export interface PaginatedCashiers {
  cashiers:   Cashier[];
  totalCount: number;
  lastDoc:    QueryDocumentSnapshot<DocumentData> | null;
  hasMore:    boolean;
}

// ── CONSTANTS ─────────────────────────────────────────────

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

export const DAY_LABELS   = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
export const DAY_LABELS_FULL = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

/** Kembalikan string "YYYY-MM-DD" dari Date (atau hari ini) */
export const toDateKey = (d: Date = new Date()): string =>
  d.toISOString().slice(0, 10);

// ─────────────────────────────────────────────────────────
// CashierService
// ─────────────────────────────────────────────────────────
export const CashierService = {

  // ══════════════════════════════════════════════════════
  // GET / LIST
  // ══════════════════════════════════════════════════════

  getCashierById: async (tenantId: string, cashierId: string): Promise<Cashier | null> => {
    const snap = await getDoc(doc(db, 'tenants', tenantId, 'cashiers', cashierId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Cashier) : null;
  },

  getCashiersByTenant: async (tenantId: string): Promise<Cashier[]> => {
    const q    = query(
      collection(db, 'tenants', tenantId, 'cashiers'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Cashier));
  },

  getCashiersFirstPage: async (tenantId: string, pageSize = 20): Promise<PaginatedCashiers> => {
    const col       = collection(db, 'tenants', tenantId, 'cashiers');
    const countSnap = await getCountFromServer(col);
    const q         = query(col, orderBy('createdAt', 'desc'), limit(pageSize));
    const snap      = await getDocs(q);
    return {
      cashiers:   snap.docs.map(d => ({ id: d.id, ...d.data() } as Cashier)),
      totalCount: countSnap.data().count,
      lastDoc:    snap.docs.at(-1) ?? null,
      hasMore:    snap.docs.length === pageSize,
    };
  },

  getCashiersNextPage: async (
    tenantId: string,
    lastDoc:  QueryDocumentSnapshot<DocumentData>,
    pageSize = 20
  ): Promise<PaginatedCashiers> => {
    const col       = collection(db, 'tenants', tenantId, 'cashiers');
    const countSnap = await getCountFromServer(col);
    const q         = query(col, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
    const snap      = await getDocs(q);
    return {
      cashiers:   snap.docs.map(d => ({ id: d.id, ...d.data() } as Cashier)),
      totalCount: countSnap.data().count,
      lastDoc:    snap.docs.at(-1) ?? null,
      hasMore:    snap.docs.length === pageSize,
    };
  },

  // ══════════════════════════════════════════════════════
  // REGISTER
  // ══════════════════════════════════════════════════════

  registerCashier: async (cashierData: {
    name: string; email: string; password: string;
    tenantId: string; storeName?: string; shift?: Shift | null;
  }): Promise<{ success: boolean; uid: string }> => {

    const secondaryApp  = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      // Ambil storeName dari config toko jika tidak dikirim
      let storeName = cashierData.storeName || '';
      if (!storeName) {
        try {
          const storeSnap = await getDoc(
            doc(db, 'tenants', cashierData.tenantId, 'config', 'store_profile')
          );
          storeName = storeSnap.exists() ? (storeSnap.data().storeName || '') : '';
        } catch { storeName = ''; }
      }

      const { user } = await createUserWithEmailAndPassword(
        secondaryAuth,
        cashierData.email.trim().toLowerCase(),
        cashierData.password
      );

      const nowTs = Timestamp.now();

      // Payload lengkap untuk /cashiers (data operasional)
      const cashierPayload = {
        uid:         user.uid,
        displayName: cashierData.name.trim(),
        email:       cashierData.email.trim().toLowerCase(),
        role:        'kasir' as const,
        status:      'active' as const,
        tenantId:    cashierData.tenantId,
        storeName,
        phoneNumber: null,
        photoURL:    null,
        shift:       cashierData.shift ?? null,
        createdAt:   nowTs,
        updatedAt:   nowTs,
      };

      // Payload minimal untuk /users (hanya identity & auth — TIDAK ada shift/status/storeName)
      // /users dipakai untuk login & role check saja, bukan data operasional
      const userPayload = {
        uid:         user.uid,
        displayName: cashierData.name.trim(),
        email:       cashierData.email.trim().toLowerCase(),
        role:        'kasir' as const,
        tenantId:    cashierData.tenantId,
        phoneNumber: null,
        photoURL:    null,
        createdAt:   nowTs,
        updatedAt:   nowTs,
      };

      // 1. /cashiers — tulis pakai db admin
      await setDoc(doc(db, 'tenants', cashierData.tenantId, 'cashiers', user.uid), cashierPayload);

      // 2. /users — tulis pakai secondary db (rules: request.auth.uid == userId)
      const secondaryDb = getFirestore(secondaryApp);
      await setDoc(doc(secondaryDb, 'users', user.uid), userPayload);

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

  // ══════════════════════════════════════════════════════
  // UPDATE
  // ══════════════════════════════════════════════════════

  updateShift: async (tenantId: string, cashierId: string, shift: Shift | null): Promise<void> => {
    // Update di /cashiers saja — admin tidak boleh write ke /users/{orang lain}
    await updateDoc(doc(db, 'tenants', tenantId, 'cashiers', cashierId), {
      shift, updatedAt: serverTimestamp(),
    });
  },

  updateStatus: async (tenantId: string, cashierId: string, status: 'active' | 'inactive'): Promise<void> => {
    // Update di /cashiers saja — admin tidak boleh write ke /users/{orang lain}
    await updateDoc(doc(db, 'tenants', tenantId, 'cashiers', cashierId), {
      status, updatedAt: serverTimestamp(),
    });
  },

  // ══════════════════════════════════════════════════════
  // ABSENSI
  // Path: tenants/{tenantId}/cashiers/{uid}/attendance/{YYYY-MM-DD}
  // ══════════════════════════════════════════════════════

  /**
   * Ambil record absensi satu hari (null = belum ada)
   */
  getAttendance: async (
    tenantId: string,
    cashierId: string,
    dateKey: string = toDateKey()
  ): Promise<AttendanceRecord | null> => {
    const ref  = doc(db, 'tenants', tenantId, 'cashiers', cashierId, 'attendance', dateKey);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as AttendanceRecord) : null;
  },

  /**
   * Simpan / update absensi satu hari.
   * Dipanggil oleh admin (dari web) maupun kasir sendiri (check-in mobile).
   */
  saveAttendance: async (
    tenantId:   string,
    cashierId:  string,
    record: Omit<AttendanceRecord, 'updatedAt'>,
  ): Promise<void> => {
    const ref = doc(db, 'tenants', tenantId, 'cashiers', cashierId, 'attendance', record.date);
    await setDoc(ref, { ...record, updatedAt: serverTimestamp() }, { merge: true });
  },

  /**
   * Check-in kasir (update jam masuk saja, status → hadir otomatis)
   */
  checkIn: async (
    tenantId:   string,
    cashierId:  string,
    recordedBy: string,
    dateKey:    string = toDateKey()
  ): Promise<void> => {
    const ref = doc(db, 'tenants', tenantId, 'cashiers', cashierId, 'attendance', dateKey);
    await setDoc(ref, {
      date:       dateKey,
      status:     'hadir',
      checkIn:    serverTimestamp(),
      checkOut:   null,
      note:       '',
      recordedBy,
      updatedAt:  serverTimestamp(),
    }, { merge: true });
  },

  /**
   * Check-out kasir
   * isEarlyLeave = true jika checkout sebelum shift selesai (dicatat untuk admin)
   */
  checkOut: async (
    tenantId:          string,
    cashierId:         string,
    recordedBy:        string,
    isEarlyLeave:      boolean = false,
    earlyLeaveMinutes: number  = 0,
    dateKey:           string  = toDateKey(),
  ): Promise<void> => {
    const ref = doc(db, 'tenants', tenantId, 'cashiers', cashierId, 'attendance', dateKey);
    await setDoc(ref, {
      checkOut:  serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(isEarlyLeave && {
        earlyLeave:        true,
        earlyLeaveMinutes: earlyLeaveMinutes,
      }),
    }, { merge: true });
  },

  /**
   * Ambil history absensi N hari terakhir (default 30)
   */
  getAttendanceHistory: async (
    tenantId:  string,
    cashierId: string,
    days:      number = 30
  ): Promise<AttendanceRecord[]> => {
    const col  = collection(db, 'tenants', tenantId, 'cashiers', cashierId, 'attendance');
    const q    = query(col, orderBy('date', 'desc'), limit(days));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as AttendanceRecord);
  },

  /**
   * Ringkasan absensi bulan ini
   */
  getAttendanceSummary: async (
    tenantId:  string,
    cashierId: string,
    yearMonth: string = toDateKey().slice(0, 7)  // "2026-03"
  ): Promise<{ hadir: number; izin: number; alpha: number }> => {
    const col  = collection(db, 'tenants', tenantId, 'cashiers', cashierId, 'attendance');
    const snap = await getDocs(col);
    const rows = snap.docs
      .map(d => d.data() as AttendanceRecord)
      .filter(r => r.date.startsWith(yearMonth));

    return rows.reduce(
      (acc, r) => { acc[r.status]++; return acc; },
      { hadir: 0, izin: 0, alpha: 0 }
    );
  },

  // ══════════════════════════════════════════════════════
  // STATISTIK TRANSAKSI
  // Hitung dari subcollection transactions yang punya cashierId
  // ══════════════════════════════════════════════════════

  getCashierStats: async (
    tenantId:  string,
    cashierId: string
  ): Promise<CashierStats> => {
    // Ambil data kasir untuk joinDate
    const cashierSnap = await getDoc(doc(db, 'tenants', tenantId, 'cashiers', cashierId));
    const cashierData = cashierSnap.data();

    // Hitung transaksi
    const txQuery = query(
      collection(db, 'tenants', tenantId, 'transactions'),
      where('cashierId', '==', cashierId)
    );
    const txSnap = await getDocs(txQuery);
    const totalTransactions = txSnap.size;
    const totalRevenue = txSnap.docs.reduce((sum, d) => sum + (d.data().total || 0), 0);

    // Ringkasan absensi bulan ini
    const att = await CashierService.getAttendanceSummary(tenantId, cashierId);

    return {
      totalTransactions,
      totalRevenue,
      joinDate: cashierData?.createdAt ?? null,
      attendance: {
        ...att,
        total: att.hadir + att.izin + att.alpha,
      },
    };
  },

  /**
   * Sync dokumen /users/{cashierId} dari data /cashiers (untuk fix data lama yang tidak sinkron)
   * Admin panggil ini jika /users kasir ada data yang salah/kurang
   */
  /**
   * Sync /users dari /cashiers — hanya field identity (bukan operasional).
   * /users tidak perlu shift/status/storeName — itu cukup di /cashiers.
   */
  syncUserDoc: async (tenantId: string, cashierId: string): Promise<void> => {
    const cashierSnap = await getDoc(doc(db, 'tenants', tenantId, 'cashiers', cashierId));
    if (!cashierSnap.exists()) throw new Error('Kasir tidak ditemukan');
    const data = cashierSnap.data();

    // Ambil storeName terbaru dari config toko
    let storeName = data.storeName || '';
    if (!storeName) {
      try {
        const storeSnap = await getDoc(doc(db, 'tenants', tenantId, 'config', 'store_profile'));
        storeName = storeSnap.exists() ? (storeSnap.data().storeName || '') : '';
      } catch {}
    }

    // Update /cashiers dengan storeName terbaru
    await updateDoc(doc(db, 'tenants', tenantId, 'cashiers', cashierId), {
      storeName, updatedAt: serverTimestamp(),
    });

    // Update /users — hanya field identity, hapus field operasional
    await updateDoc(doc(db, 'users', cashierId), {
      displayName: data.displayName,
      email:       data.email,
      phoneNumber: data.phoneNumber ?? null,
      photoURL:    data.photoURL    ?? null,
      updatedAt:   serverTimestamp(),
      shift:       deleteField(),
      status:      deleteField(),
      storeName:   deleteField(),
    });
  },

  // Helper: kasir aktif hari ini
  getActiveTodayCashiers: async (tenantId: string): Promise<Cashier[]> => {
    const all   = await CashierService.getCashiersByTenant(tenantId);
    const today = new Date().getDay();
    return all.filter(c =>
      c.status === 'active' &&
      (!c.shift || c.shift.days.length === 0 || c.shift.days.includes(today))
    );
  },
};