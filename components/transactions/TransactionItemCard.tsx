import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight, ShoppingBag, User, Banknote, QrCode } from 'lucide-react-native';
import { Transaction } from '../../types/transaction.type';
import { formatCurrency, getDisplayId } from '../../utils/transactionsUtils';
import { TransactionModal } from './TransactionModal';
import { styles } from './transactionStyles';

interface Props {
  transaction: Transaction;
  isAdmin: boolean;
}

export const TransactionItemCard: React.FC<Props> = ({ transaction, isAdmin }) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const isQris = transaction.paymentMethod === 'qris';
  const themeColor = isQris ? '#F59E0B' : '#16A34A';
  const themeBgSoft = isQris ? '#FFFBEB' : '#ECFDF5';

  const date = transaction.date?.toDate?.() || transaction.createdAt?.toDate?.() || new Date();

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.idContainer}>
              <Text style={styles.idText}>{getDisplayId(transaction)}</Text>
              <View style={[styles.methodBadge, { backgroundColor: themeBgSoft }]}>
                {isQris ? <QrCode size={10} color={themeColor} /> : <Banknote size={10} color={themeColor} />}
                <Text style={[styles.methodBadgeText, { color: themeColor }]}>
                  {isQris ? 'QRIS' : 'TUNAI'}
                </Text>
              </View>
            </View>

            {isAdmin && transaction.cashierName && (
              <View style={styles.cashierBadge}>
                <User size={10} color="#64748B" />
                <Text style={styles.cashierName}>{transaction.cashierName}</Text>
              </View>
            )}
          </View>

          <Text style={styles.dateText}>
            {date.toLocaleDateString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </Text>

          <View style={styles.footerRow}>
            <Text style={styles.totalText}>{formatCurrency(transaction.total)}</Text>
            <View style={styles.itemBadge}>
              <ShoppingBag size={12} color="#64748B" />
              <Text style={styles.itemCount}>{transaction.items.length} produk</Text>
            </View>
          </View>
        </View>
        <ChevronRight size={18} color="#CBD5E1" />
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