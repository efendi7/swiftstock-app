import React from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { X, QrCode, Banknote, Clock, User, ShoppingBag, ShieldCheck } from 'lucide-react-native';
import { Transaction } from '@/types/transaction.type';
import { formatCurrency, formatDate, getDisplayId } from '@/utils/transactionsUtils';

interface ModalProps {
  visible:     boolean;
  onClose:     () => void;
  transaction: Transaction;
  themeColor:  string;
}

const PRIMARY = '#1C3A5A';

export const TransactionModal: React.FC<ModalProps> = ({
  visible, onClose, transaction, themeColor,
}) => {
  const isQris    = transaction.paymentMethod === 'qris';
  const cashPaid  = transaction.cashAmount ?? (transaction as any).cashPaid ?? 0;
  const changeAmt = transaction.changeAmount ?? 0;

  const date = transaction.date?.toDate?.()
    || transaction.createdAt?.toDate?.()
    || new Date();

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.sheet}>

          {/* Drag handle */}
          <View style={s.handle} />

          {/* ── HEADER ──────────────────────────────── */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              {/* Icon metode */}
              <View style={[s.headerIcon, { backgroundColor: isQris ? '#FEF3C7' : '#ECFDF5' }]}>
                {isQris
                  ? <QrCode   size={18} color="#D97706" />
                  : <Banknote size={18} color="#059669" />}
              </View>
              <View>
                <Text style={s.headerTitle}>{getDisplayId(transaction)}</Text>
                <Text style={s.headerSub}>
                  {isQris ? 'QRIS' : 'Tunai'} · {date.toLocaleDateString('id-ID', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* ── SCROLLABLE BODY ──────────────────────── */}
          <ScrollView
            style={s.body}
            contentContainerStyle={s.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Info kasir */}
            {transaction.cashierName ? (
              <View style={s.cashierRow}>
                <User size={13} color="#94A3B8" />
                <Text style={s.cashierText}>Kasir: {transaction.cashierName}</Text>
              </View>
            ) : null}

            {/* Member */}
            {transaction.member && (
              <View style={s.memberCard}>
                <View style={s.memberCardHeader}>
                  <User size={13} color={PRIMARY} />
                  <Text style={s.memberCardTitle}>Member</Text>
                  <View style={s.tierBadge}>
                    <Text style={s.tierBadgeText}>{transaction.member.tierName}</Text>
                  </View>
                </View>
                <View style={s.memberRow}>
                  <Text style={s.memberLabel}>Nama</Text>
                  <Text style={s.memberValue}>{transaction.member.memberName}</Text>
                </View>
                <View style={s.memberRow}>
                  <Text style={s.memberLabel}>Diskon</Text>
                  <Text style={s.memberValue}>
                    {transaction.member.discountPercent}%
                    {transaction.member.discountAmount > 0
                      ? `  (−${formatCurrency(transaction.member.discountAmount)})`
                      : ''}
                  </Text>
                </View>
                <View style={s.memberRow}>
                  <Text style={s.memberLabel}>Poin Didapat</Text>
                  <Text style={[s.memberValue, { color: '#10B981' }]}>
                    +{transaction.member.pointsEarned ?? 0}
                  </Text>
                </View>
              </View>
            )}

            {/* Produk — struk style */}
            <View style={s.receiptCard}>
              {/* Header struk */}
              <View style={s.receiptCardHeader}>
                <ShoppingBag size={13} color={PRIMARY} />
                <Text style={s.receiptCardTitle}>Produk Dibeli</Text>
                <Text style={s.receiptCardCount}>{transaction.items.length} item</Text>
              </View>

              {/* Label kolom */}
              <View style={s.colHeader}>
                <Text style={[s.colLabel, { flex: 1 }]}>Nama</Text>
                <Text style={[s.colLabel, s.tCenter, { width: 30 }]}>Qty</Text>
                <Text style={[s.colLabel, s.tRight,  { width: 88 }]}>Subtotal</Text>
              </View>
              <DashLine />

              {/* List produk */}
              {transaction.items.map((item, idx) => {
                const name = (item as any).name || item.productName || 'Produk';
                return (
                  <View key={idx}>
                    <View style={s.receiptRow}>
                      <View style={{ flex: 1, marginRight: 6 }}>
                        <Text style={s.receiptName} numberOfLines={2}>{name}</Text>
                        <Text style={s.receiptPrice}>{formatCurrency(item.price)}/pcs</Text>
                      </View>
                      <Text style={[s.receiptQty, s.tCenter]}>{item.qty}</Text>
                      <Text style={[s.receiptSub, s.tRight, { color: PRIMARY }]}>
                        {formatCurrency(item.subtotal)}
                      </Text>
                    </View>
                    {idx < transaction.items.length - 1 && <View style={s.itemSep} />}
                  </View>
                );
              })}

              <DashLine />

              {/* Footer struk */}
              <View style={s.receiptFooter}>
                <Text style={s.receiptFooterLabel}>
                  {transaction.items.reduce((a, i) => a + i.qty, 0)} produk
                </Text>
                <Text style={[s.receiptFooterTotal, { color: PRIMARY }]}>
                  {formatCurrency(transaction.items.reduce((a, i) => a + i.subtotal, 0))}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* ── FIXED FOOTER — PAYMENT ───────────────── */}
          <View style={[s.payBlock, { backgroundColor: PRIMARY }]}>
            {/* Total */}
            <View style={s.payRowTotal}>
              <Text style={s.payLabelTotal}>Total Tagihan</Text>
              <Text style={s.payValueTotal}>{formatCurrency(transaction.total)}</Text>
            </View>
            <View style={s.payDivider} />
            {/* Detail bayar */}
            {isQris ? (
              <View style={s.payRow}>
                <Text style={s.payLabel}>Status</Text>
                <View style={s.qrisRow}>
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

        </View>
      </View>
    </Modal>
  );
};

// ── HELPERS ───────────────────────────────────────────────
const DashLine = () => <View style={s.dashLine} />;

// ── STYLES ────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    overflow: 'hidden',
  },

  // Drag handle
  handle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 12, marginBottom: 4,
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 14, fontFamily: 'PoppinsBold', color: '#1E293B' },
  headerSub:   { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 2 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },

  // Body
  body:        { flexShrink: 1 },
  bodyContent: { padding: 16, gap: 12 },

  // Cashier row
  cashierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cashierText: { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#64748B' },

  // Member card
  memberCard: {
    backgroundColor: '#F0F4F8',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: `${PRIMARY}20`,
  },
  memberCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  memberCardTitle: { fontSize: 13, fontFamily: 'PoppinsBold', color: PRIMARY, flex: 1 },
  tierBadge: {
    backgroundColor: `${PRIMARY}18`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  tierBadgeText: { fontSize: 11, fontFamily: 'PoppinsBold', color: PRIMARY },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: `${PRIMARY}12`,
  },
  memberLabel: { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#64748B' },
  memberValue: { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },

  // Receipt card
  receiptCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  receiptCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  receiptCardTitle: { fontSize: 13, fontFamily: 'PoppinsBold', color: '#1E293B', flex: 1 },
  receiptCardCount: { fontSize: 11, fontFamily: 'PoppinsMedium', color: '#94A3B8' },

  // Kolom header label
  colHeader: { flexDirection: 'row', paddingHorizontal: 2, paddingBottom: 4 },
  colLabel: {
    fontSize: 10, fontFamily: 'PoppinsBold',
    color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4,
  },

  // Garis putus
  dashLine: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    marginVertical: 8,
  },

  // Baris produk
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 2,
  },
  receiptName:  { fontSize: 13, fontFamily: 'PoppinsMedium', color: '#1E293B' },
  receiptPrice: { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 2 },
  receiptQty:   { width: 30, fontSize: 13, fontFamily: 'PoppinsBold', color: '#475569' },
  receiptSub:   { width: 88, fontSize: 13, fontFamily: 'PoppinsBold' },
  itemSep:      { height: 1, backgroundColor: '#F1F5F9' },

  // Footer struk
  receiptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingTop: 2,
  },
  receiptFooterLabel: { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  receiptFooterTotal: { fontSize: 15, fontFamily: 'PoppinsBold' },

  // Alignment
  tCenter: { textAlign: 'center' },
  tRight:  { textAlign: 'right'  },

  // Payment footer
  payBlock:      { paddingHorizontal: 20, paddingVertical: 16 },
  payRowTotal:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  payLabelTotal: { fontSize: 13, fontFamily: 'PoppinsMedium', color: 'rgba(255,255,255,0.75)' },
  payValueTotal: { fontSize: 24, fontFamily: 'PoppinsBold', color: '#FFF' },
  payDivider:    { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 10 },
  payRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  payLabel:      { fontSize: 12, fontFamily: 'PoppinsRegular', color: 'rgba(255,255,255,0.7)' },
  payValue:      { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#FFF' },
  qrisRow:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
});