/**
 * CashierScreen.tsx — render only
 * Logic di useCashier, modal pembayaran di PaymentModal.
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput,
  Modal, SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Scan, Trash2, Plus, Minus, CreditCard, PackageOpen,
  Lightbulb, X, Crown, UserPlus, BadgeCheck, Clock, Ban, ChevronRight,
} from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import { ScreenHeader }       from '@components/common/ScreenHeader';
import { RoundedContentScreen } from '@components/common/RoundedContentScreen';
import BarcodeScannerScreen   from './BarcodeScannerScreen';
import { PaymentModal }       from '@components/cashier/PaymentModal';
import { useCashier }         from '@hooks/useCashier';

const CashierScreen = () => {
  const insets = useSafeAreaInsets();
  const c      = useCashier();
  const [showScanner, setShowScanner] = useState(false);

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScreenHeader title="Kasir Digital" subtitle="Scan barcode untuk mulai transaksi" />

      <RoundedContentScreen>
        {/* Scan */}
        <View style={s.actionRow}>
          <TouchableOpacity style={s.scanBtn} onPress={() => setShowScanner(true)}>
            <Scan size={24} color="#FFF" />
            <Text style={s.scanBtnText}>Scan Produk</Text>
          </TouchableOpacity>
        </View>

        {/* Info bar */}
        <View style={s.infoBar}>
          <InfoItem label="Jenis Produk" value={String(c.cart.length)} />
          <InfoItem label="Total Qty"    value={String(c.cart.reduce((t: number, i) => t + i.qty, 0))} />
        </View>

        {/* Cart */}
        <FlatList
          data={c.cart}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: c.cart.length > 0 ? 300 : 100 }}
          renderItem={({ item }) => (
            <View style={s.cartCard}>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={s.itemPrice}>Rp {item.price.toLocaleString('id-ID')}</Text>
              </View>
              <View style={s.qtyRow}>
                <TouchableOpacity style={s.qtyBtn} onPress={() => c.updateQty(item.id, item.qty - 1)}>
                  {item.qty === 1 ? <Trash2 size={16} color={COLORS.danger} /> : <Minus size={16} color={COLORS.primary} />}
                </TouchableOpacity>
                <Text style={s.qtyText}>{item.qty}</Text>
                <TouchableOpacity style={s.qtyBtn} onPress={() => c.updateQty(item.id, item.qty + 1)}>
                  <Plus size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <PackageOpen size={64} color="#CBD5E1" />
              <Text style={s.emptyText}>Keranjang masih kosong</Text>
            </View>
          }
        />

        {/* Summary */}
        {c.cart.length > 0 && (
          <View style={[s.summary, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total Pembayaran</Text>
              <Text style={s.totalAmount}>Rp {c.subtotal.toLocaleString('id-ID')}</Text>
            </View>
            <TouchableOpacity style={[s.checkoutBtn, c.loading && s.disabled]} onPress={() => c.setShowPaymentModal(true)} disabled={c.loading}>
              <CreditCard size={20} color="#FFF" />
              <Text style={s.checkoutText}>Bayar Sekarang</Text>
            </TouchableOpacity>
            <View style={s.tip}>
              <Lightbulb size={16} color={COLORS.secondary} />
              <Text style={s.tipText}>Pastikan jumlah barang sesuai fisik sebelum menekan bayar.</Text>
            </View>
          </View>
        )}
      </RoundedContentScreen>

      {/* Payment modal */}
      <PaymentModal
        visible={c.showPaymentModal}    onClose={() => c.setShowPaymentModal(false)}
        subtotal={c.subtotal}           finalTotal={c.finalTotal}
        paymentMethod={c.paymentMethod} setPaymentMethod={c.setPaymentMethod}
        cashAmount={c.cashAmount}       changeAmount={c.changeAmount}
        onCashChange={c.handleCashChange}
        onCheckout={c.onCheckout}       loading={c.loading}
        canConfirm={c.canConfirm}       memberBlocking={c.memberBlocking}
        showMemberInput={c.showMemberInput}
        memberState={c.memberState}     memberLoading={c.memberLoading}
        memberError={c.memberError}     pendingNewMember={c.pendingNewMember}
        onSelectMember={c.handleSelectMember}
        onScanMember={() => c.setShowMemberScanner(true)}
        onRemoveMember={c.handleRemoveMember}
        onToggleRedeem={c.handleToggleRedeem}
        getTierColor={c.getTierColor}
        redeemRate={c.memberSettings.redeemRate}
        checkRedeemEligibility={c.checkRedeemEligibility}
      />

      {/* Modal pendaftaran member bersyarat */}
      <RegFeeModal
        visible={c.regFeePrompt}
        phone={c.phoneInput}
        fee={c.registrationFee}
        onSelectProspect={() => { c.handleCancelRegFee(); c.setShowNamePrompt(true); }}
        onSelectFull={() => { c.handleCancelRegFee(); c.setPendingPayFee(true); c.setShowNamePrompt(true); }}
        onCancel={c.handleCancelRegFee}
      />

      {/* Modal nama member baru */}
      <NamePromptModal
        visible={c.showNamePrompt}
        phone={c.phoneInput}
        name={c.pendingMemberName}
        nameError={c.nameInputError}
        onChangeName={(v: string) => { c.setPendingMemberName(v); c.setNameInputError(''); }}
        onConfirm={c.handleConfirmName}
        onCancel={() => c.setShowNamePrompt(false)}
      />

      <BarcodeScannerScreen visible={showScanner}         onClose={() => setShowScanner(false)}         onScan={c.getProductByBarcode} />
      <BarcodeScannerScreen visible={c.showMemberScanner} onClose={() => c.setShowMemberScanner(false)} onScan={c.handleMemberQRScanned} />
    </SafeAreaView>
  );
};

// ── Inline sub-components (kecil, tidak perlu file terpisah) ──

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={{ fontSize: 10, color: '#64748B', fontFamily: 'PoppinsRegular' }}>{label}</Text>
    <Text style={{ fontSize: 14, color: COLORS.primary, fontFamily: 'PoppinsBold' }}>{value}</Text>
  </View>
);

const RegFeeModal = ({ visible, phone, fee, onSelectProspect, onSelectFull, onCancel }: any) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={s.overlay}>
      <View style={s.modal}>
        <View style={s.modalIcon}><UserPlus size={28} color={COLORS.primary} /></View>
        <Text style={s.modalTitle}>Daftarkan Member Baru?</Text>
        <Text style={s.modalPhone}>{phone}</Text>
        <Text style={s.modalDesc}>Nomor ini belum terdaftar. Pilih cara pendaftaran:</Text>

        <TouchableOpacity style={s.optionCard} onPress={onSelectProspect}>
          <View style={[s.optionIcon, { backgroundColor: '#FFF7ED' }]}><Clock size={18} color="#F59E0B" /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.optionTitle}>Calon Member</Text>
            <Text style={s.optionDesc}>Gratis. Belum dapat poin & diskon. Upgrade otomatis saat syarat terpenuhi.</Text>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity style={[s.optionCard, s.optionCardPremium]} onPress={onSelectFull}>
          <View style={[s.optionIcon, { backgroundColor: '#EFF6FF' }]}><BadgeCheck size={18} color={COLORS.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[s.optionTitle, { color: COLORS.primary }]}>Langsung Member Penuh</Text>
            <Text style={s.optionDesc}>Bayar Rp {fee.toLocaleString('id-ID')}. Langsung dapat poin & diskon.</Text>
          </View>
          <ChevronRight size={16} color={COLORS.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, marginTop: 4 }} onPress={onCancel}>
          <Ban size={14} color="#94A3B8" />
          <Text style={{ fontSize: 12, fontFamily: 'PoppinsMedium', color: '#94A3B8' }}>Batal, tidak daftarkan member</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const NamePromptModal = ({ visible, phone, name, nameError, onChangeName, onConfirm, onCancel }: any) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={s.overlay}>
      <View style={s.modal}>
        <View style={[s.modalIcon, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
          <Crown size={28} color="#10B981" />
        </View>
        <Text style={s.modalTitle}>Nama Member Baru</Text>
        <Text style={s.modalPhone}>{phone}</Text>
        <View style={{ width: '100%', marginVertical: 12 }}>
          <TextInput
            style={[s.nameInput, nameError && s.nameInputErr]}
            placeholder="Masukkan nama lengkap..." placeholderTextColor="#CBD5E1"
            value={name} onChangeText={onChangeName}
            autoFocus returnKeyType="done" onSubmitEditing={onConfirm}
          />
          {!!nameError && <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{nameError}</Text>}
        </View>
        <Text style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginBottom: 20, fontFamily: 'PoppinsRegular' }}>
          Email bisa dilengkapi nanti via halaman Member.
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
          <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
            <Text style={{ fontSize: 14, fontFamily: 'PoppinsSemiBold', color: '#64748B' }}>Batal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.confirmBtn} onPress={onConfirm}>
            <Text style={{ fontSize: 14, fontFamily: 'PoppinsBold', color: '#FFF' }}>Daftar Sekarang</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ── Styles ────────────────────────────────────────────────

const s = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: COLORS.primary },
  actionRow:   { paddingHorizontal: 20, paddingTop: 10, marginBottom: 15 },
  scanBtn:     { backgroundColor: COLORS.secondary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 15, elevation: 4 },
  scanBtnText: { color: '#FFF', fontSize: 16, fontFamily: 'PoppinsBold', marginLeft: 10 },
  infoBar:     { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#F1F5F9', marginHorizontal: 20, padding: 10, borderRadius: 12, marginBottom: 10 },
  cartCard:    { backgroundColor: '#FFF', borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2 },
  itemName:    { fontSize: 15, fontFamily: 'PoppinsBold', color: '#1E293B' },
  itemPrice:   { fontSize: 13, color: COLORS.primary, fontFamily: 'PoppinsSemiBold' },
  qtyRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 4 },
  qtyBtn:      { padding: 8, backgroundColor: '#FFF', borderRadius: 8, elevation: 1 },
  qtyText:     { fontSize: 15, fontFamily: 'PoppinsBold', color: '#1E293B', marginHorizontal: 15, minWidth: 20, textAlign: 'center' },
  empty:       { alignItems: 'center', marginTop: 60 },
  emptyText:   { marginTop: 10, color: '#94A3B8', fontFamily: 'PoppinsMedium', fontSize: 16 },
  summary:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 20, borderTopLeftRadius: 32, borderTopRightRadius: 32, elevation: 25 },
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalLabel:  { fontSize: 14, color: '#64748B', fontFamily: 'PoppinsMedium' },
  totalAmount: { fontSize: 20, color: COLORS.secondary, fontFamily: 'PoppinsBold' },
  checkoutBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  checkoutText:{ color: '#FFF', fontSize: 16, fontFamily: 'PoppinsBold' },
  disabled:    { backgroundColor: '#CBD5E1' },
  tip:         { marginTop: 16, backgroundColor: '#F0FDF4', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#DCFCE7', flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tipText:     { flex: 1, fontSize: 11, fontFamily: 'PoppinsRegular', color: '#15803D', lineHeight: 16 },

  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modal:       { backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center' },
  modalIcon:   { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(28,58,90,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  modalTitle:  { fontSize: 18, fontFamily: 'PoppinsBold', color: '#1E293B', marginBottom: 4 },
  modalPhone:  { fontSize: 14, fontFamily: 'PoppinsSemiBold', color: COLORS.primary, marginBottom: 12 },
  modalDesc:   { fontSize: 13, fontFamily: 'PoppinsRegular', color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  optionCard:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10, width: '100%' },
  optionCardPremium:{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  optionIcon:  { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 13, fontFamily: 'PoppinsBold', color: '#1E293B', marginBottom: 3 },
  optionDesc:  { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#64748B', lineHeight: 16 },
  nameInput:   { backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 16, height: 48, fontSize: 15, fontFamily: 'PoppinsRegular', color: '#1E293B', width: '100%' },
  nameInputErr:{ borderColor: '#EF4444' },
  cancelBtn:   { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center' },
  confirmBtn:  { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
});

export default CashierScreen;