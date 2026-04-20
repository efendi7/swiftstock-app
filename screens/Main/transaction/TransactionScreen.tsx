import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, StatusBar, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { History, BarChart3 } from 'lucide-react-native';

import { COLORS } from '../../../constants/colors';
import { useAuth } from '../../../hooks/auth/useAuth';
import { ScreenHeader } from '../../../components/common/ScreenHeader';
import { TransactionFilterSection, TransactionList } from '../../../components/transactions';
import { FilterMode, SortType, Transaction } from '../../../types/transaction.type';
import { TransactionService } from '../../../services/transactionService';
import SkeletonLoadingMobile from '../../../components/common/SkeletonLoadingMobile';

const PAGE_SIZE = 20;

const TransactionScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { tenantId, user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [hasMore,      setHasMore]      = useState(true);
  const [totalCount,   setTotalCount]   = useState(0);

  const lastDocRef   = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const hasLoadedRef = useRef(false);

  const [searchInput,  setSearchInput]  = useState('');
  const [filterMode,   setFilterMode]   = useState<FilterMode>('all');
  const [selectedSort, setSelectedSort] = useState<SortType>('latest');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const hasActiveFilter = searchInput !== '' || filterMode !== 'all' || selectedSort !== 'latest';

  // ── LOAD PERTAMA / REFRESH ────────────────────────────────
  const loadFirstPage = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      setLoading(true);
      lastDocRef.current = null;

      const cashierId = isAdmin ? undefined : user?.uid;
      const result    = await TransactionService.getTransactionsFirstPage(tenantId, PAGE_SIZE, cashierId);

      setTransactions(result.transactions);
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
      lastDocRef.current = result.lastDoc;
    } catch (e) {
      console.error('Error loading transactions:', e);
    } finally {
      setLoading(false);
    }
  }, [tenantId, isAdmin, user?.uid]);

  // ── LOAD MORE ─────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || hasActiveFilter || !lastDocRef.current || !tenantId) return;
    try {
      setLoadingMore(true);
      const cashierId = isAdmin ? undefined : user?.uid;
      const result    = await TransactionService.getTransactionsNextPage(
        tenantId, lastDocRef.current, PAGE_SIZE, cashierId
      );
      setTransactions(prev => [...prev, ...result.transactions]);
      setHasMore(result.hasMore);
      lastDocRef.current = result.lastDoc;
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }, [tenantId, isAdmin, user?.uid, loadingMore, hasMore, hasActiveFilter]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  }, [loadFirstPage]);

  useEffect(() => {
    if (tenantId && !authLoading) {
      loadFirstPage();
      hasLoadedRef.current = true;
    }
  }, [tenantId, authLoading]);

  useFocusEffect(
    useCallback(() => {
      if (hasLoadedRef.current && tenantId) loadFirstPage();
    }, [tenantId])
  );

  // ── CLIENT-SIDE FILTER (hanya saat filter aktif) ──────────
  const filteredData = useMemo(() => {
    if (!hasActiveFilter) return transactions;

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
      const todayStr = new Date().toDateString();
      filtered = filtered.filter(t => {
        const d = t.date?.toDate?.() ?? t.createdAt?.toDate?.();
        return d ? d.toDateString() === todayStr : false;
      });
    }

    if (filterMode === 'specificMonth') {
      const selStr = selectedDate.toDateString();
      filtered = filtered.filter(t => {
        const d = t.date?.toDate?.() ?? t.createdAt?.toDate?.();
        return d ? d.toDateString() === selStr : false;
      });
    }

    filtered.sort((a, b) => {
      const tA = a.date?.toDate?.()?.getTime() ?? 0;
      const tB = b.date?.toDate?.()?.getTime() ?? 0;
      return selectedSort === 'latest' ? tB - tA : tA - tB;
    });

    return filtered;
  }, [transactions, searchInput, filterMode, selectedSort, selectedDate, hasActiveFilter]);

  // ── FOOTER ────────────────────────────────────────────────
  const renderFooter = () => {
    if (hasActiveFilter) return null;
    if (loadingMore) return (
      <View style={styles.footerRow}>
        <ActivityIndicator size="small" color={COLORS.secondary} />
        <Text style={styles.loadMoreText}>Memuat lebih banyak...</Text>
      </View>
    );
    if (!hasMore && transactions.length > 0) return (
      <View style={styles.footerRow}>
        <Text style={styles.endText}>Semua {totalCount} transaksi ditampilkan</Text>
      </View>
    );
    return null;
  };

  const userName    = user?.displayName || user?.email?.split('@')[0] || 'User';
  const headerTitle = isAdmin ? `Semua Riwayat\nTransaksi` : `Riwayat Transaksi\nSaya`;
  const headerIcon  = isAdmin ? <BarChart3 size={28} color="#FFF" /> : <History size={28} color="#FFF" />;

  if ((loading || authLoading) && transactions.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ScreenHeader title={headerTitle} subtitle={userName} icon={headerIcon} />
        <View style={[styles.contentWrapper, { padding: 16 }]}>
          <SkeletonLoadingMobile type="transaction-list" rows={6} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScreenHeader title={headerTitle} subtitle={userName} icon={headerIcon} />

      <View style={styles.contentWrapper}>
        <View style={styles.filterContainer}>
          <TransactionFilterSection
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            filterMode={filterMode}
            selectedSort={selectedSort}
            selectedDate={selectedDate}
            transactionCount={filteredData.length}
            isAdmin={isAdmin}
            onFilterChange={setFilterMode}
            onSortChange={setSelectedSort}
            onDateChange={setSelectedDate}
          />
        </View>

        <TransactionList
          transactions={filteredData}
          searchInput={searchInput}
          isAdmin={isAdmin}
          refetch={handleRefresh}
          insets={insets}
          refreshing={refreshing}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter()}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.primary },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  contentWrapper:  { flex: 1, backgroundColor: '#F8FAFC', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -20, overflow: 'visible' },
  filterContainer: { paddingTop: 8 },
  footerRow:       { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 8 },
  loadMoreText:    { fontSize: 12, fontFamily: 'PoppinsMedium', color: COLORS.secondary },
  endText:         { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
});

export default TransactionScreen;