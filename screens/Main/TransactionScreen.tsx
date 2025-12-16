import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { db, auth } from '../../services/firebaseConfig';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from 'firebase/firestore';

interface TransactionItem {
  productId: string;
  qty: number;
  price: number;
}

interface Transaction {
  id: string;
  cashierId: string;
  total: number;
  date: Timestamp;
  items: TransactionItem[];
}

const TransactionScreen = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');

  useEffect(() => {
    loadTransactions();
  }, [selectedFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        Alert.alert('Error', 'User tidak terautentikasi');
        return;
      }

      // Tentukan rentang tanggal berdasarkan filter
      const now = new Date();
      let startDate = new Date();

      switch (selectedFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'all':
          startDate = new Date(0); // Dari awal waktu
          break;
      }

      // Query transactions
      let q = query(
        collection(db, 'transactions'),
        where('cashierId', '==', currentUser.uid),
        where('date', '>=', Timestamp.fromDate(startDate)),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const loadedTransactions: Transaction[] = [];

      querySnapshot.forEach((doc) => {
        loadedTransactions.push({
          id: doc.id,
          ...doc.data(),
        } as Transaction);
      });

      setTransactions(loadedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Gagal memuat transaksi');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const filteredTransactions = transactions.filter((transaction) =>
    transaction.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() => showTransactionDetail(item)}
    >
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionId}>#{item.id.substring(0, 8)}</Text>
        <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
      </View>
      
      <View style={styles.transactionBody}>
        <Text style={styles.itemCount}>{item.items.length} item</Text>
        <Text style={styles.transactionTotal}>{formatCurrency(item.total)}</Text>
      </View>
    </TouchableOpacity>
  );

  const showTransactionDetail = (transaction: Transaction) => {
    const itemDetails = transaction.items
      .map((item, index) => `${index + 1}. Qty: ${item.qty} x ${formatCurrency(item.price)}`)
      .join('\n');

    Alert.alert(
      `Detail Transaksi #${transaction.id.substring(0, 8)}`,
      `Tanggal: ${formatDate(transaction.date)}\n\nProduk:\n${itemDetails}\n\nTotal: ${formatCurrency(transaction.total)}`,
      [{ text: 'Tutup' }]
    );
  };

  const renderFilterButton = (filter: typeof selectedFilter, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filter && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Memuat transaksi...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Riwayat Transaksi</Text>
        <Text style={styles.subtitle}>
          Total: {filteredTransactions.length} transaksi
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari ID transaksi..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('today', 'Hari Ini')}
        {renderFilterButton('week', 'Minggu Ini')}
        {renderFilterButton('month', 'Bulan Ini')}
        {renderFilterButton('all', 'Semua')}
      </View>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Tidak ada transaksi</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={loadTransactions}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#E8F5E9',
    marginTop: 4,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  listContainer: {
    padding: 16,
  },
  transactionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transactionId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  transactionTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default TransactionScreen;