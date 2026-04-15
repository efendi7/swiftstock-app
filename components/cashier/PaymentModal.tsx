/**
 * PaymentModal.tsx — render only
 * Props diterima dari useCashier via spread, tidak ada business logic.
 */

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Modal,
  ScrollView, KeyboardAvoidingView, Platform, Image,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Banknote, QrCode, Crown, Search, Scan, XCircle, Star, CheckCircle, Clock } from 'lucide-react-native';
import { COLORS }              from '@constants/colors';
import { MemberSearchSelect } from '@components/cashier/MemberSearchSelect';
import { MemberState, PaymentMethod } from '@hooks/useCashier';

export interface PaymentModalProps {
  visible: boolean; onClose: () => void;
  subtotal: number; finalTotal: number;
  paymentMethod: PaymentMethod; setPaymentMethod: (m: PaymentMethod) => void;
  cashAmount: string; changeAmount: number;
  onCashChange: (v: string) => void;
  onCheckout: () => void; loading: boolean;
  canConfirm: boolean; memberBlocking: boolean;
  showMemberInput: boolean;
  // phoneInput/setPhoneInput dipegang MemberSearchSelect langsung
  memberState: MemberState | null; memberLoading: boolean; memberError: string;
  pendingNewMember: any;
  onSelectMember: (member: any) => void; onScanMember: () => void;
  onRemoveMember: () => void; onToggleRedeem: () => void;
  getTierColor: (tier: string) => string; redeemRate: number;
  checkRedeemEligibility: (member: any) => { allowed: boolean; reason?: string };
}

const H = Dimensions.get('window').height;

export const PaymentModal: React.FC<PaymentModalProps> = (p) => {
  const insets    = useSafeAreaInsets();
  const scrollRef = React.useRef<ScrollView>(null);

  return (
    <Modal visible={p.visible} animationType="slide" transparent onRequestClose={p.onClose}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.sheet}>

          <View style={s.header}>
            <Text style={s.headerTitle}>Pembayaran</Text>
            <TouchableOpacity onPress={p.onClose}><X size={24} color="#64748B" /></TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            style={s.scroll}
            contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Metode bayar */}
            <View style={s.methodRow}>
              {(['cash', 'qris'] as const).map(m => (
                <TouchableOpacity
                  key={m} style={[s.methodBtn, p.paymentMethod === m && s.methodBtnActive]}
                  onPress={() => p.setPaymentMethod(m)}
                >
                  {m === 'cash'
                    ? <Banknote size={20} color={p.paymentMethod === m ? '#FFF' : '#64748B'} />
                    : <QrCode   size={20} color={p.paymentMethod === m ? '#FFF' : '#64748B'} />}
                  <Text style={[s.methodText, p.paymentMethod === m && s.methodTextActive]}>
                    {m === 'cash' ? 'Tunai' : 'QRIS'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Member */}
            {p.showMemberInput && (
              <View style={s.memberSection}>
                <View style={s.row}>
                  <Crown size={14} color={COLORS.primary} />
                  <Text style={s.memberTitle}>Member</Text>
                  <Text style={s.memberHint}>(opsional)</Text>
                </View>

                {!p.memberState ? (
                  <MemberSearchSelect
                    onSelect={p.onSelectMember}
                    onScan={p.onScanMember}
                    loading={p.memberLoading}
                    error={p.memberError}
                  />
                ) : (
                  <View style={[s.memberCard, { borderColor: p.getTierColor(p.memberState.member.tier) + '60' }]}>
                    <View style={[s.memberAvatar, { backgroundColor: p.getTierColor(p.memberState.member.tier) + '20' }]}>
                      <Crown size={16} color={p.getTierColor(p.memberState.member.tier)} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.memberName}>{p.memberState.member.name}</Text>
                      <View style={s.row}>
                        <View style={[s.tierBadge, { backgroundColor: p.getTierColor(p.memberState.member.tier) + '20' }]}>
                          <Text style={[s.tierText, { color: p.getTierColor(p.memberState.member.tier) }]}>{p.memberState.member.tier}</Text>
                        </View>
                        <Text style={s.poinText}>{p.memberState.member.poin} poin</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={p.onRemoveMember}><XCircle size={20} color="#94A3B8" /></TouchableOpacity>
                  </View>
                )}

                {p.pendingNewMember && (
                  <View style={s.pendingHint}>
                    <Clock size={11} color="#F59E0B" />
                    <Text style={s.pendingHintText}>Belum tersimpan — disimpan setelah transaksi selesai</Text>
                  </View>
                )}
                {!!p.memberError && <Text style={s.errorText}>{p.memberError}</Text>}

                {p.memberState && p.memberState.member.poin > 0 && (() => {
                  const ms       = p.memberState!;
                  const fullAmt  = ms.member.poin * p.redeemRate;
                  const isCapped = ms.useRedeem && ms.redeemAmt < fullAmt;
                  const returned = ms.member.poin - ms.pointsRedeemed;

                  // redeemRate 0 = fitur redeem dinonaktifkan
                  if (p.redeemRate === 0) return (
                    <View style={s.redeemDisabled}>
                      <Star size={13} color="#94A3B8" />
                      <Text style={s.redeemDisabledText}>
                        {ms.member.poin} poin tersimpan — redeem belum diaktifkan (atur di Pengaturan → Member)
                      </Text>
                    </View>
                  );

                  // Cek eligibility (cooldown + minimum poin)
                  const eligibility = p.checkRedeemEligibility(ms.member);
                  if (!eligibility.allowed) return (
                    <View style={s.redeemBlocked}>
                      <Star size={13} color="#94A3B8" />
                      <View style={{ flex: 1 }}>
                        <Text style={s.redeemBlockedTitle}>{ms.member.poin} poin · Tidak bisa redeem sekarang</Text>
                        <Text style={s.redeemBlockedReason}>{eligibility.reason}</Text>
                      </View>
                    </View>
                  );

                  return (
                    <TouchableOpacity style={[s.redeemBtn, ms.useRedeem && s.redeemBtnActive]} onPress={p.onToggleRedeem}>
                      <Star size={14} color={ms.useRedeem ? '#FFF' : COLORS.primary} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[s.redeemText, ms.useRedeem && { color: '#FFF' }]}>
                          {ms.useRedeem
                            ? `Pakai ${ms.pointsRedeemed} poin (−Rp ${ms.redeemAmt.toLocaleString('id-ID')})`
                            : `Tukar ${ms.member.poin} poin = Rp ${fullAmt.toLocaleString('id-ID')}`}
                        </Text>
                        {isCapped && (
                          <Text style={s.redeemCappedNote}>
                            {`Dipotong hingga total = 0 · ${returned} poin dikembalikan`}
                          </Text>
                        )}
                      </View>
                      {ms.useRedeem && <CheckCircle size={14} color="#FFF" style={{ marginLeft: 'auto' as any }} />}
                    </TouchableOpacity>
                  );
                })()}
              </View>
            )}

            {/* Ringkasan harga */}
            <View style={s.priceSummary}>
              <PriceRow label="Subtotal" value={`Rp ${p.subtotal.toLocaleString('id-ID')}`} />
              {!!p.memberState && p.memberState.discountAmt > 0 && (
                <PriceRow label={`Diskon ${p.memberState.discount}% (${p.memberState.member.tier})`}
                  value={`−Rp ${p.memberState.discountAmt.toLocaleString('id-ID')}`} color="#10B981" />
              )}
              {!!p.memberState && p.memberState.useRedeem && p.memberState.redeemAmt > 0 && (
                <PriceRow label="Redeem Poin" value={`−Rp ${p.memberState.redeemAmt.toLocaleString('id-ID')}`} color="#F59E0B" />
              )}
              <View style={[s.priceRow, s.priceRowTotal]}>
                <Text style={s.totalLabel}>Total Bayar</Text>
                <Text style={s.totalValue}>Rp {p.finalTotal.toLocaleString('id-ID')}</Text>
              </View>
            </View>

            {/* Cash / QRIS */}
            {p.paymentMethod === 'cash' ? (
              <>
                <View style={s.inputSection}>
                  <Text style={s.label}>Uang Diterima</Text>
                  <View style={s.inputRow}>
                    <Text style={s.rp}>Rp</Text>
                    <TextInput style={s.cashInput} keyboardType="numeric" placeholder="0" value={p.cashAmount} onChangeText={p.onCashChange} />
                  </View>
                </View>
                <View style={s.changeBox}>
                  <Text style={s.label}>Kembalian</Text>
                  <Text style={[s.changeValue, p.changeAmount < 0 && { color: COLORS.danger }]}>
                    Rp {p.changeAmount.toLocaleString('id-ID')}
                  </Text>
                </View>
              </>
            ) : (
              <View style={s.qrisBox}>
                <Image source={require('@/assets/images/qris.png')} style={s.qrisImage} resizeMode="contain" />
                <Text style={s.qrisHint}>Pelanggan silakan scan kode di atas</Text>
              </View>
            )}

            {/* Konfirmasi */}
            <TouchableOpacity
              style={[s.confirmBtn, (!p.canConfirm || p.memberBlocking) && s.confirmBtnDisabled]}
              onPress={p.onCheckout} disabled={p.loading || !p.canConfirm || p.memberBlocking}
            >
              {p.loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.confirmText}>Konfirmasi Pembayaran</Text>}
            </TouchableOpacity>

            {p.memberState && !p.memberState.member.isProspect && (
              <View style={[s.row, { justifyContent: 'center' }]}>
                <Star size={12} color="#F59E0B" />
                <Text style={s.poinInfo}>Member mendapat <Text style={s.poinBold}>+{p.memberState.pointsEarned} poin</Text></Text>
              </View>
            )}
            {p.memberBlocking && (
              <View style={s.warningBox}>
                <Text style={s.warningText}>Nomor HP pelanggan wajib diisi (mode Auto-capture aktif)</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Sub-components ────────────────────────────────────────

const PriceRow = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <View style={s.priceRow}>
    <Text style={[s.priceLabel, color ? { color } : {}]}>{label}</Text>
    <Text style={[s.priceValue, color ? { color } : {}]}>{value}</Text>
  </View>
);

// ── Styles ────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: H * 0.92, flex: 1 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 18, fontFamily: 'PoppinsBold', color: '#1E293B' },
  scroll:      { flex: 1 },
  body:        { padding: 20, gap: 16 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 6 },

  methodRow:       { flexDirection: 'row', gap: 12 },
  methodBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  methodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  methodText:      { fontSize: 14, fontFamily: 'PoppinsSemiBold', color: '#64748B' },
  methodTextActive:{ color: '#FFF' },

  memberSection:  { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, gap: 10 },
  memberTitle:    { fontSize: 13, fontFamily: 'PoppinsBold', color: COLORS.primary },
  memberHint:     { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  memberInputWrap:{ flex: 1, backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, height: 40 },
  memberInput:    { flex: 1, height: 40, fontSize: 14, fontFamily: 'PoppinsRegular', color: '#1E293B' },
  searchBtn:      { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  scanBtn:        { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  memberCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 12, borderWidth: 1.5, gap: 10 },
  memberAvatar:   { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  memberName:     { fontSize: 14, fontFamily: 'PoppinsBold', color: '#1E293B' },
  tierBadge:      { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  tierText:       { fontSize: 11, fontFamily: 'PoppinsBold' },
  poinText:       { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  pendingHint:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFFBEB', borderRadius: 6, padding: 7, borderWidth: 1, borderColor: '#FDE68A' },
  pendingHintText:{ flex: 1, fontSize: 11, fontFamily: 'PoppinsRegular', color: '#92400E', lineHeight: 16 },
  errorText:      { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#EF4444' },
  redeemBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary, backgroundColor: '#F0F9FF' },
  redeemBtnActive:{ backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  redeemText:     { flex: 1, fontSize: 12, fontFamily: 'PoppinsSemiBold', color: COLORS.primary },

  priceSummary: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, gap: 8 },
  priceRow:     { flexDirection: 'row', justifyContent: 'space-between' },
  priceRowTotal:{ borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8, marginTop: 4 },
  priceLabel:   { fontSize: 13, fontFamily: 'PoppinsRegular', color: '#64748B' },
  priceValue:   { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  totalLabel:   { fontSize: 15, fontFamily: 'PoppinsBold', color: '#1E293B' },
  totalValue:   { fontSize: 15, fontFamily: 'PoppinsBold', color: COLORS.primary },

  label:       { fontSize: 12, color: '#64748B', fontFamily: 'PoppinsMedium', marginBottom: 4 },
  inputSection:{ gap: 4 },
  inputRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 15 },
  rp:          { fontSize: 18, fontFamily: 'PoppinsBold', color: '#1E293B', marginRight: 5 },
  cashInput:   { flex: 1, height: 56, fontSize: 20, fontFamily: 'PoppinsBold', color: '#1E293B' },
  changeBox:   { backgroundColor: '#F0F9FF', padding: 15, borderRadius: 12 },
  changeValue: { fontSize: 22, fontFamily: 'PoppinsBold', color: COLORS.secondary },
  qrisBox:     { alignItems: 'center', padding: 10, backgroundColor: '#F8FAFC', borderRadius: 16 },
  qrisImage:   { width: 180, height: 180 },
  qrisHint:    { marginTop: 8, fontSize: 12, fontFamily: 'PoppinsMedium', color: '#64748B' },

  confirmBtn:        { backgroundColor: COLORS.secondary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  confirmBtnDisabled:{ backgroundColor: '#CBD5E1' },
  confirmText:       { color: '#FFF', fontSize: 16, fontFamily: 'PoppinsBold' },
  poinInfo:          { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#64748B' },
  poinBold:          { fontFamily: 'PoppinsBold', color: '#F59E0B' },
  warningBox:        { backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#FDE68A' },
  warningText:       { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#92400E', textAlign: 'center' },
  disabled:          { opacity: 0.5 },
  redeemDisabled:     { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  redeemCappedNote:   { fontSize: 11, fontFamily: 'PoppinsRegular', color: 'rgba(255,255,255,0.75)' },
  redeemBlocked:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA' },
  redeemBlockedTitle: { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#92400E' },
  redeemBlockedReason:{ fontSize: 11, fontFamily: 'PoppinsRegular', color: '#B45309', marginTop: 2 },
  redeemDisabledText: { flex: 1, fontSize: 12, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
});