// src/screens/Main/TransactionScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Animated,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTransactions } from '../../hooks/useTransaction';
import { Transaction } from '../../hooks/useTransaction';
import { formatCurrency, getDisplayId, formatDate } from '../../utils/transactionsUtils';

import {
  TransactionHeader,
  TransactionSearchBar,
  TransactionSummaryBar,
  TransactionFilterSection,
  TransactionList,
} from '../../components/transactions';

import { styles, COLORS } from '../../components/transactions/styles';

type FilterMode = 'today' | 'week' | 'month' | 'all' | 'specificMonth' | 'dateRange';

const TransactionScreen = () => {
  const insets = useSafeAreaInsets();

  // State untuk search
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // State untuk filter & sort
  const [filterMode, setFilterMode] = useState<FilterMode>('today');
  const [selectedSort, setSelectedSort] = useState<'latest' | 'oldest'>('latest');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [filterHeight] = useState(new Animated.Value(0));

  // State untuk filter spesifik bulan
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // State untuk filter rentang tanggal
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Hook untuk fetch transaksi
  const {
    transactions,
    loading,
    isAdmin,
    refetch,
    loadingMore,
    hasMore,
    loadMore,
  } = useTransactions(filterMode, selectedSort, searchQuery, {
    month: filterMode === 'specificMonth' ? selectedMonth : undefined,
    year: filterMode === 'specificMonth' ? selectedYear : undefined,
    startDate: filterMode === 'dateRange' ? startDate : undefined,
    endDate: filterMode === 'dateRange' ? endDate : undefined,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Animasi expand/collapse filter
  useEffect(() => {
    Animated.timing(filterHeight, {
      toValue: isFilterExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isFilterExpanded]);

  // Fungsi untuk menampilkan detail transaksi
  const showTransactionDetail = (transaction: Transaction) => {
    const itemDetails = transaction.items
      .map((item, index) => `${index + 1}. ${item.productName || 'Produk'} - Qty: ${item.qty} x ${formatCurrency(item.price)}`)
      .join('\n');

    const displayId = getDisplayId(transaction);

    let message = `Tanggal: ${formatDate(transaction.date)}\n\nProduk:\n${itemDetails}\n\nTotal: ${formatCurrency(transaction.total)}`;

    if (isAdmin && transaction.cashierName) {
      message = `Kasir: ${transaction.cashierName}${transaction.cashierEmail ? `\nEmail: ${transaction.cashierEmail}` : ''}\n\n${message}`;
    }

    Alert.alert(`Detail Transaksi ${displayId}`, message, [{ text: 'Tutup' }]);
  };

  // Hitung jumlah transaksi setelah client-side filter (untuk summary)
  const filteredCount = useCallback(() => {
    if (!searchInput.trim()) return transactions.length;

    const lower = searchInput.toLowerCase();
    return transactions.filter((t) =>
      t.id.toLowerCase().includes(lower) ||
      (t.transactionNumber || '').toLowerCase().includes(lower) ||
      (t.cashierName || '').toLowerCase().includes(lower) ||
      (t.cashierEmail || '').toLowerCase().includes(lower)
    ).length;
  }, [transactions, searchInput]);

  // Loading state awal
  if (loading && transactions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.loadingText}>Memuat transaksi...</Text>
      </View>
    );
  }

  const maxHeight = filterHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 500], // Sesuaikan jika konten filter lebih panjang
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <TransactionHeader isAdmin={isAdmin} />

      {/* Search Bar */}
      <TransactionSearchBar
        value={searchInput}
        onChangeText={setSearchInput}
        isAdmin={isAdmin}
      />

      {/* Summary Bar dengan Toggle Filter */}
      <TransactionSummaryBar
        count={filteredCount()}
        isExpanded={isFilterExpanded}
        onToggle={() => setIsFilterExpanded(!isFilterExpanded)}
      />

      {/* Filter Section (Animated) */}
      <Animated.View style={{ maxHeight, overflow: 'hidden' }}>
        <TransactionFilterSection
          filterMode={filterMode}
          selectedSort={selectedSort}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          startDate={startDate}
          endDate={endDate}
          showStartPicker={showStartPicker}
          showEndPicker={showEndPicker}
          onFilterChange={(mode) => {
            setFilterMode(mode);
            // Otomatis tutup filter untuk mode cepat
            if (mode !== 'specificMonth' && mode !== 'dateRange') {
              setIsFilterExpanded(false);
            }
            // Reset state yang tidak dipakai
            if (mode !== 'specificMonth') {
              setSelectedMonth(new Date().getMonth());
              setSelectedYear(currentYear);
            }
            if (mode !== 'dateRange') {
              setStartDate(null);
              setEndDate(null);
            }
          }}
          onSortChange={setSelectedSort}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onShowStartPicker={setShowStartPicker}
          onShowEndPicker={setShowEndPicker}
          onClose={() => setIsFilterExpanded(false)}
        />
      </Animated.View>

      {/* Daftar Transaksi */}
      <TransactionList
        transactions={transactions}
        searchInput={searchInput}
        isAdmin={isAdmin}
        loadingMore={loadingMore}
        hasMore={hasMore}
        loadMore={loadMore}
        refetch={refetch}
        onItemPress={showTransactionDetail}
        insets={insets}
      />
    </View>
  );
};

export default TransactionScreen;