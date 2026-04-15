import React from 'react';
import { View, Text } from 'react-native';
import { TransactionItem } from '../../types/transaction.type'; 
import { formatCurrency } from '../../utils/transactionsUtils';
import { styles } from './transactionStyles';

interface Props {
  item: TransactionItem;
  index: number;
}

export const TransactionProductItem: React.FC<Props> = ({ item, index }) => {
  // ✅ Perbaikan: Gunakan 'name' sesuai interface Product Anda
  // Kita gunakan pengecekan ganda (item.name || item.productName) untuk keamanan historis
  const displayItemName = (item as any).name || item.productName || 'Produk Tanpa Nama';
  
  return (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <Text style={styles.productIndex}>{index + 1}.</Text>
        <Text style={styles.productName} numberOfLines={2}>
          {displayItemName}
        </Text>
      </View>

      <View style={styles.productDetailRow}>
        <Text style={styles.productDetailLabel}>Jumlah</Text>
        <Text style={styles.productDetailValue}>
          {item.qty} x {formatCurrency(item.price)}
        </Text>
      </View>

      <View style={styles.productSubtotalRow}>
        <Text style={styles.productSubtotalLabel}>Subtotal</Text>
        <Text style={styles.productSubtotalValue}>
          {formatCurrency(item.subtotal)}
        </Text>
      </View>
    </View>
  );
};