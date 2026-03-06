import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { Transaction } from '../../types/transaction.type';
import { TransactionItemCard } from './TransactionItemCard';

interface Props {
  transactions:           Transaction[];
  searchInput:            string;
  isAdmin:                boolean;
  refetch:                () => void;
  insets:                 { bottom: number };
  refreshing:             boolean;
  // ✅ Load more props baru
  onEndReached?:          () => void;
  onEndReachedThreshold?: number;
  ListFooterComponent?:   React.ReactElement | null;
}

export const TransactionList: React.FC<Props> = ({
  transactions, searchInput, isAdmin, refetch, insets, refreshing,
  onEndReached, onEndReachedThreshold = 0.3, ListFooterComponent,
}) => {
  return (
    <FlatList
      data={transactions}
      renderItem={({ item }) => <TransactionItemCard transaction={item} isAdmin={isAdmin} />}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100, paddingTop: 20 }]}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchInput ? 'Tidak ditemukan' : 'Belum ada transaksi'}
          </Text>
        </View>
      }
      onRefresh={refetch}
      refreshing={refreshing}
      showsVerticalScrollIndicator={false}
      // ✅ Load more
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListFooterComponent={ListFooterComponent}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: { paddingHorizontal: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 },
  emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: 16, fontFamily: 'PoppinsRegular' },
});