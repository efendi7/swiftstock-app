import React from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import {
  X, QrCode, Banknote, User, ShieldCheck,
  ShoppingBag, Receipt, Clock, UserCheck, CreditCard,
} from 'lucide-react-native';
import { Transaction } from '@/types/transaction.type';
import { formatCurrency, formatDate } from '@/utils/transactionsUtils';

interface ModalProps {
  visible:     boolean;
  onClose:     () => void;
  transaction: Transaction | null;
  themeColor:  string;
}


const s = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  webOverlay: { justifyContent: 'center', alignItems: 'center' },

  // Web content
  webContent: {
    width: 860,
    maxWidth: '95%' as any,
    maxHeight: '88%' as any,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    display: 'flex' as any,
    flexDirection: 'column' as any,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 15, fontFamily: 'PoppinsBold', color: '#1E293B' },
  headerMeta:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  headerNo:    { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
  closeBtn:    {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
  },

  // Badge
  payBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  payBadgeText: { fontSize: 11, fontFamily: 'PoppinsBold' },
  badge:        { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeText:    { fontSize: 11, fontFamily: 'PoppinsBold' },

  // Web body
  webBody:    { flex: 1, flexDirection: 'row', overflow: 'hidden' as any, minHeight: 0 as any },
  colDivider: { width: 1, backgroundColor: '#F1F5F9' },

  // Mobile body
  mobileBody:        { flexShrink: 1 },
  mobileBodyContent: { padding: 14, gap: 12, paddingBottom: 8 },

  // Receipt column (web left)
  receiptCol: {
    flex: 1, flexDirection: 'column',
    padding: 18, overflow: 'hidden' as any,
  },
  receiptHeader:      { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  receiptHeaderTitle: { fontSize: 13, fontFamily: 'PoppinsBold', flex: 1 },
  receiptColHeader:   { flexDirection: 'row', paddingHorizontal: 2, paddingBottom: 4 },
  receiptColLabel: {
    fontSize: 10, fontFamily: 'PoppinsBold',
    color: '#94A3B8', textTransform: 'uppercase' as any, letterSpacing: 0.4,
  },
  receiptScroll:   { flex: 1 },
  receiptItem:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 2 },
  receiptItemName: { flex: 1, fontSize: 13, fontFamily: 'PoppinsMedium', color: '#1E293B', marginRight: 4 },
  receiptItemQty:  { width: 32, fontSize: 13, fontFamily: 'PoppinsBold', color: '#475569' },
  receiptItemPrice:{ width: 90, fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  receiptItemSub:  { width: 90, fontSize: 13, fontFamily: 'PoppinsBold' },
  receiptItemSep:  { height: 1, backgroundColor: '#F1F5F9' },
  receiptFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, paddingHorizontal: 2 },
  receiptFooterLabel:{ fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  receiptFooterValue:{ fontSize: 14, fontFamily: 'PoppinsBold' },

  // Mobile receipt struk
  mReceiptHeader: { flexDirection: 'row', paddingHorizontal: 2, paddingBottom: 4 },
  mReceiptLabel:  { fontSize: 10, fontFamily: 'PoppinsBold', color: '#94A3B8', textTransform: 'uppercase' as any, letterSpacing: 0.4 },
  mReceiptItem:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 2 },
  mReceiptName:   { fontSize: 13, fontFamily: 'PoppinsMedium', color: '#1E293B' },
  mReceiptPrice:  { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 2 },
  mReceiptQty:    { width: 28, fontSize: 13, fontFamily: 'PoppinsBold', color: '#475569' },
  mReceiptSub:    { width: 80, fontSize: 13, fontFamily: 'PoppinsBold' },

  // Right column (web)
  rightCol: { width: 270, flexDirection: 'column', padding: 16, gap: 12 },

  // Blocks
  block: {
    backgroundColor: '#F8FAFC', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: '#F1F5F9',
  },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  blockTitle:  { fontSize: 13, fontFamily: 'PoppinsBold', color: '#1E293B', flex: 1 },

  sep:     { height: 1, backgroundColor: '#E2E8F0' },
  dashLine:{ borderBottomWidth: 1, borderStyle: 'dashed' as any, borderColor: '#CBD5E1', marginVertical: 8 },

  infoRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabelWrap:{ flexDirection: 'row', alignItems: 'center' },
  infoLabel:    { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#64748B' },
  infoValue:    { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#1E293B', textAlign: 'right' as any, flex: 1, marginLeft: 8 },

  // Alignment
  tCenter: { textAlign: 'center' as any },
  tRight:  { textAlign: 'right'  as any },

  // Payment footer
  payBlock:      { paddingHorizontal: 20, paddingVertical: 14 },
  payRowTotal:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  payLabelTotal: { fontSize: 13, fontFamily: 'PoppinsMedium', color: 'rgba(255,255,255,0.8)' },
  payValueTotal: { fontSize: 22, fontFamily: 'PoppinsBold', color: '#FFF' },
  payDivider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 10 },
  payRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  payLabel:      { fontSize: 12, fontFamily: 'PoppinsRegular', color: 'rgba(255,255,255,0.75)' },
  payValue:      { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#FFF' },
  payQrisRow:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
});


const Sep      = () => <View style={s.sep} />;
const DashLine = () => <View style={s.dashLine} />;

const InfoRow = ({
  label, value, icon, valueColor,
}: {
  label: string; value: string; icon?: React.ReactNode; valueColor?: string;
}) => (
  <View style={s.infoRow}>
    <View style={s.infoLabelWrap}>
      {icon && <View style={{ marginRight: 5 }}>{icon}</View>}
      <Text style={s.infoLabel}>{label}</Text>
    </View>
    <Text style={[s.infoValue, valueColor ? { color: valueColor } : {}]} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

// ── STYLES ────────────────────────────────────────────────


export const TransactionModal: React.FC<ModalProps> = ({
  visible, onClose, transaction, themeColor,
}) => {
  if (!transaction) return null;

  const isQris    = transaction.paymentMethod === 'qris';
  const cashPaid  = transaction.cashAmount ?? (transaction as any).cashPaid ?? 0;
  const changeAmt = transaction.changeAmount ?? 0;

  // ── SHARED SUB-COMPONENTS ────────────────────────────────

  const PaymentBadge = () => (
    <View style={[
      s.payBadge,
      { backgroundColor: isQris ? '#FEF3C7' : '#ECFDF5',
        borderColor:      isQris ? '#C4B5FD' : '#6EE7B7' },
    ]}>
      {isQris
        ? <QrCode   size={11} color="#D97706" />
        : <Banknote size={11} color="#059669" />}
      <Text style={[s.payBadgeText, { color: isQris ? '#D97706' : '#059669' }]}>
        {isQris ? 'QRIS' : 'Tunai'}
      </Text>
    </View>
  );

  // Fixed footer — payment summary
  const PaymentFooter = () => (
    <View style={[s.payBlock, { backgroundColor: themeColor }]}>
      <View style={s.payRowTotal}>
        <Text style={s.payLabelTotal}>Total Tagihan</Text>
        <Text style={s.payValueTotal}>{formatCurrency(transaction.total)}</Text>
      </View>
      <View style={s.payDivider} />
      {isQris ? (
        <View style={s.payRow}>
          <Text style={s.payLabel}>Status Pembayaran</Text>
          <View style={s.payQrisRow}>
            <ShieldCheck size={13} color="#FFF" />
            <Text style={[s.payValue, { fontFamily: 'PoppinsBold' }]}>LUNAS (QRIS)</Text>
          </View>
        </View>
      ) : (
        <>
          <View style={s.payRow}>
            <Text style={s.payLabel}>Uang Tunai</Text>
            <Text style={s.payValue}>{formatCurrency(cashPaid)}</Text>
          </View>
          <View style={s.payRow}>
            <Text style={s.payLabel}>Kembalian</Text>
            <Text style={s.payValue}>{formatCurrency(changeAmt)}</Text>
          </View>
        </>
      )}
    </View>
  );

  // ── WEB MODAL ────────────────────────────────────────────
  // Struk column kiri — only items list scrolls
  const ReceiptColumn = () => (
    <View style={s.receiptCol}>
      <View style={s.receiptHeader}>
        <ShoppingBag size={13} color={themeColor} />
        <Text style={[s.receiptHeaderTitle, { color: themeColor }]}>Produk Dibeli</Text>
        <View style={[s.badge, { backgroundColor: themeColor + '18' }]}>
          <Text style={[s.badgeText, { color: themeColor }]}>{transaction.items.length} item</Text>
        </View>
      </View>

      {/* Kolom label */}
      <View style={s.receiptColHeader}>
        <Text style={[s.receiptColLabel, { flex: 1 }]}>Nama Produk</Text>
        <Text style={[s.receiptColLabel, s.tCenter, { width: 32 }]}>Qty</Text>
        <Text style={[s.receiptColLabel, s.tRight,  { width: 90 }]}>Harga</Text>
        <Text style={[s.receiptColLabel, s.tRight,  { width: 90 }]}>Subtotal</Text>
      </View>
      <DashLine />

      {/* Scroll hanya list produk */}
      <ScrollView style={s.receiptScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {transaction.items.map((item, idx) => {
          const name = (item as any).name || item.productName || 'Produk';
          return (
            <View key={idx}>
              <View style={s.receiptItem}>
                <Text style={s.receiptItemName} numberOfLines={2}>{name}</Text>
                <Text style={[s.receiptItemQty, s.tCenter]}>{item.qty}</Text>
                <Text style={[s.receiptItemPrice, s.tRight]}>{formatCurrency(item.price)}</Text>
                <Text style={[s.receiptItemSub, s.tRight, { color: themeColor }]}>
                  {formatCurrency(item.subtotal)}
                </Text>
              </View>
              {idx < transaction.items.length - 1 && <View style={s.receiptItemSep} />}
            </View>
          );
        })}
      </ScrollView>

      <DashLine />
      <View style={s.receiptFooter}>
        <Text style={s.receiptFooterLabel}>
          {transaction.items.reduce((acc, i) => acc + i.qty, 0)} produk
        </Text>
        <Text style={[s.receiptFooterValue, { color: themeColor }]}>
          {formatCurrency(transaction.items.reduce((acc, i) => acc + i.subtotal, 0))}
        </Text>
      </View>
    </View>
  );

  // Kolom kanan — info + member, stretches full height
  const RightColumn = () => (
    <View style={s.rightCol}>
      <View style={s.block}>
        <View style={s.blockHeader}>
          <Receipt size={14} color={themeColor} />
          <Text style={s.blockTitle}>Info Transaksi</Text>
        </View>
        <InfoRow label="Waktu"  value={formatDate(transaction.date || transaction.createdAt)} icon={<Clock size={13} color="#94A3B8" />} />
        <Sep />
        <InfoRow label="Kasir"  value={transaction.cashierName} icon={<UserCheck size={13} color="#94A3B8" />} />
        <Sep />
        <InfoRow label="Metode" value={isQris ? 'QRIS' : 'Tunai'} icon={<CreditCard size={13} color="#94A3B8" />} />
      </View>

      {transaction.member && (
        <View style={s.block}>
          <View style={s.blockHeader}>
            <User size={14} color={themeColor} />
            <Text style={s.blockTitle}>Member</Text>
            <View style={[s.badge, { backgroundColor: themeColor + '18' }]}>
              <Text style={[s.badgeText, { color: themeColor }]}>{transaction.member.tierName}</Text>
            </View>
          </View>
          <InfoRow label="Nama"         value={transaction.member.memberName} />
          <Sep />
          <InfoRow label="Diskon"       value={`${transaction.member.discountPercent}%  (−${formatCurrency(transaction.member.discountAmount)})`} />
          <Sep />
          <InfoRow label="Poin Didapat" value={`+${transaction.member.pointsEarned ?? 0}`} valueColor="#10B981" />
          {(transaction.member.pointsRedeemed ?? 0) > 0 && (
            <>
              <Sep />
              <InfoRow label="Poin Ditukar" value={`−${transaction.member.pointsRedeemed}  (${formatCurrency(transaction.member.redeemAmount ?? 0)})`} valueColor="#F59E0B" />
            </>
          )}
        </View>
      )}
      <View style={{ flex: 1 }} />
    </View>
  );

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={[s.overlay, s.webOverlay]}>
        <View style={s.webContent}>
          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.headerTitle}>Detail Transaksi</Text>
              <View style={s.headerMeta}>
                <Text style={s.headerNo}>{transaction.transactionNumber}</Text>
                <PaymentBadge />
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Body: 2 kolom */}
          <View style={s.webBody}>
            <ReceiptColumn />
            <View style={s.colDivider} />
            <RightColumn />
          </View>

          {/* Footer */}
          <PaymentFooter />
        </View>
      </View>
    </Modal>
  );
};

// ── HELPERS ───────────────────────────────────────────────