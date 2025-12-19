import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StatusBar, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore'; // Tambahkan 'where'
import { db, auth } from '../../services/firebaseConfig'; // Tambahkan 'auth'
import { TransactionSearchBar, TransactionFilterSection, TransactionList } from '../../components/transactions';
import { FilterMode, SortType, Transaction } from '../../types/transaction.type';

const TransactionScreen = () => {
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedSort, setSelectedSort] = useState<SortType>('latest');

  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // LOGIKA DETEKSI ROLE (Admin/Kasir)
  useEffect(() => {
    const checkRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdTokenResult();
        setIsAdmin(token.claims.role === 'admin');
      }
    };
    checkRole();
  }, []);

  // FETCH DATA DENGAN FILTER ROLE
  const loadTransactions = useCallback(async () => {
    try {
      setRefreshing(true);
      const user = auth.currentUser;
      if (!user) return;

      let q;
      const transactionsRef = collection(db, 'transactions');

      if (isAdmin) {
        // Jika ADMIN: Ambil semua transaksi
        q = query(transactionsRef, orderBy('createdAt', 'desc'));
      } else {
        // Jika KASIR: Hanya ambil transaksi miliknya sendiri berdasarkan cashierId
        q = query(
          transactionsRef,
          where('cashierId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const transactionsList: Transaction[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Transaction));
      
      setTransactions(transactionsList);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]); // Re-run ketika status isAdmin berubah

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // CLIENT-SIDE FILTERING (Sama seperti sebelumnya)
  const filteredData = useMemo(() => {
    let filtered = [...transactions];

    if (searchInput.trim()) {
      const lower = searchInput.toLowerCase();
      filtered = filtered.filter(t => 
        t.id.toLowerCase().includes(lower) || 
        (t.transactionNumber || '').toLowerCase().includes(lower) || 
        (t.cashierName || '').toLowerCase().includes(lower)
      );
    }

    if (filterMode === 'today') {
      const today = new Date();
      filtered = filtered.filter(t => {
        if (!t.createdAt) return false;
        const date = t.createdAt.toDate();
        return date.toDateString() === today.toDateString();
      });
    }

    if (filterMode === 'specificMonth') {
      filtered = filtered.filter(t => {
        if (!t.createdAt) return false;
        const date = t.createdAt.toDate();
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      });
    }

    filtered.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
      const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
      return selectedSort === 'latest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [transactions, searchInput, filterMode, selectedSort, selectedMonth, selectedYear]);

  if (loading && transactions.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <LinearGradient colors={['#00A79D', '#00D4C8']} style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.headerTitle}>{isAdmin ? 'Laporan Penjualan' : 'Riwayat Saya'}</Text>
        {isAdmin && <Text style={styles.adminText}>Mode Admin</Text>}
      </LinearGradient>

      <View style={styles.contentWrapper}>
        <View style={styles.searchContainer}>
          <TransactionSearchBar value={searchInput} onChangeText={setSearchInput} isAdmin={isAdmin} />
        </View>

        <TransactionFilterSection
          filterMode={filterMode}
          selectedSort={selectedSort}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          transactionCount={filteredData.length}
          onFilterChange={(mode) => {
            setFilterMode(mode);
            if (mode !== 'specificMonth') setSelectedMonth(new Date().getMonth());
          }}
          onSortChange={setSelectedSort}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />

        <TransactionList
          transactions={filteredData}
          searchInput={searchInput}
          isAdmin={isAdmin}
          refetch={loadTransactions}
          insets={insets}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#00A79D' },
  header: { paddingHorizontal: 20, paddingBottom: 25 },
  headerTitle: { fontSize: 24, fontFamily: 'PoppinsBold', color: '#FFF' },
  adminText: { color: '#E0F2F1', fontSize: 12, fontFamily: 'PoppinsMedium' },
  contentWrapper: { flex: 1, backgroundColor: '#F8FAFC', borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden' },
  searchContainer: { padding: 16 }
});

export default TransactionScreen;