/**
 * useAttendance.ts — hook kasir mobile
 * Check-in/out dibatasi jam shift. Admin tidak bisa trigger dari sini.
 */
import { useState, useEffect, useCallback } from 'react';
import { CashierService, AttendanceRecord, Cashier, toDateKey } from '@services/cashierService';
import { useAuth } from '@hooks/auth/useAuth';

export type CheckInError =
  | 'too_early'    // belum waktunya masuk
  | 'too_late'     // sudah lewat jam shift (telat, tapi masih boleh — warning saja)
  | 'no_shift'     // kasir belum punya jadwal shift
  | 'already_in'   // sudah check-in
  | 'already_out'  // sudah check-out
  | 'not_checked_in'; // mau check-out tapi belum check-in

export interface AttendanceValidation {
  canCheckIn:   boolean;
  canCheckOut:  boolean;
  checkInError?: CheckInError;
  checkOutError?: CheckInError;
  isLate:       boolean;       // check-in setelah jam mulai shift
  isEarly:      boolean;       // check-out sebelum jam selesai shift
  minutesUntilShift: number;   // menit hingga shift mulai (negatif = sudah lewat)
  shiftStartStr: string;       // "07:00"
  shiftEndStr:   string;       // "15:00"
}

/** Parse "HH:MM" → menit dari tengah malam */
const toMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const nowMinutes = () => {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
};

/** Validasi apakah kasir boleh check-in/out berdasarkan shift */
const validateShift = (
  cashier: Cashier | null,
  today: AttendanceRecord | null,
): AttendanceValidation => {
  const noShift: AttendanceValidation = {
    canCheckIn: false, canCheckOut: false,
    checkInError: 'no_shift', isLate: false, isEarly: false,
    minutesUntilShift: 0, shiftStartStr: '—', shiftEndStr: '—',
  };

  if (!cashier?.shift) return noShift;

  const shift      = cashier.shift;
  const startMins  = toMinutes(shift.startTime);
  const endMins    = toMinutes(shift.endTime);
  const now        = nowMinutes();

  // Toleransi: bisa check-in 30 menit sebelum shift & sampai 2 jam setelah mulai
  const EARLY_TOLERANCE = 30;
  const LATE_TOLERANCE  = 120;

  // Untuk shift malam yang melewati tengah malam (endMins < startMins)
  const isMidnightShift = endMins < startMins;

  const minutesUntilShift = startMins - now;
  const tooEarly = minutesUntilShift > EARLY_TOLERANCE;
  const isLate   = now > startMins + LATE_TOLERANCE && !isMidnightShift;
  const isEarly  = !isMidnightShift
    ? now < endMins - 30
    : false; // shift malam: tidak ada cek early checkout

  const alreadyIn  = !!today?.checkIn;
  const alreadyOut = !!today?.checkOut;

  return {
    canCheckIn:   !alreadyIn && !tooEarly,
    canCheckOut:  alreadyIn && !alreadyOut,
    checkInError: alreadyIn ? 'already_in' : tooEarly ? 'too_early' : undefined,
    checkOutError: !alreadyIn ? 'not_checked_in' : alreadyOut ? 'already_out' : undefined,
    isLate,
    isEarly,
    minutesUntilShift,
    shiftStartStr: shift.startTime,
    shiftEndStr:   shift.endTime,
  };
};

export const useAttendance = () => {
  const { user, tenantId } = useAuth();

  const [cashier,       setCashier]       = useState<Cashier | null>(null);
  const [today,         setToday]         = useState<AttendanceRecord | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const dateKey = toDateKey();

  const load = useCallback(async () => {
    if (!user?.uid || !tenantId) { setLoading(false); return; }
    try {
      setLoading(true);
      // Ambil data kasir (untuk shift info) + absensi hari ini paralel
      const cashierDoc = await CashierService.getCashierById(tenantId, user.uid);
      const rec        = await CashierService.getAttendance(tenantId, user.uid, dateKey);
      setCashier(cashierDoc);
      setToday(rec);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, tenantId, dateKey]);

  useEffect(() => { load(); }, [load]);

  const validation = validateShift(cashier, today);

  const checkIn = async () => {
    if (!user?.uid || !tenantId || !validation.canCheckIn) return;
    setActionLoading(true);
    setError(null);
    try {
      await CashierService.checkIn(tenantId, user.uid, 'self');
      await load();
    } catch (e: any) {
      setError('Gagal check-in: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const checkOut = async () => {
    if (!user?.uid || !tenantId || !validation.canCheckOut) return;
    setActionLoading(true);
    setError(null);
    try {
      await CashierService.checkOut(tenantId, user.uid, 'self');
      await load();
    } catch (e: any) {
      setError('Gagal check-out: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const submitIzin = async (note: string) => {
    if (!user?.uid || !tenantId || !note.trim()) return;
    setActionLoading(true);
    try {
      await CashierService.saveAttendance(tenantId, user.uid, {
        date: dateKey, status: 'izin',
        checkIn: null, checkOut: null,
        note: note.trim(), recordedBy: 'self',
      });
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  return {
    cashier, today, loading, actionLoading, error,
    validation,
    hasCheckedIn:  !!today?.checkIn,
    hasCheckedOut: !!today?.checkOut,
    isOnLeave:     today?.status === 'izin',
    isAlpha:       today?.status === 'alpha',
    checkIn, checkOut, submitIzin, reload: load,
    dateKey,
  };
};