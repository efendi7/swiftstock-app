/**
 * memberService.ts
 * CRUD member, cari by HP, hitung tier & poin, config per tenant.
 */

import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, limit, serverTimestamp,
  increment, Timestamp, writeBatch,
  QueryDocumentSnapshot, DocumentData, startAfter, getCountFromServer,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import {
  Member, MemberConfig, MemberSummary, MemberTier,
  TransactionMember, DEFAULT_TIERS, DEFAULT_MEMBER_CONFIG,
} from '../types/member.types';

// ─────────────────────────────────────────────────────────
// CONFIG — global tier & tenant settings
// ─────────────────────────────────────────────────────────
export const MemberConfigService = {

  // Ambil config tenant (dengan fallback ke default)
  getConfig: async (tenantId: string): Promise<MemberConfig> => {
    try {
      const ref  = doc(db, 'tenants', tenantId, 'config', 'member_settings');
      const snap = await getDoc(ref);
      if (!snap.exists()) return DEFAULT_MEMBER_CONFIG;
      return { ...DEFAULT_MEMBER_CONFIG, ...snap.data() } as MemberConfig;
    } catch {
      return DEFAULT_MEMBER_CONFIG;
    }
  },

  // Admin update config tenant
  saveConfig: async (tenantId: string, config: Partial<MemberConfig>): Promise<void> => {
    const ref = doc(db, 'tenants', tenantId, 'config', 'member_settings');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { ...config, updatedAt: serverTimestamp() });
    } else {
      await setDoc(ref, { ...DEFAULT_MEMBER_CONFIG, ...config, updatedAt: serverTimestamp() });
    }
  },

  // Ambil tier yang aktif (custom atau default)
  getActiveTiers: async (tenantId: string): Promise<MemberTier[]> => {
    const config = await MemberConfigService.getConfig(tenantId);
    if (config.useCustomTiers && config.customTiers && config.customTiers.length > 0) {
      return config.customTiers.sort((a, b) => a.minPoin - b.minPoin);
    }
    return DEFAULT_TIERS;
  },
};

// ─────────────────────────────────────────────────────────
// HELPER — hitung tier berdasarkan poin
// ─────────────────────────────────────────────────────────
export const calculateTier = (poin: number, tiers: MemberTier[]): MemberTier => {
  const sorted = [...tiers].sort((a, b) => b.minPoin - a.minPoin);
  return sorted.find(t => poin >= t.minPoin) ?? tiers[0];
};

// Hitung poin yang didapat dari transaksi
export const calculatePointsEarned = (total: number, pointsPerRupiah: number): number => {
  if (!pointsPerRupiah || pointsPerRupiah <= 0) return 0; // guard: jangan bagi nol
  return Math.floor(total / pointsPerRupiah);
};

// Hitung nilai rupiah dari poin yang di-redeem
export const calculateRedeemAmount = (poin: number, redeemRate: number): number => {
  return poin * redeemRate;
};

// Hitung diskon aktif member (override atau tier)
export const getActiveDiscount = (member: Member, tiers: MemberTier[]): number => {
  if (member.discountOverride !== null && member.discountOverride !== undefined) {
    return member.discountOverride;
  }
  const tier = calculateTier(member.poin, tiers);
  return tier.discount;
};

// ─────────────────────────────────────────────────────────
// MEMBER SERVICE — CRUD
// ─────────────────────────────────────────────────────────
export const MemberService = {

  // ── CARI BY NOMOR HP (untuk kasir saat checkout) ─────────
  findByPhone: async (tenantId: string, phone: string): Promise<Member | null> => {
    try {
      const cleaned = phone.replace(/\D/g, ''); // hapus non-digit
      const col   = collection(db, 'tenants', tenantId, 'members');
      const q     = query(col, where('phone', '==', cleaned), limit(1));
      const snap  = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as Member;
    } catch (e) {
      console.error('findByPhone error:', e);
      return null;
    }
  },
  /** Cari member by barcode/QR (field `barcode` atau `id`) */
  findByQR: async (tenantId: string, code: string): Promise<Member | null> => {
    try {
      const col  = collection(db, 'tenants', tenantId, 'members');
      // Coba match by barcode field dulu
      const qBarcode = query(col, where('barcode', '==', code.trim()), limit(1));
      const snapBarcode = await getDocs(qBarcode);
      if (!snapBarcode.empty) return { id: snapBarcode.docs[0].id, ...snapBarcode.docs[0].data() } as Member;
      // Fallback: coba match by document ID
      const docSnap = await getDoc(doc(db, 'tenants', tenantId, 'members', code.trim()));
      if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as Member;
      return null;
    } catch (e) { console.error('findByQR error:', e); return null; }
  },

  /**
   * Search member untuk dropdown — cocok dengan awalan phone atau nama.
   * Dibatasi 8 hasil untuk performa.
   */
  searchForDropdown: async (tenantId: string, query_: string): Promise<Member[]> => {
    if (!query_ || query_.trim().length < 2) return [];
    try {
      const col     = collection(db, 'tenants', tenantId, 'members');
      const trimmed = query_.trim();
      const isPhone = /^\d+$/.test(trimmed);

      if (isPhone) {
        // Search by phone prefix
        const q = query(col,
          where('phone', '>=', trimmed),
          where('phone', '<=', trimmed + '\uf8ff'),
          limit(8),
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Member);
      } else {
        // Search by name prefix (case-sensitive — standard Firestore)
        const q = query(col,
          where('name', '>=', trimmed),
          where('name', '<=', trimmed + '\uf8ff'),
          limit(8),
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Member);
      }
    } catch (e) { console.error('searchForDropdown error:', e); return []; }
  },



  // ── GET DETAIL ────────────────────────────────────────────
  getById: async (tenantId: string, memberId: string): Promise<Member | null> => {
    try {
      const snap = await getDoc(doc(db, 'tenants', tenantId, 'members', memberId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Member;
    } catch {
      return null;
    }
  },

  // ── LIST DENGAN PAGINATION ────────────────────────────────
  getMembersFirstPage: async (tenantId: string, pageSize = 20) => {
    const col       = collection(db, 'tenants', tenantId, 'members');
    const countSnap = await getCountFromServer(col);
    const q         = query(col, orderBy('createdAt', 'desc'), limit(pageSize));
    const snap      = await getDocs(q);
    return {
      members:    snap.docs.map(d => ({ id: d.id, ...d.data() } as Member)),
      totalCount: countSnap.data().count,
      lastDoc:    snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
      hasMore:    snap.docs.length === pageSize,
    };
  },

  getMembersNextPage: async (
    tenantId: string,
    lastDoc:  QueryDocumentSnapshot<DocumentData>,
    pageSize = 20
  ) => {
    const col       = collection(db, 'tenants', tenantId, 'members');
    const countSnap = await getCountFromServer(col);
    const q         = query(col, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
    const snap      = await getDocs(q);
    return {
      members:    snap.docs.map(d => ({ id: d.id, ...d.data() } as Member)),
      totalCount: countSnap.data().count,
      lastDoc:    snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
      hasMore:    snap.docs.length === pageSize,
    };
  },

  // ── TAMBAH MEMBER ─────────────────────────────────────────
  addMember: async (
    tenantId: string,
    data: { name: string; phone: string; email?: string; notes?: string; isProspect?: boolean }
  ): Promise<string> => {
    const phone = data.phone.replace(/\D/g, '');
    if (!phone || phone.length < 8) throw new Error('Nomor HP tidak valid');
    if (!data.name.trim()) throw new Error('Nama member tidak boleh kosong');

    // Cek duplikat nomor HP
    const existing = await MemberService.findByPhone(tenantId, phone);
    if (existing) throw new Error(`Nomor HP ${data.phone} sudah terdaftar`);

    const tiers   = await MemberConfigService.getActiveTiers(tenantId);
    const initTier = calculateTier(0, tiers);

    const ref = doc(collection(db, 'tenants', tenantId, 'members'));
    await setDoc(ref, {
      name:             data.name.trim(),
      phone,
      email:            data.email?.trim() || '',
      poin:             0,
      tier:             initTier.name,
      totalSpend:       0,
      totalVisits:      0,
      discountOverride: null,
      notes:            data.notes?.trim() || '',
      isProspect:       data.isProspect ?? false,
      createdAt:        serverTimestamp(),
      lastVisit:        null,
    });
    return ref.id;
  },

  // ── UPDATE MEMBER (admin) ─────────────────────────────────
  updateMember: async (
    tenantId: string,
    memberId: string,
    data: {
      name?:             string;
      phone?:            string;
      email?:            string;
      notes?:            string;
      discountOverride?: number | null;
      isProspect?:       boolean;
      totalSpend?:       number;
      totalVisits?:      number;
      poin?:             number;
      tier?:             string;
    }
  ): Promise<void> => {
    const ref = doc(db, 'tenants', tenantId, 'members', memberId);
    const updates: any = { updatedAt: serverTimestamp() };
    if (data.name             !== undefined) updates.name             = data.name.trim();
    if (data.phone            !== undefined) updates.phone            = data.phone.replace(/\D/g, '');
    if (data.email            !== undefined) updates.email            = data.email.trim();
    if (data.notes            !== undefined) updates.notes            = data.notes.trim();
    if (data.discountOverride !== undefined) updates.discountOverride = data.discountOverride;
    if (data.isProspect       !== undefined) updates.isProspect       = data.isProspect;
    if (data.totalSpend       !== undefined) updates.totalSpend       = data.totalSpend;
    if (data.totalVisits      !== undefined) updates.totalVisits      = data.totalVisits;
    if (data.poin             !== undefined) updates.poin             = data.poin;
    if (data.tier             !== undefined) updates.tier             = data.tier;
    await updateDoc(ref, updates);
  },

  // ── HAPUS MEMBER ──────────────────────────────────────────
  deleteMember: async (tenantId: string, memberId: string): Promise<void> => {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'tenants', tenantId, 'members', memberId));
    await batch.commit();
  },

  // ── ADJUST POIN MANUAL (admin) ────────────────────────────
  adjustPoints: async (
    tenantId: string,
    memberId: string,
    delta: number,  // positif = tambah, negatif = kurang
    reason: string
  ): Promise<void> => {
    const memberRef = doc(db, 'tenants', tenantId, 'members', memberId);
    const snap      = await getDoc(memberRef);
    if (!snap.exists()) throw new Error('Member tidak ditemukan');

    const currentPoin = snap.data().poin || 0;
    const newPoin     = Math.max(0, currentPoin + delta);
    const tiers       = await MemberConfigService.getActiveTiers(tenantId);
    const newTier     = calculateTier(newPoin, tiers);

    await updateDoc(memberRef, {
      poin:      newPoin,
      tier:      newTier.name,
      updatedAt: serverTimestamp(),
    });

    // Catat ke activities
    const actRef = doc(collection(db, 'tenants', tenantId, 'activities'));
    await setDoc(actRef, {
      type:      delta > 0 ? 'POIN_IN' : 'POIN_OUT',
      message:   `Poin member ${snap.data().name} ${delta > 0 ? '+' : ''}${delta} (${reason})`,
      memberId,
      createdAt: serverTimestamp(),
    });
  },

  // ── PROSES MEMBER SAAT CHECKOUT ───────────────────────────
  // Dipanggil SETELAH transaksi berhasil disimpan
  processCheckoutMember: async (
    tenantId:      string,
    memberId:      string,
    transactionTotal: number,  // total setelah diskon
    pointsEarned:  number,
    pointsRedeemed:number,
  ): Promise<void> => {
    const memberRef = doc(db, 'tenants', tenantId, 'members', memberId);
    const snap      = await getDoc(memberRef);
    if (!snap.exists()) return;

    const currentPoin = snap.data().poin || 0;
    // Guard: tolak nilai Infinity / NaN yang bisa muncul jika pointsPerRupiah = 0
    const safeEarned   = Number.isFinite(pointsEarned)  ? pointsEarned  : 0;
    const safeRedeemed = Number.isFinite(pointsRedeemed) ? pointsRedeemed : 0;
    const newPoin      = Math.max(0, currentPoin + safeEarned - safeRedeemed);
    const tiers       = await MemberConfigService.getActiveTiers(tenantId);
    const newTier     = calculateTier(newPoin, tiers);

    const updatePayload: Record<string, any> = {
      poin:        newPoin,
      tier:        newTier.name,
      totalSpend:  increment(transactionTotal),
      totalVisits: increment(1),
      lastVisit:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
    };

    // Catat waktu terakhir redeem — dipakai untuk cooldown check
    if (pointsRedeemed > 0) updatePayload.lastRedeemAt = serverTimestamp();

    await updateDoc(memberRef, updatePayload);
  },

  // ── BUILD TransactionMember (untuk disimpan ke transaksi) ─
  buildTransactionMember: async (
    tenantId:       string,
    member:         Member,
    subtotal:       number,   // total sebelum diskon member
    useRedeem:      boolean,  // apakah customer mau pakai poin
  ): Promise<TransactionMember & { finalTotal: number }> => {
    const config  = await MemberConfigService.getConfig(tenantId);
    const tiers   = await MemberConfigService.getActiveTiers(tenantId);

    const discount        = getActiveDiscount(member, tiers);
    const discountAmount  = Math.floor(subtotal * discount / 100);

    const pointsEarned    = calculatePointsEarned(subtotal, config.pointsPerRupiah);

    let pointsRedeemed = 0;
    let redeemAmount   = 0;
    if (useRedeem && member.poin > 0) {
      pointsRedeemed = member.poin;
      redeemAmount   = calculateRedeemAmount(member.poin, config.redeemRate);
    }

    const finalTotal = Math.max(0, subtotal - discountAmount - redeemAmount);

    return {
      memberId:        member.id,
      memberName:      member.name,
      memberPhone:     member.phone,
      tierName:        member.tier,
      discountPercent: discount,
      discountAmount,
      pointsEarned,
      pointsRedeemed,
      redeemAmount,
      finalTotal,
    };
  },

  // ── GET MEMBER SUMMARY (untuk tampil di list) ─────────────
  toSummary: async (tenantId: string, member: Member): Promise<MemberSummary> => {
    const tiers    = await MemberConfigService.getActiveTiers(tenantId);
    const tierData = tiers.find(t => t.name === member.tier) ?? tiers[0];
    const discount = getActiveDiscount(member, tiers);
    return {
      id:          member.id,
      name:        member.name,
      phone:       member.phone,
      poin:        member.poin,
      tier:        member.tier,
      tierColor:   tierData.color,
      discount,
      totalSpend:  member.totalSpend,
      totalVisits: member.totalVisits,
      lastVisit:   member.lastVisit,
    };
  },
};