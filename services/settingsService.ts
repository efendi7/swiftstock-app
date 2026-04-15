/**
 * settingsService.ts
 * Semua pengaturan per-tenant: profil toko, member, printer, notifikasi.
 * Types diambil dari @/types/settings.types — single source of truth.
 */

import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import {
  StoreProfile, MemberSettings, PrinterSettings, NotificationSettings,
} from '../types/settings.types';

// ── RE-EXPORT agar import lama tidak perlu diubah ─────────
export type { StoreProfile, MemberSettings, PrinterSettings, NotificationSettings };

// ── DEFAULTS ─────────────────────────────────────────────
export const DEFAULT_STORE_PROFILE: StoreProfile = {
  storeName: '', ownerName: '', address: '',
  phone: '', email: '', logoUrl: '', city: '', postalCode: '',
  logoShape:    'square',
  logoPosition: 'left',
  logoAlign:    'flex-start',
};

export const DEFAULT_MEMBER_SETTINGS: MemberSettings = {
  membershipModel:      'opt-in',
  autoUpgradeThreshold: 5,
  // Conditional model
  conditionalLogic:     'OR',
  minVisits:            3,
  minTotalSpend:        100000,
  conditionalFee:        0,
  conditionalFeeEnabled: false,
  // Poin & redeem
  pointsPerRupiah:      1000,
  redeemRate:           100,
  minRedeem:            0,
  // Redeem restrictions
  minRedeemPoin:        0,
  redeemCooldown:       'none' as const,
  // Tier
  useCustomTiers:       false,
};

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  receiptHeader:  '',
  receiptFooter:  'Terima kasih telah berbelanja!',
  showLogo:       true,
  showAddress:    true,
  showPhone:      true,
  paperSize:      '80mm',
  printCopies:    1,
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  lowStockAlert:      true,
  lowStockThreshold:  10,
  dailyReportEnabled: false,
  dailyReportTime:    '08:00',
};

// ── SERVICE ───────────────────────────────────────────────
export const SettingsService = {

  // ── STORE PROFILE ──────────────────────────────────────
  getStoreProfile: async (tenantId: string): Promise<StoreProfile> => {
    try {
      const snap = await getDoc(doc(db, 'tenants', tenantId, 'config', 'store_profile'));
      if (!snap.exists()) return DEFAULT_STORE_PROFILE;
      return { ...DEFAULT_STORE_PROFILE, ...snap.data() } as StoreProfile;
    } catch { return DEFAULT_STORE_PROFILE; }
  },

  saveStoreProfile: async (tenantId: string, data: Partial<StoreProfile>): Promise<void> => {
    const ref     = doc(db, 'tenants', tenantId, 'config', 'store_profile');
    const snap    = await getDoc(ref);
    const payload = { ...data, updatedAt: serverTimestamp() };
    snap.exists()
      ? await updateDoc(ref, payload)
      : await setDoc(ref, { ...DEFAULT_STORE_PROFILE, ...payload });
    if (data.storeName) {
      await updateDoc(doc(db, 'tenants', tenantId), { storeName: data.storeName, updatedAt: serverTimestamp() });
    }
  },

  // ── MEMBER SETTINGS ────────────────────────────────────
  getMemberSettings: async (tenantId: string): Promise<MemberSettings> => {
    try {
      const snap = await getDoc(doc(db, 'tenants', tenantId, 'config', 'member_settings'));
      if (!snap.exists()) return DEFAULT_MEMBER_SETTINGS;
      return { ...DEFAULT_MEMBER_SETTINGS, ...snap.data() } as MemberSettings;
    } catch { return DEFAULT_MEMBER_SETTINGS; }
  },

  saveMemberSettings: async (tenantId: string, data: Partial<MemberSettings>): Promise<void> => {
    const ref     = doc(db, 'tenants', tenantId, 'config', 'member_settings');
    const snap    = await getDoc(ref);
    const payload = { ...data, updatedAt: serverTimestamp() };
    snap.exists()
      ? await updateDoc(ref, payload)
      : await setDoc(ref, { ...DEFAULT_MEMBER_SETTINGS, ...payload });
  },

  // ── PRINTER SETTINGS ───────────────────────────────────
  getPrinterSettings: async (tenantId: string): Promise<PrinterSettings> => {
    try {
      const snap = await getDoc(doc(db, 'tenants', tenantId, 'config', 'printer_settings'));
      if (!snap.exists()) return DEFAULT_PRINTER_SETTINGS;
      return { ...DEFAULT_PRINTER_SETTINGS, ...snap.data() } as PrinterSettings;
    } catch { return DEFAULT_PRINTER_SETTINGS; }
  },

  savePrinterSettings: async (tenantId: string, data: Partial<PrinterSettings>): Promise<void> => {
    const ref     = doc(db, 'tenants', tenantId, 'config', 'printer_settings');
    const snap    = await getDoc(ref);
    const payload = { ...data, updatedAt: serverTimestamp() };
    snap.exists()
      ? await updateDoc(ref, payload)
      : await setDoc(ref, { ...DEFAULT_PRINTER_SETTINGS, ...payload });
  },

  // ── NOTIFICATION SETTINGS ──────────────────────────────
  getNotificationSettings: async (tenantId: string): Promise<NotificationSettings> => {
    try {
      const snap = await getDoc(doc(db, 'tenants', tenantId, 'config', 'notification_settings'));
      if (!snap.exists()) return DEFAULT_NOTIFICATION_SETTINGS;
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...snap.data() } as NotificationSettings;
    } catch { return DEFAULT_NOTIFICATION_SETTINGS; }
  },

  saveNotificationSettings: async (tenantId: string, data: Partial<NotificationSettings>): Promise<void> => {
    const ref     = doc(db, 'tenants', tenantId, 'config', 'notification_settings');
    const snap    = await getDoc(ref);
    const payload = { ...data, updatedAt: serverTimestamp() };
    snap.exists()
      ? await updateDoc(ref, payload)
      : await setDoc(ref, { ...DEFAULT_NOTIFICATION_SETTINGS, ...payload });
  },


  // ── ATTENDANCE SETTINGS ───────────────────────────────
  getAttendanceSettings: async (tenantId: string): Promise<{
    lateToleranceMinutes: number;
    earlyLeaveToleranceMinutes: number;
    checkInWindowBefore: number;
    checkInWindowAfter: number;
    autoAlphaEnabled: boolean;
    autoAlphaAfterMinutes: number;
  } | null> => {
    try {
      const snap = await getDoc(doc(db, 'tenants', tenantId, 'config', 'attendance_settings'));
      return snap.exists() ? snap.data() as any : null;
    } catch { return null; }
  },

  saveAttendanceSettings: async (tenantId: string, settings: {
    lateToleranceMinutes: number;
    earlyLeaveToleranceMinutes: number;
    checkInWindowBefore: number;
    checkInWindowAfter: number;
    autoAlphaEnabled: boolean;
    autoAlphaAfterMinutes: number;
  }): Promise<void> => {
    const ref = doc(db, 'tenants', tenantId, 'config', 'attendance_settings');
    await setDoc(ref, { ...settings, updatedAt: serverTimestamp() }, { merge: true });
  },
  // ── LOAD ALL SEKALIGUS ─────────────────────────────────
  getAllSettings: async (tenantId: string) => {
    const [store, member, printer, notification] = await Promise.all([
      SettingsService.getStoreProfile(tenantId),
      SettingsService.getMemberSettings(tenantId),
      SettingsService.getPrinterSettings(tenantId),
      SettingsService.getNotificationSettings(tenantId),
    ]);
    return { store, member, printer, notification };
  },
};