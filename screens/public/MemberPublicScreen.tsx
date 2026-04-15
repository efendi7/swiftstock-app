/**
 * MemberPublicScreen.tsx
 * Halaman publik kartu member — tidak perlu login.
 * Web: http://localhost:8081/member/:tenantId/:memberId
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  Platform, useWindowDimensions,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@services/firebaseConfig';
import { Member, MemberTier, DEFAULT_TIERS } from '@/types/member.types';
import { MemberCardDesign, DEFAULT_CARD_DESIGN } from '@/types/memberCard.types';
import { StoreProfile } from '@/types/settings.types';
import {
  Clock, ShieldOff, Crown, Star, ShoppingBag,
  TrendingUp, Lightbulb, Award, Receipt, Trophy,
} from 'lucide-react-native';

type MemberPublicParams = { tenantId: string; memberId: string };

interface TierInfo {
  current:    MemberTier;
  next:       MemberTier | null;
  progress:   number;
  poinToNext: number;
}

interface RecentTx {
  id:                string;
  transactionNumber: string;
  total:             number;
  date:              any;
  pointsEarned?:     number;
}

const getTierInfo = (member: Member, tiers: MemberTier[]): TierInfo => {
  const idx     = tiers.findIndex(t => t.name === member.tier);
  const current = tiers[idx] ?? tiers[0];
  const next    = idx < tiers.length - 1 ? tiers[idx + 1] : null;
  const progress = next
    ? Math.min(100, ((member.poin - current.minPoin) / (next.minPoin - current.minPoin)) * 100)
    : 100;
  return { current, next, progress, poinToNext: next ? next.minPoin - member.poin : 0 };
};

const fmtRp   = (n: number) => 'Rp ' + n.toLocaleString('id-ID');
const fmtDate = (ts: any) => {
  try {
    const d = ts?.toDate?.() ?? new Date(ts);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return '—'; }
};

const isWeb = Platform.OS === 'web';

// ── SCREEN ───────────────────────────────────────────────
const MemberPublicScreen = () => {
  const route  = useRoute<RouteProp<Record<string, MemberPublicParams>, string>>();
  const { tenantId, memberId } = route.params ?? {};
  const { width: screenW } = useWindowDimensions();
  const useWideLayout = isWeb && screenW >= 768;

  const [member,  setMember]  = useState<Member | null>(null);
  const [tiers,   setTiers]   = useState<MemberTier[]>(DEFAULT_TIERS);
  const [design,  setDesign]  = useState<MemberCardDesign>(DEFAULT_CARD_DESIGN);
  const [profile, setProfile] = useState<StoreProfile | null>(null);
  const [settings,setSettings]= useState<any>({});
  const [txList,  setTxList]  = useState<RecentTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    if (!tenantId || !memberId) { setError('Link tidak valid.'); setLoading(false); return; }
    try {
      const [memberSnap, settingsSnap, cardSnap, profileSnap] = await Promise.all([
        getDoc(doc(db, 'tenants', tenantId, 'members', memberId)),
        getDoc(doc(db, 'tenants', tenantId, 'config', 'member_settings')),
        getDoc(doc(db, 'tenants', tenantId, 'config', 'card_design')),
        getDoc(doc(db, 'tenants', tenantId, 'config', 'store_profile')),
      ]);

      if (!memberSnap.exists()) { setError('Member tidak ditemukan.'); setLoading(false); return; }

      const m           = { id: memberId, ...memberSnap.data() } as Member;
      const s           = settingsSnap.exists() ? settingsSnap.data() : {};
      const c           = cardSnap.exists() ? { ...DEFAULT_CARD_DESIGN, ...cardSnap.data() } : DEFAULT_CARD_DESIGN;
      const p           = profileSnap.exists() ? profileSnap.data() as StoreProfile : null;
      const activeTiers = (s.useCustomTiers && s.customTiers?.length) ? s.customTiers : DEFAULT_TIERS;

      setMember(m);
      setSettings(s);
      setDesign(c);
      setProfile(p);
      setTiers(activeTiers);

      // Riwayat transaksi
      // Strategi: 3 query paralel — by memberId, by memberPhone (field member.*),
      // dan by memberPhone (field langsung) untuk cover semua kasus termasuk calon member.
      // Tidak pakai orderBy agar tidak perlu composite index Firestore.
      try {
        const memberPhone = (memberSnap.data() as any)?.phone ?? '';
        const txCol = collection(db, 'tenants', tenantId, 'transactions');

        const queries: Promise<any>[] = [
          // Q1: member normal (ada field member.memberId)
          getDocs(query(txCol, where('member.memberId', '==', memberId), limit(20))),
        ];

        if (memberPhone) {
          // Q2: member dengan phone match di nested field
          queries.push(getDocs(query(txCol, where('member.memberPhone', '==', memberPhone), limit(20))));
        }

        const results = await Promise.allSettled(queries);
        const seen    = new Set<string>();
        const merged: RecentTx[] = [];

        for (const res of results) {
          if (res.status !== 'fulfilled') continue;
          for (const d of res.value.docs) {
            if (seen.has(d.id)) continue;
            seen.add(d.id);
            const data = d.data();
            merged.push({
              id:                d.id,
              transactionNumber: data.transactionNumber ?? '-',
              total:             data.total ?? 0,
              date:              data.date,
              pointsEarned:      data.member?.pointsEarned,
            });
          }
        }

        // Sort manual by date desc (Firestore Timestamp atau Date)
        merged.sort((a, b) => {
          const ta = a.date?.toDate?.()?.getTime() ?? (a.date?.seconds != null ? a.date.seconds * 1000 : 0);
          const tb = b.date?.toDate?.()?.getTime() ?? (b.date?.seconds != null ? b.date.seconds * 1000 : 0);
          return tb - ta;
        });
        setTxList(merged.slice(0, 5));
      } catch (txErr) {
        console.warn('Gagal muat riwayat transaksi:', txErr);
      }
    } catch {
      setError('Gagal memuat data. Periksa koneksi internet.');
    } finally {
      setLoading(false);
    }
  }, [tenantId, memberId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#1C3A5A" />
      <Text style={styles.loadingText}>Memuat kartu member...</Text>
    </View>
  );

  if (error || !member) return (
    <View style={styles.center}>
      <ShieldOff size={48} color="#CBD5E1" />
      <Text style={styles.errorText}>{error || 'Terjadi kesalahan.'}</Text>
    </View>
  );

  const storeName  = profile?.storeName || 'Toko';
  const tierInfo   = getTierInfo(member, tiers);
  const redeemRate = settings.redeemRate      || 100;
  const poinPerRp  = settings.pointsPerRupiah || 1000;
  const publicLink = isWeb
    ? window.location.href
    : `https://swiftstock.web.app/member/${tenantId}/${memberId}`;

  const cardBgStyle = { backgroundColor: design.backgroundColor || '#1C3A5A' };
  const textColor   = design.textColor === 'dark' ? '#1E293B' : '#FFF';
  const textMuted   = design.textColor === 'dark' ? 'rgba(30,41,59,0.55)' : 'rgba(255,255,255,0.65)';

  // ── KOMPONEN KARTU ────────────────────────────────────
  const MemberCardBlock = () => (
    <View style={[styles.memberCard, cardBgStyle]}>
      <View style={styles.cardCircle} />
      <View style={styles.cardTop}>
        <View>
          <Text style={[styles.cardStoreName, { color: textMuted }]}>{storeName.toUpperCase()}</Text>
          <Text style={[styles.cardLabel, { color: textMuted }]}>MEMBER CARD</Text>
        </View>
        <View style={styles.cardTopRight}>
          <View style={[styles.tierPill, { borderColor: textMuted }]}>
            <Text style={[styles.tierPillText, { color: textColor }]}>{member.tier}</Text>
          </View>
          {member.isProspect && (
            <View style={styles.prospectPill}>
              <Clock size={9} color="#D97706" />
              <Text style={styles.prospectPillText}>Calon</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.chip} />
      <View style={styles.cardBottom}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardMemberName, { color: textColor }]} numberOfLines={1}>
            {member.name}
          </Text>
          {design.showPhone !== false && (
            <Text style={[styles.cardPhone, { color: textMuted }]}>{member.phone}</Text>
          )}
          {design.showPoints !== false && !member.isProspect && (
            <Text style={[styles.cardPoin, { color: textMuted }]}>
              {member.poin.toLocaleString('id-ID')} poin
            </Text>
          )}
          {member.isProspect && (
            <Text style={[styles.cardPoin, { color: '#FDE68A' }]}>
              Poin aktif setelah syarat terpenuhi
            </Text>
          )}
        </View>
        {member.isProspect ? (
          <View style={styles.qrLock}>
            <ShieldOff size={24} color="#D97706" />
            <Text style={styles.qrLockText}>Belum{'\n'}Aktif</Text>
          </View>
        ) : (
          <View style={styles.qrBox}>
            <QRCode value={publicLink} size={72} backgroundColor="white" color="#1E293B" />
          </View>
        )}
      </View>
      <Text style={[styles.cardId, { color: textMuted }]}>
        ID: {memberId.slice(0, 8).toUpperCase()}
      </Text>
    </View>
  );

  // ── STATS BLOCK ───────────────────────────────────────
  const StatsBlock = () => (
    <View style={styles.section}>
      <View style={styles.statGrid}>
        <StatBox value={member.isProspect ? '—' : member.poin.toLocaleString('id-ID')} label="Poin Saya" color={tierInfo.current.color} />
        <StatBox
          value={(member.totalSpend || 0) >= 1_000_000
            ? ((member.totalSpend || 0) / 1_000_000).toFixed(1) + 'jt'
            : ((member.totalSpend || 0) / 1_000).toFixed(0) + 'rb'}
          label="Total Belanja"
        />
        <StatBox value={`${member.totalVisits || 0}x`} label="Kunjungan" />
      </View>
      {member.isProspect ? (
        <View style={styles.prospectProgress}>
          <Clock size={14} color="#D97706" />
          <Text style={styles.prospectProgressText}>
            Poin & diskon aktif setelah kamu menjadi member penuh.
          </Text>
        </View>
      ) : tierInfo.next ? (
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>
              Progress ke{' '}
              <Text style={{ color: tierInfo.next.color, fontFamily: 'PoppinsBold' }}>
                {tierInfo.next.name}
              </Text>
            </Text>
            <Text style={styles.progressLabel}>{tierInfo.poinToNext.toLocaleString('id-ID')} poin lagi</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, {
              width: `${tierInfo.progress}%` as any,
              backgroundColor: tierInfo.next.color,
            }]} />
          </View>
          <Text style={styles.progressSub}>
            {tierInfo.current.name} → {tierInfo.next.name}
          </Text>
        </View>
      ) : (
        <View style={styles.topBadge}>
          <Trophy size={14} color="#92400E" />
          <Text style={styles.topBadgeText}>Anda sudah mencapai tier tertinggi!</Text>
        </View>
      )}
    </View>
  );

  // ── CARA REDEEM ───────────────────────────────────────
  const RedeemBlock = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Cara Pakai Poin</Text>
      <View style={styles.redeemCard}>
        <RedeemRow
          icon={<ShoppingBag size={20} color="#1C3A5A" />}
          main={`Setiap belanja ${fmtRp(poinPerRp)}`}
          sub="mendapat 1 poin"
        />
        <View style={styles.divider} />
        <RedeemRow
          icon={<Star size={20} color="#F59E0B" />}
          main={`1 poin = ${fmtRp(redeemRate)}`}
          sub="tukar poin saat bayar di kasir"
        />
        <View style={styles.divider} />
        <RedeemRow
          icon={<Lightbulb size={20} color="#0EA5A0" />}
          main="Poin kamu saat ini"
          sub={member.isProspect ? 'Aktif setelah jadi member penuh' : `= ${fmtRp(member.poin * redeemRate)} diskon`}
          highlight={!member.isProspect}
        />
      </View>
    </View>
  );

  // ── TIER TABLE ────────────────────────────────────────
  const TierBlock = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Benefit Tiap Tier</Text>
      <View style={styles.tierTable}>
        <View style={[styles.tierRow, styles.tierHeader]}>
          <Text style={[styles.tierCell, styles.tierHeaderText, { flex: 2 }]}>Tier</Text>
          <Text style={[styles.tierCell, styles.tierHeaderText]}>Min Poin</Text>
          <Text style={[styles.tierCell, styles.tierHeaderText]}>Diskon</Text>
        </View>
        {tiers.map(t => (
          <View key={t.name} style={[styles.tierRow, t.name === member.tier && styles.tierRowActive]}>
            <View style={[styles.tierCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
              <View style={[styles.tierDot, { backgroundColor: t.color }]} />
              <Text style={[styles.tierCellText, t.name === member.tier && styles.tierActiveTxt]}>{t.name}</Text>
            </View>
            <Text style={[styles.tierCell, styles.tierCellText]}>{t.minPoin.toLocaleString('id-ID')}+</Text>
            <Text style={[styles.tierCell, styles.tierCellText, { color: t.discount > 0 ? t.color : '#94A3B8' }]}>
              {t.discount > 0 ? `${t.discount}%` : '—'}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.tierNote}>Tier dihitung otomatis dari total poin yang dikumpulkan.</Text>
    </View>
  );

  // ── TRANSAKSI ─────────────────────────────────────────
  const TxBlock = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Riwayat Transaksi</Text>
      {txList.length === 0 ? (
        <View style={styles.emptyTxBox}>
          <Receipt size={28} color="#CBD5E1" />
          <Text style={styles.emptyTx}>Belum ada riwayat transaksi.</Text>
        </View>
      ) : txList.map(tx => (
        <View key={tx.id} style={styles.txItem}>
          <View>
            <Text style={styles.txNo}>{tx.transactionNumber}</Text>
            <Text style={styles.txDate}>{fmtDate(tx.date)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.txTotal}>{fmtRp(tx.total)}</Text>
            {tx.pointsEarned ? (
              <Text style={styles.txPts}>+{tx.pointsEarned} poin</Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );

  // ── PROSPECT BANNER ───────────────────────────────────
  const ProspectBanner = () => member.isProspect ? (
    <View style={styles.prospectBanner}>
      <Clock size={18} color="#D97706" />
      <View style={{ flex: 1 }}>
        <Text style={styles.prospectBannerTitle}>Status: Calon Member</Text>
        <Text style={styles.prospectBannerDesc}>
          Kamu belum memenuhi syarat keanggotaan penuh. Terus berbelanja untuk upgrade otomatis!
        </Text>
      </View>
    </View>
  ) : null;

  // ── WIDE LAYOUT (web >= 768px) ────────────────────────
  if (useWideLayout) {
    return (
      <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
        {/* Store header */}
        <View style={styles.storeHeader}>
          <View style={styles.storeAvatar}>
            <Text style={styles.storeAvatarText}>{storeName.slice(0, 2).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.storeName}>{storeName}</Text>
            <Text style={styles.storeSub}>Program Member Loyalty</Text>
          </View>
        </View>

        <View style={styles.wideBody}>
          {/* KOLOM KIRI — kartu + redeem + tier */}
          <View style={styles.wideLeft}>
            {member.isProspect && <ProspectBanner />}
            <View style={styles.cardWrap}>
              <MemberCardBlock />
            </View>
            <RedeemBlock />
            <TierBlock />
          </View>

          {/* KOLOM KANAN — stats + transaksi */}
          <View style={styles.wideRight}>
            <StatsBlock />
            <TxBlock />
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Tunjukkan QR di atas kepada kasir untuk mendapatkan poin & diskon.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ── MOBILE LAYOUT ─────────────────────────────────────
  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <View style={styles.storeHeader}>
        <View style={styles.storeAvatar}>
          <Text style={styles.storeAvatarText}>{storeName.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.storeName}>{storeName}</Text>
          <Text style={styles.storeSub}>Program Member Loyalty</Text>
        </View>
      </View>

      {member.isProspect && <ProspectBanner />}

      <View style={styles.cardWrap}>
        <MemberCardBlock />
      </View>

      <StatsBlock />
      <RedeemBlock />
      <TierBlock />
      <TxBlock />

      <View style={[styles.footer, { margin: 16 }]}>
        <Text style={styles.footerText}>
          Tunjukkan QR di atas kepada kasir untuk mendapatkan poin & diskon.
        </Text>
      </View>
    </ScrollView>
  );
};

// ── SUB-COMPONENTS ────────────────────────────────────────
const StatBox = ({ value, label, color }: { value: string; label: string; color?: string }) => (
  <View style={styles.statBox}>
    <Text style={[styles.statVal, color ? { color } : {}]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const RedeemRow = ({ icon, main, sub, highlight }: {
  icon: React.ReactNode; main: string; sub: string; highlight?: boolean;
}) => (
  <View style={styles.redeemRow}>
    <View style={styles.redeemIconWrap}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.redeemMain, highlight && { color: '#0EA5A0' }]}>{main}</Text>
      <Text style={[styles.redeemSub, highlight && { color: '#0EA5A0', fontFamily: 'PoppinsBold' }]}>{sub}</Text>
    </View>
  </View>
);

// ── STYLES ────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#F0F4F8' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24, backgroundColor: '#F0F4F8' },
  loadingText: { fontSize: 14, fontFamily: 'PoppinsRegular', color: '#64748B', marginTop: 8 },
  errorText:   { fontSize: 15, fontFamily: 'PoppinsRegular', color: '#64748B', textAlign: 'center', marginTop: 12 },

  // Store header
  storeHeader:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, backgroundColor: '#1C3A5A' },
  storeAvatar:     { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  storeAvatarText: { fontSize: 16, fontFamily: 'PoppinsBold', color: '#FFF' },
  storeName:       { fontSize: 16, fontFamily: 'PoppinsBold', color: '#FFF' },
  storeSub:        { fontSize: 11, fontFamily: 'PoppinsRegular', color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  // Wide layout
  wideBody:  { flexDirection: 'row', alignItems: 'flex-start', padding: 20, gap: 20, maxWidth: 1100, alignSelf: 'center', width: '100%' as any },
  wideLeft:  { flex: 1.1 },
  wideRight: { flex: 0.9 },

  // Prospect banner
  prospectBanner:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#FFFBEB', margin: 16, marginBottom: 0, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#FDE68A' },
  prospectBannerTitle: { fontSize: 14, fontFamily: 'PoppinsBold', color: '#92400E', marginBottom: 4 },
  prospectBannerDesc:  { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#B45309', lineHeight: 18 },

  // Card
  cardWrap:      { padding: 16, paddingBottom: 0 },
  memberCard:    { borderRadius: 20, padding: 20, minHeight: 190, overflow: 'hidden',
                   shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  cardCircle:    { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.06)' },
  cardTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTopRight:  { alignItems: 'flex-end', gap: 4 },
  cardStoreName: { fontSize: 9, letterSpacing: 2, fontFamily: 'PoppinsBold' },
  cardLabel:     { fontSize: 11, letterSpacing: 1, fontFamily: 'PoppinsRegular', marginTop: 2 },
  tierPill:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  tierPillText:  { fontSize: 11, fontFamily: 'PoppinsBold', letterSpacing: 0.5 },
  prospectPill:  { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(253,230,138,0.25)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(253,230,138,0.5)' },
  prospectPillText: { fontSize: 9, fontFamily: 'PoppinsBold', color: '#FDE68A' },
  chip:          { width: 36, height: 28, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 10 },
  cardBottom:    { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  cardMemberName:{ fontSize: 17, fontFamily: 'PoppinsBold' },
  cardPhone:     { fontSize: 12, fontFamily: 'PoppinsRegular', marginTop: 3 },
  cardPoin:      { fontSize: 11, fontFamily: 'PoppinsRegular', marginTop: 4 },
  qrBox:         { backgroundColor: '#FFF', borderRadius: 8, padding: 4 },
  qrLock:        { width: 80, height: 80, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center', gap: 3 },
  qrLockText:    { fontSize: 9, fontFamily: 'PoppinsBold', color: '#FDE68A', textAlign: 'center' },
  cardId:        { fontSize: 9, letterSpacing: 1.5, fontFamily: 'PoppinsRegular', marginTop: 10 },

  // Section
  section:      { margin: 16, marginBottom: 0, backgroundColor: '#FFF', borderRadius: 16, padding: 18,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 14, fontFamily: 'PoppinsBold', color: '#1C3A5A', marginBottom: 14 },

  // Stats
  statGrid:  { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox:   { flex: 1, backgroundColor: '#F0F4F8', borderRadius: 12, padding: 12, alignItems: 'center' },
  statVal:   { fontSize: 16, fontFamily: 'PoppinsBold', color: '#1C3A5A' },
  statLabel: { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#64748B', marginTop: 3, textAlign: 'center' },

  // Prospect progress
  prospectProgress:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFBEB', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FDE68A' },
  prospectProgressText: { flex: 1, fontSize: 12, fontFamily: 'PoppinsRegular', color: '#B45309' },

  // Progress
  progressSection:  { marginTop: 4 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel:    { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#64748B' },
  progressBg:       { height: 8, backgroundColor: '#E2E8F0', borderRadius: 99, overflow: 'hidden' },
  progressFill:     { height: '100%' as any, borderRadius: 99 },
  progressSub:      { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 6, textAlign: 'center' },
  topBadge:         { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12 },
  topBadgeText:     { fontSize: 13, fontFamily: 'PoppinsBold', color: '#92400E' },

  // Redeem
  redeemCard:    { backgroundColor: '#F8FAFC', borderRadius: 12, overflow: 'hidden' },
  redeemRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  redeemIconWrap:{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  redeemMain:    { fontSize: 13, fontFamily: 'PoppinsBold', color: '#1E293B' },
  redeemSub:     { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#64748B', marginTop: 2 },
  divider:       { height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 14 },

  // Tier table
  tierTable:      { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  tierHeader:     { backgroundColor: '#F8FAFC' },
  tierHeaderText: { fontSize: 11, fontFamily: 'PoppinsBold', color: '#64748B', letterSpacing: 0.4 },
  tierRow:        { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tierRowActive:  { backgroundColor: 'rgba(14,165,160,0.06)' },
  tierCell:       { flex: 1, padding: 10 },
  tierCellText:   { fontSize: 13, fontFamily: 'PoppinsRegular', color: '#1E293B' },
  tierActiveTxt:  { fontFamily: 'PoppinsBold' },
  tierDot:        { width: 8, height: 8, borderRadius: 4 },
  tierNote:       { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 10, textAlign: 'center' },

  // Transactions
  emptyTxBox: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyTx:    { fontSize: 13, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  txItem:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#F8FAFC', borderRadius: 10, marginBottom: 8 },
  txNo:       { fontSize: 12, fontFamily: 'PoppinsBold', color: '#1E293B' },
  txDate:     { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#64748B' },
  txTotal:    { fontSize: 13, fontFamily: 'PoppinsBold', color: '#1C3A5A' },
  txPts:      { fontSize: 11, fontFamily: 'PoppinsBold', color: '#10B981' },

  // Footer
  footer:     { padding: 16, backgroundColor: '#1C3A5A', borderRadius: 12, marginTop: 16 },
  footerText: { fontSize: 12, fontFamily: 'PoppinsRegular', color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20 },
});

export default MemberPublicScreen;