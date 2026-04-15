/**
 * attendanceService.ts
 * Service terpisah untuk semua operasi absensi.
 * Pisah dari cashierService agar lebih modular.
 */
import {
  doc, getDoc, setDoc, getDocs, collection,
  query, orderBy, limit, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@services/firebaseConfig';
import { Shift } from '@services/cashierService';

// Default toleransi jika belum ada config
export const DEFAULT_LATE_TOLERANCE    = 5;  // menit
export const DEFAULT_EARLY_TOLERANCE   = 5;  // menit

/** Ambil AttendanceSettings dari Firestore, return default jika belum ada */
export const getAttendanceConfig = async (tenantId: string): Promise<{
  lateToleranceMinutes: number;
  earlyLeaveToleranceMinutes: number;
  checkInWindowBefore: number;
  checkInWindowAfter: number;
}> => {
  try {
    const ref  = doc(db, 'tenants', tenantId, 'config', 'attendance_settings');
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data() as any;
  } catch {}
  return {
    lateToleranceMinutes:       DEFAULT_LATE_TOLERANCE,
    earlyLeaveToleranceMinutes: DEFAULT_EARLY_TOLERANCE,
    checkInWindowBefore:        30,
    checkInWindowAfter:         120,
  };
};

// ── Types ──────────────────────────────────────────────────

export type AttendanceStatus = 'hadir' | 'izin' | 'alpha';

export interface AttendanceRecord {
  date:              string;            // "YYYY-MM-DD"
  status:            AttendanceStatus;
  checkIn:           Timestamp | null;
  checkOut:          Timestamp | null;
  note:              string;
  recordedBy:        string;            // uid atau 'self'
  updatedAt?:        Timestamp;

  // Pulang awal
  earlyLeave?:        boolean;
  earlyLeaveMinutes?: number;           // menit kekurangan

  // Kalkulasi (disimpan saat checkout agar mudah dibaca)
  workedMinutes?:     number;           // aktual waktu kerja
  shortMinutes?:      number;           // kekurangan dari durasi shift
}

export interface DayAnalysis {
  dateKey:       string;
  isShiftDay:    boolean;    // sesuai shift kasir
  isWeekend:     boolean;
  isFuture:      boolean;
  isToday:       boolean;
  record?:       AttendanceRecord;
  shiftStart?:   string;     // "07:00"
  shiftEnd?:     string;     // "15:00"
  shiftDuration: number;     // menit durasi shift
  workedMinutes: number;     // aktual
  shortMinutes:  number;     // kekurangan (positif = kurang)
}

// ── Helpers ────────────────────────────────────────────────

export const toDateKey = (d?: Date) => {
  const date = d ?? new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const toMins = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Tentukan apakah hari ini adalah hari shift kasir.
 * shift.days kosong = semua hari aktif.
 * shift.days[0] = 0 (Minggu) ... 6 (Sabtu) — sesuai JS getDay()
 */
export const isShiftDay = (shift: Shift | null | undefined, date: Date): boolean => {
  if (!shift) return false;
  if (!shift.days || shift.days.length === 0) return true; // semua hari
  return shift.days.includes(date.getDay());
};

/**
 * Hitung durasi shift dalam menit.
 * Handle shift malam (endTime < startTime).
 */
export const shiftDurationMinutes = (shift: Shift): number => {
  const start = toMins(shift.startTime);
  const end   = toMins(shift.endTime);
  return end > start ? end - start : (1440 - start) + end;
};

/**
 * Analisis satu hari: apakah hari shift, ada record, berapa kekurangan jam.
 */
export const analyzeDays = (
  yearMonth:            string,
  shift:                Shift | null | undefined,
  records:              AttendanceRecord[],
  lateToleranceMins:    number = DEFAULT_LATE_TOLERANCE,
  earlyToleranceMins:   number = DEFAULT_EARLY_TOLERANCE,
): DayAnalysis[] => {
  const [y, m] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const today       = new Date();

  const recMap: Record<string, AttendanceRecord> = {};
  records.forEach(r => { recMap[r.date] = r; });

  const shiftDur = shift ? shiftDurationMinutes(shift) : 0;

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day     = i + 1;
    const date    = new Date(y, m - 1, day);
    const dateKey = toDateKey(date);
    const dow     = date.getDay();
    const isWknd  = dow === 0 || dow === 6;
    const isFut   = date > today;
    const isToday = (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth()    === today.getMonth() &&
      date.getDate()     === today.getDate()
    );
    const shiftDay = isShiftDay(shift, date);
    const record   = recMap[dateKey];

    // Hitung menit kerja aktual
    let workedMinutes = 0;
    if (record?.checkIn && record.checkOut) {
      workedMinutes = Math.max(0, Math.floor(
        (record.checkOut.toDate().getTime() - record.checkIn.toDate().getTime()) / 60000
      ));
    }

    // Kekurangan jam dengan toleransi
    // shortMinutes hanya dihitung jika melewati batas toleransi
    let shortMinutes = 0;
    if (shiftDay && record?.status === 'hadir' && record.checkOut) {
      const rawShort = Math.max(0, shiftDur - workedMinutes);
      shortMinutes = rawShort > lateToleranceMins ? rawShort : 0;
    }

    return {
      dateKey,
      isShiftDay: shiftDay,
      isWeekend:  isWknd,
      isFuture:   isFut,
      isToday,
      record,
      shiftStart:    shift?.startTime,
      shiftEnd:      shift?.endTime,
      shiftDuration: shiftDur,
      workedMinutes,
      shortMinutes,
    };
  });
};

// ── Service ────────────────────────────────────────────────

export const AttendanceService = {

  getRecord: async (
    tenantId:  string,
    cashierId: string,
    dateKey:   string,
  ): Promise<AttendanceRecord | null> => {
    const ref  = doc(db, 'tenants', tenantId, 'cashiers', cashierId, 'attendance', dateKey);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as AttendanceRecord) : null;
  },

  saveRecord: async (
    tenantId:  string,
    cashierId: string,
    record: Omit<AttendanceRecord, 'updatedAt'>,
  ): Promise<void> => {
    const ref = doc(db, 'tenants', tenantId, 'cashiers', cashierId, 'attendance', record.date);
    await setDoc(ref, { ...record, updatedAt: serverTimestamp() }, { merge: true });
  },

  checkIn: async (
    tenantId:   string,
    cashierId:  string,
    recordedBy: string,
    dateKey:    string = toDateKey(),
  ): Promise<void> => {
    const ref = doc(db, 'tenants', tenantId, 'cashiers', cashierId, 'attendance', dateKey);
    await setDoc(ref, {
      date: dateKey, status: 'hadir',
      checkIn: serverTimestamp(), checkOut: null,
      note: '', recordedBy,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  },

  checkOut: async (
    tenantId:          string,
    cashierId:         string,
    recordedBy:        string,
    shift?:            Shift | null,
    dateKey:           string = toDateKey(),
    earlyTolerance:    number = DEFAULT_EARLY_TOLERANCE,
  ): Promise<void> => {
    const ref = doc(db, 'tenants', tenantId, 'cashiers', cashierId, 'attendance', dateKey);

    // Ambil checkIn untuk hitung worked + short minutes
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data() as AttendanceRecord : null;

    let workedMinutes = 0;
    let shortMinutes  = 0;
    let earlyLeave    = false;
    let earlyLeaveMinutes = 0;

    const now = new Date();
    if (existing?.checkIn) {
      workedMinutes = Math.max(0, Math.floor(
        (now.getTime() - existing.checkIn.toDate().getTime()) / 60000
      ));
    }

    if (shift) {
      const dur = shiftDurationMinutes(shift);
      shortMinutes = Math.max(0, dur - workedMinutes);
      const nowMins   = now.getHours() * 60 + now.getMinutes();
      const endMins   = toMins(shift.endTime);
      const rawEarly   = endMins - nowMins;
      earlyLeave        = rawEarly > earlyTolerance;      // hanya jika melewati toleransi
      earlyLeaveMinutes = earlyLeave ? rawEarly : 0;
    }

    await setDoc(ref, {
      checkOut:     serverTimestamp(),
      updatedAt:    serverTimestamp(),
      workedMinutes,
      shortMinutes,
      ...(earlyLeave && { earlyLeave: true, earlyLeaveMinutes }),
    }, { merge: true });
  },

  getHistory: async (
    tenantId:  string,
    cashierId: string,
    days:      number = 90,
  ): Promise<AttendanceRecord[]> => {
    const col  = collection(db, 'tenants', tenantId, 'cashiers', cashierId, 'attendance');
    const q    = query(col, orderBy('date', 'desc'), limit(days));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as AttendanceRecord);
  },

  /**
   * Reset absensi hari ini — hapus checkIn/checkOut, kembalikan ke belum absen.
   * Hanya admin yang boleh memanggil ini (dijaga di Firestore rules).
   * Kasir bisa check-in ulang setelah di-reset.
   */
  resetAttendance: async (
    tenantId:   string,
    cashierId:  string,
    dateKey:    string = toDateKey(),
    resetBy:    string = 'admin',
  ): Promise<void> => {
    const ref = doc(db, 'tenants', tenantId, 'cashiers', cashierId, 'attendance', dateKey);
    // Hapus dokumen sepenuhnya agar kasir bisa check-in fresh
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(ref);
  },

  /**
   * Koreksi status saja tanpa hapus jam (misal: ubah alpha → izin + tambah alasan)
   */
  correctStatus: async (
    tenantId:   string,
    cashierId:  string,
    status:     AttendanceStatus,
    note:       string,
    correctedBy:string,
    dateKey:    string = toDateKey(),
  ): Promise<void> => {
    const ref = doc(db, 'tenants', tenantId, 'cashiers', cashierId, 'attendance', dateKey);
    await setDoc(ref, {
      status,
      note,
      recordedBy:  correctedBy,
      updatedAt:   serverTimestamp(),
    }, { merge: true });
  },

  getSummary: async (
    tenantId:  string,
    cashierId: string,
    yearMonth: string,
  ): Promise<{ hadir: number; izin: number; alpha: number; shortMinutesTotal: number }> => {
    const all = await AttendanceService.getHistory(tenantId, cashierId, 365);
    const filtered = all.filter(r => r.date.startsWith(yearMonth));
    return filtered.reduce(
      (acc, r) => {
        acc[r.status]++;
        acc.shortMinutesTotal += r.shortMinutes ?? 0;
        return acc;
      },
      { hadir: 0, izin: 0, alpha: 0, shortMinutesTotal: 0 }
    );
  },
};