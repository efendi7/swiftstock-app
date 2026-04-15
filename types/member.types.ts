import { Timestamp } from 'firebase/firestore';

// ── TIER ─────────────────────────────────────────────────
export interface MemberTier {
  name:     string;
  minPoin:  number;
  discount: number;
  color:    string;
}

export const DEFAULT_TIERS: MemberTier[] = [
  { name: 'Reguler',  minPoin: 0,    discount: 0,  color: '#94A3B8' },
  { name: 'Silver',   minPoin: 100,  discount: 5,  color: '#64748B' },
  { name: 'Gold',     minPoin: 500,  discount: 10, color: '#F59E0B' },
  { name: 'Platinum', minPoin: 1000, discount: 15, color: '#8B5CF6' },
];

// ── MEMBER CONFIG ─────────────────────────────────────────
export interface MemberConfig {
  pointsPerRupiah:  number;
  useCustomTiers:   boolean;
  customTiers?:     MemberTier[];
  redeemRate:       number;
  updatedAt?:       Timestamp;
}

export const DEFAULT_MEMBER_CONFIG: MemberConfig = {
  pointsPerRupiah: 1000,
  useCustomTiers:  false,
  redeemRate:      100,
};

// ── MEMBER ────────────────────────────────────────────────
export interface Member {
  id:               string;
  name:             string;
  phone:            string;
  email?:           string;
  poin:             number;
  tier:             string;
  totalSpend:       number;
  totalVisits:      number;
  discountOverride: number | null;
  notes?:           string;
  isProspect?:      boolean;  // true = calon member (belum memenuhi syarat conditional)
  createdAt:        Timestamp;
  lastVisit?:       Timestamp;
  lastRedeemAt?:    Timestamp; // timestamp terakhir kali member redeem poin
}

// ── MEMBER UPDATE DATA ───────────────────────────────────
export interface MemberUpdateData {
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
  lastRedeemAt?:     Timestamp | null;
}

// ── MEMBER SUMMARY ────────────────────────────────────────
export interface MemberSummary {
  id:          string;
  name:        string;
  phone:       string;
  poin:        number;
  tier:        string;
  tierColor:   string;
  discount:    number;
  totalSpend:  number;
  totalVisits: number;
  lastVisit?:  Timestamp;
}

// ── MEMBER PADA TRANSAKSI ─────────────────────────────────
export interface TransactionMember {
  memberId:        string;
  memberName:      string;
  memberPhone:     string;
  tierName:        string;
  discountPercent: number;
  discountAmount:  number;
  pointsEarned:    number;
  pointsRedeemed:  number;
  redeemAmount:    number;
}