import React from 'react';
import { View, Text } from 'react-native';
import { formatCurrency } from '../../utils/transactionsUtils';
import { styles } from './transactionStyles';

export const TransactionProductItem = ({ item, index }: any) => (
  <View style={styles.productCard}>
    <View style={styles.productHeader}>
      <Text style={styles.productIndex}>{index + 1}.</Text>
      <Text style={styles.productName}>{item.productName || 'Produk'}</Text>
    </View>
    <View style={styles.productDetailRow}>
      <Text style={styles.productDetailLabel}>Jumlah</Text>
      <Text style={styles.productDetailValue}>{item.qty} x {formatCurrency(item.price)}</Text>
    </View>
    <View style={styles.productSubtotalRow}>
      <Text style={styles.productSubtotalLabel}>Subtotal</Text>
      <Text style={styles.productSubtotalValue}>
        {formatCurrency(item.subtotal ?? item.qty * item.price)}
      </Text>
    </View>
  </View>
);