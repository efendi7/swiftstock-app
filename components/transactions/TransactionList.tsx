import React, { useCallback } from 'react';
import { FlatList, View, Text, ActivityIndicator } from 'react-native';
import { Transaction } from '../../hooks/useTransaction';
import { TransactionItemCard } from './TransactionItemCard';
import { styles } from './styles';

interface Props {
  transactions: Transaction[];
  searchInput: string;
  isAdmin: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
  onItemPress: (transaction: Transaction) => void;
  insets: { bottom: number };
}

export const TransactionList: React.FC<Props> = ({
  transactions,
  searchInput,
  isAdmin,
  loadingMore,
  hasMore,
  loadMore,
  refetch,
  onItemPress,
  insets,
}) => {
  const clientFiltered = useCallback(() => {
    if (!searchInput.trim()) return transactions;
    const lower = searchInput.toLowerCase();
    return transactions.filter(t =>
      t.id.toLowerCase().includes(lower) ||
      (t.transactionNumber || '').toLowerCase().includes(lower) ||
      (t.cashierName || '').toLowerCase().includes(lower) ||
      (t.cashierEmail || '').toLowerCase().includes(lower)
    );
  }, [transactions, searchInput]);

  const renderItem = ({ item }: { item: Transaction }) => (
    <TransactionItemCard transaction={item} isAdmin={isAdmin} onPress={() => onItemPress(item)} />
  );

  const renderFooter = () => loadingMore ? (
    <View style={styles.footerLoader}>
      <ActivityIndicator size="small" color="#00A79D" />
      <Text style={styles.footerText}>Memuat lebih banyak...</Text>
    </View>
  ) : null;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchInput ? 'Tidak ada transaksi yang sesuai' : 'Tidak ada transaksi'}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={clientFiltered()}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      contentContainerStyle={[
        styles.listContainer,
        { paddingBottom: insets.bottom + 90 },
        clientFiltered().length === 0 && styles.listContainerEmpty
      ]}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onRefresh={refetch}
      refreshing={false}
      onEndReached={() => {
        if (hasMore && !loadingMore && !searchInput) loadMore();
      }}
      onEndReachedThreshold={0.5}
    />
  );
};