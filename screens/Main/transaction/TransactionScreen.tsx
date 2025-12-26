import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StatusBar, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { History, BarChart3 } from 'lucide-react-native';

import { db, auth } from '../../../services/firebaseConfig';
import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { TransactionFilterSection, TransactionList } from '../../../components/transactions';
import { FilterMode, SortType, Transaction } from '../../../types/transaction.type';
import { COLORS } from '../../../constants/colors';

const TransactionScreen = () => {
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const currentUser = auth.currentUser;

  // --- STATE FILTER & SEARCH ---
  const [searchInput, setSearchInput] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedSort, setSelectedSort] = useState<SortType>('latest');
  // Menggunakan selectedDate (Date) alih-alih Month/Year untuk sinkronisasi dengan DatePicker
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Detect Role (Admin/Kasir)
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

  // Fetch Data Transaksi
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

  // --- LOGIKA FILTERING & SEARCHING ---
  const filteredData = useMemo(() => {
    let filtered = [...transactions];

    // 1. Pencarian
    if (searchInput.trim()) {
      const lower = searchInput.toLowerCase();
      filtered = filtered.filter(t => 
        t.id.toLowerCase().includes(lower) || 
        (t.transactionNumber || '').toLowerCase().includes(lower) || 
        (t.cashierName || '').toLowerCase().includes(lower)
      );
    }

    // 2. Filter Waktu: Hari Ini
    if (filterMode === 'today') {
      const todayStr = new Date().toDateString();
      filtered = filtered.filter(t => {
        if (!t.createdAt) return false;
        return t.createdAt.toDate().toDateString() === todayStr;
      });
    }

    // 3. Filter Waktu: Tanggal Spesifik (DatePicker)
    if (filterMode === 'specificMonth') {
      const selectedDateStr = selectedDate.toDateString();
      filtered = filtered.filter(t => {
        if (!t.createdAt) return false;
        return t.createdAt.toDate().toDateString() === selectedDateStr;
      });
    }

    // 4. Sortir
    filtered.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
      const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
      return selectedSort === 'latest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [transactions, searchInput, filterMode, selectedSort, selectedDate]);

  // Konfigurasi UI Header
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
          <TransactionFilterSection
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            filterMode={filterMode}
            selectedSort={selectedSort}
            selectedDate={selectedDate} // Prop Baru
            transactionCount={filteredData.length}
            isAdmin={isAdmin}
            onFilterChange={setFilterMode}
            onSortChange={setSelectedSort}
            onDateChange={setSelectedDate} // Prop Baru
          />
        </View>

        <TransactionList
          transactions={filteredData}
          searchInput={searchInput}
          isAdmin={isAdmin}
          refetch={loadTransactions}
          insets={insets}
          refreshing={refreshing}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.primary 
  },
  loaderContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC' 
  },
  contentWrapper: { 
    flex: 1, 
    backgroundColor: '#F8FAFC', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    marginTop: -20, 
    overflow: 'visible' // Diganti ke 'visible' agar bayangan kartu filter tidak terpotong
  },
  filterSearchContainer: { 
    paddingTop: 8,
  }
});

export default TransactionScreen;