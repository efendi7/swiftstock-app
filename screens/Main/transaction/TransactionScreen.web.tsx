import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import {
  collection, getDocs, query, orderBy, where,
} from 'firebase/firestore';
import {
  Receipt, TrendingUp, Banknote, CreditCard, RotateCcw,
} from 'lucide-react-native';

import { db }       from '@services/firebaseConfig';
import { COLORS }   from '@constants/colors';
import { useAuth }  from '@hooks/auth/useAuth';
import { Transaction, FilterMode, SortType } from '@/types/transaction.type';

import TransactionFilterWeb from '@components/transactions/TransactionFilterWeb';
import TransactionListWeb   from '@components/transactions/TransactionListWeb';
// Pakai modal detail yang sudah ada di mobile (tidak perlu buat ulang)
import { TransactionModal } from '@components/transactions/TransactionModal';

const TransactionScreenWeb = () => {
  const { tenantId, user, loading: authLoading } = useAuth();

  const [transactions, setTransactions]         = useState<Transaction[]>([]);
  const [filteredTransactions, setFiltered]     = useState<Transaction[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [refreshing, setRefreshing]             = useState(false);
  const [userRole, setUserRole]                 = useState<'admin' | 'kasir'>('kasir');

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailModal, setShowDetailModal]         = useState(false);

  // Filter state
  const [searchQuery,  setSearchQuery]  = useState('');
  const [filterMode,   setFilterMode]   = useState<FilterMode>('all');
  const [sortType,     setSortType]     = useState<SortType>('latest');

  useEffect(() => {
    if (user?.role) setUserRole(user.role as 'admin' | 'kasir');
  }, [user?.role]);

  // ── LOAD ─────────────────────────────────────────────────
  const loadTransactions = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      setLoading(true);

      // ✅ Baca dari subcollection tenant (bukan root)
      const ref = collection(db, 'tenants', tenantId, 'transactions');
      const q   = userRole === 'admin'
        ? query(ref, orderBy('date', 'desc'))
        : query(ref, where('cashierId', '==', user?.uid), orderBy('date', 'desc'));

      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(list);
      setFiltered(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tenantId, userRole, user?.uid]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  }, [loadTransactions]);

  useEffect(() => {
    if (tenantId && !authLoading) loadTransactions();
  }, [tenantId, authLoading, loadTransactions]);

  // ── STAT CHIPS ───────────────────────────────────────────
  const totalRevenue = useMemo(() =>
    transactions.reduce((s, t) => s + (t.total || 0), 0),
  [transactions]);

  const cashCount = useMemo(() =>
    transactions.filter(t => (t.paymentMethod || 'cash') === 'cash').length,
  [transactions]);

  const qrisCount = useMemo(() =>
    transactions.filter(t => t.paymentMethod === 'qris').length,
  [transactions]);

  return (
    <View style={styles.root}>
      <View style={styles.body}>

        {/* ── SIDEBAR — fixed ───────────────────────────── */}
        <View style={styles.sidebar}>
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

        {/* ── KOLOM KANAN ───────────────────────────────── */}
        <View style={styles.rightCol}>

          {/* TOOLBAR — sticky */}
          <View style={styles.toolbar}>
            <View style={styles.stats}>
              <StatChip
                icon={<Receipt size={14} color={COLORS.primary} />}
                value={transactions.length}
                label="Total"
                bg="rgba(28,58,90,0.07)"
                color={COLORS.primary}
              />
              <StatChip
                icon={<TrendingUp size={14} color="#10B981" />}
                value={'Rp ' + (totalRevenue >= 1_000_000
                  ? (totalRevenue / 1_000_000).toFixed(1) + 'jt'
                  : (totalRevenue / 1_000).toFixed(0) + 'rb')}
                label="Pendapatan"
                bg="#F0FDF4"
                color="#10B981"
                isText
              />
              <StatChip
                icon={<Banknote size={14} color="#3B82F6" />}
                value={cashCount}
                label="Tunai"
                bg="#EFF6FF"
                color="#3B82F6"
              />
              <StatChip
                icon={<CreditCard size={14} color="#8B5CF6" />}
                value={qrisCount}
                label="QRIS"
                bg="#F5F3FF"
                color="#8B5CF6"
              />
              {filteredTransactions.length !== transactions.length && (
                <Text style={styles.pageInfo}>
                  {filteredTransactions.length} tampil
                </Text>
              )}
            </View>

            <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
              <RotateCcw size={14} color={COLORS.primary} />
              <Text style={styles.refreshBtnText}>Perbarui</Text>
            </TouchableOpacity>
          </View>

          {/* LIST — satu-satunya yang scroll */}
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <ActivityIndicator
                size="large"
                color={COLORS.secondary}
                style={{ marginTop: 80 }}
              />
            ) : (
              <TransactionListWeb
                data={filteredTransactions}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                isAdmin={userRole === 'admin'}
                onViewPress={(t) => {
                  setSelectedTransaction(t);
                  setShowDetailModal(true);
                }}
              />
            )}
          </ScrollView>
        </View>
      </View>

     {/* MODAL DETAIL */}
{selectedTransaction && (
  <TransactionModal
    visible={showDetailModal}
    transaction={selectedTransaction}
    themeColor={COLORS.primary} // <--- Add this line
    onClose={() => { 
      setShowDetailModal(false); 
      setSelectedTransaction(null); 
    }}
  />
)}
    </View>
  );
};

// ── STAT CHIP ─────────────────────────────────────────────
const StatChip = ({ icon, value, label, bg, color, isText }: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  bg: string;
  color: string;
  isText?: boolean;
}) => (
  <View style={[styles.statChip, { backgroundColor: bg }]}>
    {icon}
    <Text style={[styles.statVal, { color }]}>{value}</Text>
    <Text style={[styles.statLabel, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  root:    { flex: 1, overflow: 'hidden' as any },
  body:    { flex: 1, flexDirection: 'row', overflow: 'hidden' as any },
  sidebar: { width: 268, backgroundColor: '#FFF', borderRightWidth: 1, borderRightColor: '#E2E8F0', overflow: 'hidden' as any },
  rightCol:{ flex: 1, flexDirection: 'column', overflow: 'hidden' as any },

  toolbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 12,
  },
  stats:    { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' as any },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statVal:  { fontSize: 13, fontFamily: 'PoppinsBold' },
  statLabel:{ fontSize: 11, fontFamily: 'PoppinsRegular' },
  pageInfo: { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginLeft: 4 },

  refreshBtn:    { backgroundColor: 'rgba(28,58,90,0.07)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, gap: 6, cursor: 'pointer' as any },
  refreshBtnText:{ color: COLORS.primary, fontFamily: 'PoppinsBold', fontSize: 13 },

  listScroll:  { flex: 1 },
  listContent: { padding: 18, paddingBottom: 40 },
});

export default TransactionScreenWeb;