import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { QrCode, Banknote, User, ShoppingBag, ChevronRight } from 'lucide-react-native';
import { Transaction } from '@/types/transaction.type';
import { formatCurrency, getDisplayId } from '@/utils/transactionsUtils';
import { TransactionModal } from '@components/transactions/TransactionModal';

interface Props {
  transaction: Transaction;
  isAdmin:     boolean;
}

export const TransactionItemCard: React.FC<Props> = ({ transaction, isAdmin }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const isQris      = transaction.paymentMethod === 'qris';
  const themeColor  = isQris ? '#D97706' : '#16A34A';
  const themeBgSoft = isQris ? '#FEF3C7' : '#ECFDF5';

  const date = transaction.date?.toDate?.()
    || transaction.createdAt?.toDate?.()
    || new Date();

  const itemCount = transaction.items?.length ?? 0;
  const hasMember = !!transaction.member;

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        {/* ICON CONTAINER — mirip imageContainer di ProductCard */}
        <View style={[styles.iconContainer, { backgroundColor: themeBgSoft }]}>
          {isQris
            ? <QrCode   size={28} color={themeColor} />
            : <Banknote size={28} color={themeColor} />}
        </View>

        {/* CONTENT AREA — split kiri & kanan */}
        <View style={styles.contentWrapper}>

          {/* KIRI: Nomor transaksi, tanggal, total */}
          <View style={styles.leftContent}>
            <Text style={styles.transactionNo} numberOfLines={1}>
              {getDisplayId(transaction)}
            </Text>

            <Text style={styles.dateText} numberOfLines={1}>
              {date.toLocaleDateString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </Text>

            <Text style={styles.totalText}>
              {formatCurrency(transaction.total)}
            </Text>
          </View>

          {/* KANAN: badges + chevron */}
          <View style={styles.rightContent}>

            {/* Badge metode bayar */}
            <View style={[styles.methodBadge, { backgroundColor: themeBgSoft }]}>
              <Text style={[styles.methodText, { color: themeColor }]}>
                {isQris ? 'QRIS' : 'TUNAI'}
              </Text>
            </View>

            {/* Badge jumlah produk */}
            <View style={styles.itemsBadge}>
              <ShoppingBag size={9} color="#64748B" />
              <Text style={styles.itemsText}>{itemCount} produk</Text>
            </View>

            {/* Badge member (ungu) atau kasir (abu) */}
            {hasMember ? (
              <View style={styles.memberBadge}>
                <User size={9} color="#7C3AED" />
                <Text style={styles.memberText} numberOfLines={1}>
                  {transaction.member!.memberName}
                </Text>
              </View>
            ) : isAdmin && transaction.cashierName ? (
              <View style={styles.cashierBadge}>
                <User size={9} color="#64748B" />
                <Text style={styles.cashierText} numberOfLines={1}>
                  {transaction.cashierName}
                </Text>
              </View>
            ) : null}

            <ChevronRight size={14} color="#CBD5E1" style={styles.chevron} />
          </View>

        </View>
      </TouchableOpacity>

      <TransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        transaction={transaction}
        themeColor={themeColor}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  iconContainer: {
    width: 75,
    height: 75,
    borderRadius: 16,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  contentWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    height: 75,
  },

  // Kiri
  leftContent: {
    flex: 1,
    justifyContent: 'space-between',
    height: '100%',
    marginRight: 8,
  },
  transactionNo: {
    fontSize: 14,
    fontFamily: 'PoppinsBold',
    color: '#1E293B',
    lineHeight: 18,
  },
  dateText: {
    fontSize: 10,
    fontFamily: 'PoppinsRegular',
    color: '#94A3B8',
    lineHeight: 14,
  },
  totalText: {
    fontSize: 15,
    fontFamily: 'PoppinsBold',
    color: '#0F172A',
    lineHeight: 20,
  },

  // Kanan
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    gap: 4,
  },

  methodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  methodText: {
    fontSize: 9,
    fontFamily: 'PoppinsBold',
    letterSpacing: 0.4,
  },

  itemsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemsText: {
    fontSize: 9,
    fontFamily: 'PoppinsSemiBold',
    color: '#64748B',
  },

  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 110,
  },
  memberText: {
    fontSize: 9,
    fontFamily: 'PoppinsSemiBold',
    color: '#7C3AED',
  },

  cashierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: 110,
  },
  cashierText: {
    fontSize: 9,
    fontFamily: 'PoppinsSemiBold',
    color: '#64748B',
  },

  chevron: {
    marginTop: 'auto' as any,
  },
});