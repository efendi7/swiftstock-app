/**
 * screens/main/transactions/TransactionScreen.web.tsx
 * Server-side pagination via TransactionService (Firestore cursor).
 * Filter client-side dari data halaman aktif.
 * Pakai StatsToolbar dari common/web.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, StyleSheet, ScrollView,
} from 'react-native';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { Receipt, TrendingUp, Banknote, CreditCard, RotateCcw } from 'lucide-react-native';

import { COLORS }  from '@constants/colors';
import { useAuth } from '@hooks/auth/useAuth';
import { Transaction, FilterMode, SortType } from '@/types/transaction.type';
import { TransactionService, PaginatedTransactions } from '@services/transactionService';
import StatsToolbar, { StatItem } from '@components/common/web/StatsToolbar';
import SkeletonLoading from '@components/common/web/SkeletonLoading';

import TransactionFilterWeb from '@components/transactions/TransactionFilterWeb';
import TransactionListWeb   from '@components/transactions/TransactionListWeb';
import { TransactionModal } from '@components/transactions/TransactionModalWeb';
import { TouchableOpacity, Text } from 'react-native';

const PAGE_SIZE = 20;

const TransactionScreenWeb = () => {
  const { tenantId, user, loading: authLoading } = useAuth();

  const [transactions,         setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFiltered]     = useState<Transaction[]>([]);
  const [totalCount,           setTotalCount]   = useState(0);
  const [currentPage,          setCurrentPage]  = useState(1);
  const [totalPages,           setTotalPages]   = useState(1);
  const [lastDoc,              setLastDoc]      = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [pageCache,            setPageCache]    = useState<Record<number, {
    data: Transaction[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }>>({});

  const [loading,     setLoading]     = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);

  const userRole = (user?.role as 'admin' | 'kasir') ?? 'kasir';
  const cashierId = user?.role === 'admin' ? undefined : user?.uid;

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailModal,     setShowDetailModal]     = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode,  setFilterMode]  = useState<FilterMode>('all');
  const [sortType,    setSortType]    = useState<SortType>('latest');

  const hasActiveFilter = searchQuery !== '' || filterMode !== 'all' || sortType !== 'latest';

  // ── LOAD HALAMAN PERTAMA ──────────────────────────────────
  const loadFirstPage = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      setLoading(true);
      setCurrentPage(1);
      setPageCache({});

      const result: PaginatedTransactions = await TransactionService.getTransactionsFirstPage(
        tenantId, PAGE_SIZE, cashierId,
      );
      setTransactions(result.transactions);
      setFiltered(result.transactions);
      setTotalCount(result.totalCount);
      setTotalPages(Math.ceil(result.totalCount / PAGE_SIZE));
      setLastDoc(result.lastDoc);
      setPageCache({ 1: { data: result.transactions, lastDoc: result.lastDoc } });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [tenantId, user?.uid, user?.role]);

  // ── GANTI HALAMAN ─────────────────────────────────────────
  const handlePageChange = useCallback(async (page: number) => {
    if (!tenantId) return;
    if (pageCache[page]) {
      const c = pageCache[page];
      setTransactions(c.data);
      setFiltered(c.data);
      setLastDoc(c.lastDoc);
      setCurrentPage(page);
      return;
    }
    const prev = pageCache[page - 1];
    if (!prev?.lastDoc) return;
    try {
      setPageLoading(true);
      const result: PaginatedTransactions = await TransactionService.getTransactionsNextPage(
        tenantId, prev.lastDoc, PAGE_SIZE, cashierId,
      );
      setTransactions(result.transactions);
      setFiltered(result.transactions);
      setLastDoc(result.lastDoc);
      setCurrentPage(page);
      setPageCache(p => ({ ...p, [page]: { data: result.transactions, lastDoc: result.lastDoc } }));
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); }
  }, [tenantId, pageCache, user?.uid, user?.role]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  }, [loadFirstPage]);

  useEffect(() => {
    if (tenantId && !authLoading && user?.role) loadFirstPage();
  }, [tenantId, authLoading, user?.role]);

  // ── STAT CHIPS ────────────────────────────────────────────
  const totalRevenue = useMemo(() =>
    transactions.reduce((s, t) => s + (t.total || 0), 0), [transactions]);
  const cashCount = useMemo(() =>
    transactions.filter(t => (t.paymentMethod || 'cash') === 'cash').length, [transactions]);
  const qrisCount = useMemo(() =>
    transactions.filter(t => t.paymentMethod === 'qris').length, [transactions]);

  const revenueLabel = totalRevenue >= 1_000_000
    ? 'Rp ' + (totalRevenue / 1_000_000).toFixed(1) + 'jt'
    : 'Rp ' + (totalRevenue / 1_000).toFixed(0) + 'rb';

  const stats: StatItem[] = [
    { icon: <Receipt   size={14} color={COLORS.primary} />, value: totalCount,    label: 'Total',       bg: 'rgba(28,58,90,0.07)', color: COLORS.primary },
    { icon: <TrendingUp size={14} color="#10B981" />,        value: revenueLabel,  label: 'Pendapatan',  bg: '#F0FDF4',             color: '#10B981'      },
    { icon: <Banknote   size={14} color="#3B82F6" />,        value: cashCount,     label: 'Tunai',       bg: '#EFF6FF',             color: '#3B82F6'      },
    { icon: <CreditCard size={14} color="#D97706" />,        value: qrisCount,     label: 'QRIS',        bg: '#FEF3C7',             color: '#D97706'      },
  ];

  return (
    <View style={s.root}>
      <View style={s.body}>

        {/* SIDEBAR */}
        <View style={s.sidebar}>
          <TransactionFilterWeb
            transactions={transactions}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterMode={filterMode}
            sortType={sortType}
            isAdmin={userRole === 'admin'}
            onFiltered={setFiltered}
            onFilterChange={setFilterMode}
            onSortChange={setSortType}
          />
        </View>

        {/* KOLOM KANAN */}
        <View style={s.rightCol}>

          {/* TOOLBAR — StatsToolbar reusable */}
          <StatsToolbar
            stats={stats}
            right={
              <TouchableOpacity style={s.refreshBtn} onPress={handleRefresh}>
                <RotateCcw size={14} color={COLORS.primary} />
                <Text style={s.refreshBtnTxt}>Perbarui</Text>
              </TouchableOpacity>
            }
          />

          {/* LIST */}
          <ScrollView style={s.listScroll} contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
            {loading ? (
              <SkeletonLoading type="table" rows={PAGE_SIZE} style={{ padding: 18 }} />
            ) : pageLoading ? (
              <SkeletonLoading type="table" rows={6} style={{ padding: 18 }} />
            ) : (
              <TransactionListWeb
                data={filteredTransactions}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                isAdmin={userRole === 'admin'}
                onViewPress={(t) => { setSelectedTransaction(t); setShowDetailModal(true); }}
                usePagination={!hasActiveFilter}
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
              />
            )}
          </ScrollView>
        </View>
      </View>

      {selectedTransaction && (
        <TransactionModal
          visible={showDetailModal}
          transaction={selectedTransaction}
          onClose={() => { setShowDetailModal(false); setSelectedTransaction(null); }}
          themeColor={COLORS.primary}
        />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root:     { flex: 1, overflow: 'hidden' as any },
  body:     { flex: 1, flexDirection: 'row', overflow: 'hidden' as any },
  sidebar:  { width: 268, backgroundColor: '#FFF', borderRightWidth: 1, borderRightColor: '#E2E8F0' },
  rightCol: { flex: 1, flexDirection: 'column', overflow: 'hidden' as any },

  refreshBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(28,58,90,0.07)', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, cursor: 'pointer' as any },
  refreshBtnTxt: { color: COLORS.primary, fontFamily: 'PoppinsBold', fontSize: 13 },

  listScroll:  { flex: 1 },
  listContent: { padding: 18, paddingBottom: 40 },
});

export default TransactionScreenWeb;