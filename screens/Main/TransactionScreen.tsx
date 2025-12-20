import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StatusBar, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { History, BarChart3 } from 'lucide-react-native';

import { db, auth } from '../../services/firebaseConfig';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { TransactionSearchBar, TransactionFilterSection, TransactionList } from '../../components/transactions';
import { FilterMode, SortType, Transaction } from '../../types/transaction.type';
import { COLORS } from '../../constants/colors';

const TransactionScreen = () => {
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const currentUser = auth.currentUser;

  const [searchInput, setSearchInput] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedSort, setSelectedSort] = useState<SortType>('latest');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Detect Role
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

  // Fetch Transactions with Role Filter
  const loadTransactions = useCallback(async () => {
    try {
      setRefreshing(true);
      const user = auth.currentUser;
      if (!user) return;

      let q;
      const transactionsRef = collection(db, 'transactions');

      if (isAdmin) {
        q = query(transactionsRef, orderBy('createdAt', 'desc'));
      } else {
        q = query(
          transactionsRef, 
          where('cashierId', '==', user.uid), 
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(list);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Search and Sort Logic
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

  // Dynamic Header Configuration
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const headerTitle = isAdmin ? `Semua Riwayat\nTransaksi` : `Riwayat Transaksi\nSaya`;
  const headerIcon = isAdmin ? <BarChart3 size={28} color="#FFF" /> : <History size={28} color="#FFF" />;

  if (loading && transactions.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScreenHeader 
        title={headerTitle}
        subtitle={userName}
        icon={headerIcon}
      />

      <View style={styles.contentWrapper}>
        <View style={styles.filterSearchContainer}>
          <TransactionSearchBar value={searchInput} onChangeText={setSearchInput} isAdmin={isAdmin} />
          
          <TransactionFilterSection
            filterMode={filterMode}
            selectedSort={selectedSort}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            transactionCount={filteredData.length}
            onFilterChange={setFilterMode}
            onSortChange={setSelectedSort}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
        </View>

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
  container: { flex: 1, backgroundColor: COLORS.primary },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  contentWrapper: { 
    flex: 1, 
    backgroundColor: '#F8FAFC', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    marginTop: -20, 
    overflow: 'hidden' 
  },
  filterSearchContainer: { 
    padding: 16,
    paddingBottom: 0
  }
});

export default TransactionScreen;