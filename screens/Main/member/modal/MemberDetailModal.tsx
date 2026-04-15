import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, ScrollView, Platform, Linking,
} from 'react-native';
import { X, Crown, Star, Award, Medal, Phone, Mail, StickyNote, Plus, Minus,
         TrendingUp, ShoppingBag, CreditCard, ExternalLink, Copy, Check,
         Clock, ShieldOff, Link } from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import { MemberService } from '@services/memberService';
import { MemberCardService } from '@services/memberCardService';
import { MemberCardDesign, DEFAULT_CARD_DESIGN } from '@/types/memberCard.types';
import MemberCardPreview from '@components/member/MemberCardPreview';
import { Member, MemberTier } from '@/types/member.types';

interface Props {
  visible:         boolean;
  member:          Member | null;
  tenantId:        string;
  tiers:           MemberTier[];
  onClose:         () => void;
  onAdjustPoints:  () => Promise<void>;
}

const TIER_ICONS: Record<string, React.ReactNode> = {
  'Reguler':  <Medal  size={18} color="#94A3B8" />,
  'Silver':   <Award  size={18} color="#64748B" />,
  'Gold':     <Star   size={18} color="#F59E0B" />,
  'Platinum': <Crown  size={18} color="#8B5CF6" />,
};

const MemberDetailModal = ({ visible, member, tenantId, tiers, onClose, onAdjustPoints }: Props) => {
  const [adjustDelta,  setAdjustDelta]  = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustMode,   setAdjustMode]   = useState<'add' | 'sub'>('add');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [showAdjust,   setShowAdjust]   = useState(false);
  const [showCard,     setShowCard]     = useState(false);
  const [cardDesign,   setCardDesign]   = useState<MemberCardDesign>(DEFAULT_CARD_DESIGN);
  const [storeName,    setStoreName]    = useState('');
  const [copied,       setCopied]       = useState(false);

  React.useEffect(() => {
    if (tenantId && visible) {
      MemberCardService.getCardDesign(tenantId).then(setCardDesign);
    }
  }, [tenantId, visible]);

  if (!member) return null;

  const publicLink  = MemberCardService.getMemberPublicLink(tenantId, member.id);
  const tierData    = tiers.find(t => t.name === member.tier) ?? tiers[0];
  const tierColor   = tierData?.color ?? '#94A3B8';
  const nextTier    = tiers.find(t => t.minPoin > member.poin);
  const pointsToNext = nextTier ? nextTier.minPoin - member.poin : 0;
  const discount    = member.discountOverride !== null && member.discountOverride !== undefined
    ? member.discountOverride
    : (tierData?.discount ?? 0);

  const handleCopyLink = async () => {
    try {
      if (Platform.OS === 'web' && navigator?.clipboard) {
        await navigator.clipboard.writeText(publicLink);
      }
      // Mobile: tidak ada clipboard package, skip — user bisa copy manual dari linkBox
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleOpenLink = () => {
    if (Platform.OS === 'web') {
      window.open(publicLink, '_blank');
    } else {
      Linking.openURL(publicLink);
    }
  };

  const handleAdjust = async () => {
    if (!adjustDelta || !adjustReason.trim()) { setError('Isi jumlah poin dan alasan'); return; }
    const delta = parseInt(adjustDelta);
    if (isNaN(delta) || delta <= 0) { setError('Jumlah poin tidak valid'); return; }
    try {
      setLoading(true);
      setError('');
      await MemberService.adjustPoints(tenantId, member.id, adjustMode === 'add' ? delta : -delta, adjustReason);
      await onAdjustPoints();
      setAdjustDelta('');
      setAdjustReason('');
      setShowAdjust(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Detail Member</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color="#64748B" /></TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

            {/* Profile hero */}
            <View style={[styles.hero, { backgroundColor: tierColor + '12' }]}>
              <View style={[styles.avatar, { backgroundColor: tierColor + '25', borderColor: tierColor }]}>
                <Text style={[styles.avatarText, { color: tierColor }]}>
                  {member.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.heroName}>{member.name}</Text>
              <View style={[styles.tierBadge, { backgroundColor: tierColor + '20', borderColor: tierColor + '50' }]}>
                {TIER_ICONS[member.tier] ?? <Medal size={18} color={tierColor} />}
                <Text style={[styles.tierText, { color: tierColor }]}>{member.tier}</Text>
                {member.discountOverride !== null && member.discountOverride !== undefined && (
                  <Text style={[styles.overrideTag, { color: tierColor }]}>Override</Text>
                )}
              </View>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <StatCard icon={<Star size={16} color="#F59E0B" />} value={member.poin.toLocaleString('id-ID')} label="Poin" color="#F59E0B" />
              <StatCard icon={<TrendingUp size={16} color="#10B981" />}
                value={'Rp ' + (member.totalSpend >= 1_000_000
                  ? (member.totalSpend / 1_000_000).toFixed(1) + 'jt'
                  : (member.totalSpend / 1_000).toFixed(0) + 'rb')}
                label="Total Belanja" color="#10B981" />
              <StatCard icon={<ShoppingBag size={16} color="#3B82F6" />} value={`${member.totalVisits}x`} label="Kunjungan" color="#3B82F6" />
              <StatCard icon={<Star size={16} color="#8B5CF6" />} value={`${discount}%`} label="Diskon Aktif" color="#8B5CF6" />
            </View>

            {/* Progress */}
            {nextTier && (
              <View style={styles.progressSection}>
                <Text style={styles.progressLabel}>
                  {pointsToNext} poin lagi menuju tier{' '}
                  <Text style={{ color: nextTier.color, fontFamily: 'PoppinsBold' }}>{nextTier.name}</Text>
                </Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, {
                    width: `${Math.min(100, (member.poin / nextTier.minPoin) * 100)}%` as any,
                    backgroundColor: tierColor,
                  }]} />
                </View>
              </View>
            )}

            {/* Info */}
            <View style={styles.infoSection}>
              {member.phone    && <InfoRow icon={<Phone      size={14} color="#94A3B8" />} value={member.phone} />}
              {member.email    && <InfoRow icon={<Mail       size={14} color="#94A3B8" />} value={member.email} />}
              {member.notes    && <InfoRow icon={<StickyNote size={14} color="#94A3B8" />} value={member.notes} />}
              {member.lastVisit && (
                <InfoRow icon={<ShoppingBag size={14} color="#94A3B8" />}
                  value={`Terakhir belanja: ${member.lastVisit.toDate().toLocaleDateString('id-ID')}`} />
              )}
            </View>

            {/* ── LINK PUBLIK + KARTU DIGITAL ─────────────── */}
            {member.isProspect ? (
              <View style={styles.prospectLockBox}>
                <ShieldOff size={20} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.prospectLockTitle}>Kartu Member Belum Aktif</Text>
                  <Text style={styles.prospectLockDesc}>
                    Customer masih berstatus Calon Member. Kartu digital dan link publik baru tersedia setelah syarat keanggotaan terpenuhi.
                  </Text>
                  <View style={styles.prospectStatusRow}>
                    <Clock size={11} color="#D97706" />
                    <Text style={styles.prospectStatusText}>Menunggu pemenuhan syarat</Text>
                  </View>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.linkSection}>
                  <View style={styles.linkSectionTitleRow}>
                    <Link size={13} color={COLORS.primary} />
                    <Text style={styles.linkSectionTitle}>Link Kartu Member</Text>
                  </View>
                  <View style={styles.linkBox}>
                    <Text style={styles.linkText} numberOfLines={1}>{publicLink}</Text>
                  </View>
                  <View style={styles.linkActions}>
                    <View style={styles.copyWrap}>
                      <TouchableOpacity
                        style={[styles.linkBtn, copied && styles.linkBtnCopied]}
                        onPress={handleCopyLink}
                      >
                        {copied
                          ? <Check size={14} color="#10B981" />
                          : <Copy  size={14} color={COLORS.primary} />}
                        <Text style={[styles.linkBtnText, copied && { color: '#10B981' }]}>
                          {copied ? 'Copied!' : 'Salin Link'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={[styles.linkBtn, styles.linkBtnOpen]} onPress={handleOpenLink}>
                      <ExternalLink size={14} color="#FFF" />
                      <Text style={[styles.linkBtnText, { color: '#FFF' }]}>Buka</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.adjustToggle, { borderColor: '#3B82F6' }]}
                  onPress={() => setShowCard(v => !v)}
                >
                  <CreditCard size={15} color="#3B82F6" />
                  <Text style={[styles.adjustToggleText, { color: '#3B82F6' }]}>Kartu Member Digital</Text>
                </TouchableOpacity>
                {showCard && (
                  <View style={{ alignItems: 'center', marginBottom: 12 }}>
                    <MemberCardPreview
                      member={member}
                      design={cardDesign}
                      storeName={storeName}
                      tenantId={tenantId}
                      previewMode={false}
                    />
                  </View>
                )}
              </>
            )}
            {/* ── ADJUST POIN ─────────────────────────────── */}
            <TouchableOpacity style={styles.adjustToggle} onPress={() => setShowAdjust(v => !v)}>
              <Star size={15} color={COLORS.primary} />
              <Text style={styles.adjustToggleText}>Sesuaikan Poin Manual</Text>
            </TouchableOpacity>

            {showAdjust && (
              <View style={styles.adjustBox}>
                <View style={styles.modeRow}>
                  {(['add', 'sub'] as const).map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.modeBtn, adjustMode === m && styles.modeBtnActive]}
                      onPress={() => setAdjustMode(m)}
                    >
                      {m === 'add'
                        ? <Plus  size={14} color={adjustMode === m ? '#FFF' : '#64748B'} />
                        : <Minus size={14} color={adjustMode === m ? '#FFF' : '#64748B'} />}
                      <Text style={[styles.modeBtnText, adjustMode === m && styles.modeBtnTextActive]}>
                        {m === 'add' ? 'Tambah' : 'Kurangi'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.adjustInput}
                  placeholder="Jumlah poin"
                  keyboardType="numeric"
                  value={adjustDelta}
                  onChangeText={setAdjustDelta}
                />
                <TextInput
                  style={[styles.adjustInput, { marginTop: 8 }]}
                  placeholder="Alasan penyesuaian"
                  value={adjustReason}
                  onChangeText={setAdjustReason}
                />
                {error !== '' && <Text style={styles.error}>{error}</Text>}
                <TouchableOpacity
                  style={[styles.adjustBtn, loading && styles.disabledBtn]}
                  onPress={handleAdjust}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color="#FFF" size="small" />
                    : <Text style={styles.adjustBtnText}>Simpan Penyesuaian</Text>}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ── SUB-COMPONENTS ─────────────────────────────────────────
const StatCard = ({ icon, value, label, color }: {
  icon: React.ReactNode; value: string; label: string; color: string;
}) => (
  <View style={[styles.statCard, { borderColor: color + '30' }]}>
    {icon}
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const InfoRow = ({ icon, value }: { icon: React.ReactNode; value: string }) => (
  <View style={styles.infoRow}>
    {icon}
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card:         { backgroundColor: '#FFF', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '90%' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  title:        { fontSize: 16, fontFamily: 'PoppinsBold', color: '#1E293B' },
  body:         { padding: 20 },

  hero:         { alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 16 },
  avatar:       { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText:   { fontSize: 22, fontFamily: 'PoppinsBold' },
  heroName:     { fontSize: 18, fontFamily: 'PoppinsBold', color: '#1E293B', marginBottom: 8 },
  tierBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  tierText:     { fontSize: 13, fontFamily: 'PoppinsBold' },
  overrideTag:  { fontSize: 10, fontFamily: 'PoppinsMedium', opacity: 0.7 },

  statsRow:     { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard:     { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1, backgroundColor: '#FAFAFA', gap: 4 },
  statValue:    { fontSize: 13, fontFamily: 'PoppinsBold' },
  statLabel:    { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8', textAlign: 'center' },

  progressSection: { marginBottom: 16 },
  progressLabel:   { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#475569', marginBottom: 6 },
  progressBarBg:   { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: 8, borderRadius: 4 },

  infoSection:  { marginBottom: 16, gap: 8 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoValue:    { fontSize: 13, fontFamily: 'PoppinsRegular', color: '#475569', flex: 1 },

  // Link publik
  linkSection:      { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, marginBottom: 12, gap: 10 },
  linkSectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  linkSectionTitle: { fontSize: 13, fontFamily: 'PoppinsBold', color: '#1E293B' },
  prospectLockBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#FDE68A' },
  prospectLockTitle: { fontSize: 13, fontFamily: 'PoppinsBold', color: '#92400E', marginBottom: 4 },
  prospectLockDesc:  { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#B45309', lineHeight: 18, marginBottom: 6 },
  prospectStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  prospectStatusText:{ fontSize: 11, fontFamily: 'PoppinsMedium', color: '#D97706' },
  linkBox:          { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  linkText:         { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#2563EB' },
  linkActions:      { flexDirection: 'row', gap: 8 },
  copyWrap:         { position: 'relative' as any },
  linkBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
  linkBtnCopied:    { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
  linkBtnOpen:      { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  linkBtnText:      { fontSize: 12, fontFamily: 'PoppinsBold', color: COLORS.primary },

  adjustToggle:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  adjustToggleText: { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: COLORS.primary },
  adjustBox:        { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, marginTop: 8 },
  modeRow:          { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
  modeBtnActive:    { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  modeBtnText:      { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#64748B' },
  modeBtnTextActive:{ color: '#FFF' },
  adjustInput:      { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, height: 40, fontSize: 13, fontFamily: 'PoppinsRegular', color: '#1E293B', outlineStyle: 'none' as any },
  error:            { fontSize: 12, color: '#EF4444', fontFamily: 'PoppinsRegular', marginTop: 6 },
  adjustBtn:        { marginTop: 10, height: 40, borderRadius: 8, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
  adjustBtnText:    { fontSize: 13, fontFamily: 'PoppinsBold', color: '#FFF' },
  disabledBtn:      { opacity: 0.6 },
});

export default MemberDetailModal;