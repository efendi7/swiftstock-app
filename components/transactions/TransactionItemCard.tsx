import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Transaction } from '../../hooks/useTransaction';
import { formatCurrency, getDisplayId } from '../../utils/transactionsUtils';
import { styles } from './styles';

interface Props {
  transaction: Transaction;
  isAdmin: boolean;
  onPress: () => void;
}

export const TransactionItemCard: React.FC<Props> = ({ transaction, isAdmin, onPress }) => {
  const displayId = getDisplayId(transaction);

  return (
    <TouchableOpacity style={styles.transactionCard} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.idBadge}>
          <Text style={styles.transactionId}>{displayId}</Text>
        </View>
        <Text style={styles.transactionDate}>
          {new Date(transaction.date.toMillis()).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {isAdmin && transaction.cashierName && (
        <View style={styles.cashierSection}>
          <Text style={styles.cashierLabel}>Kasir:</Text>
          <Text style={styles.cashierName}>{transaction.cashierName}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemCount}>{transaction.items.length} item</Text>
        </View>
        <Text style={styles.transactionTotal}>{formatCurrency(transaction.total)}</Text>
      </View>
    </TouchableOpacity>
  );
};