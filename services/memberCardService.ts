/**
 * memberCardService.ts
 * Simpan/load desain kartu, generate link publik member.
 */
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { MemberCardDesign, DEFAULT_CARD_DESIGN } from '../types/memberCard.types';

export const MemberCardService = {

  // ── GET DESIGN ────────────────────────────────────────
  getCardDesign: async (tenantId: string): Promise<MemberCardDesign> => {
    try {
      const snap = await getDoc(doc(db, 'tenants', tenantId, 'config', 'card_design'));
      if (!snap.exists()) return DEFAULT_CARD_DESIGN;
      return { ...DEFAULT_CARD_DESIGN, ...snap.data() } as MemberCardDesign;
    } catch { return DEFAULT_CARD_DESIGN; }
  },

  // ── SAVE DESIGN ───────────────────────────────────────
  saveCardDesign: async (tenantId: string, design: Partial<MemberCardDesign>): Promise<void> => {
    const ref  = doc(db, 'tenants', tenantId, 'config', 'card_design');
    const snap = await getDoc(ref);
    const payload = { ...design, updatedAt: serverTimestamp() };
    snap.exists()
      ? await updateDoc(ref, payload)
      : await setDoc(ref, { ...DEFAULT_CARD_DESIGN, ...payload });
  },

  // ── GENERATE PUBLIC LINK ──────────────────────────────
  // Link publik yang bisa dibuka customer di browser
  // Format: https://[project].web.app/member/{tenantId}/{memberId}
  getMemberPublicLink: (tenantId: string, memberId: string): string => {
    const baseUrl = process.env.EXPO_PUBLIC_WEB_URL || 'https://swiftstock.web.app';
    return `${baseUrl}/member/${tenantId}/${memberId}`;
  },

  // ── GENERATE WHATSAPP SHARE TEXT ─────────────────────
  getWhatsAppShareText: (
    memberName:  string,
    storeName:   string,
    memberLink:  string,
    phone:       string,
  ): string => {
    const wa = phone.replace(/^0/, '62').replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Halo ${memberName}! 👋\n\n` +
      `Selamat, Anda telah terdaftar sebagai member *${storeName}*.\n\n` +
      `🪪 Kartu member digital Anda:\n${memberLink}\n\n` +
      `Tunjukkan QR code pada kartu saat berbelanja untuk mendapatkan poin & diskon.`
    );
    return `https://wa.me/${wa}?text=${msg}`;
  },
};