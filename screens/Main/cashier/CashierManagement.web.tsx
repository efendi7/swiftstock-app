/**
 * CashierManagementWeb.tsx — wire CashierDetailModal
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { Users, Plus, UserCheck, UserX, Clock } from 'lucide-react-native';

import { useNavigation } from '@react-navigation/native';
import { COLORS }  from '@constants/colors';
import { useAuth } from '@hooks/auth/useAuth';
import { CashierService, Cashier, ShiftType, PaginatedCashiers } from '@services/cashierService';

import CashierFilterWeb        from '@components/cashier-management/CashierFilterWeb';
import CashierListWeb          from '@components/cashier-management/CashierListWeb';
import { AddCashierModal }     from './modal/AddCashierModal';
import { EditShiftModal }      from './modal/EditShiftModal';
import { CashierDetailModal }  from './modal/CashierDetailModal';

type ShiftFilter  = 'all' | ShiftType | 'unassigned';
type StatusFilter = 'all' | 'active' | 'inactive';

const PAGE_SIZE = 20;

const CashierManagementWeb = () => {
  const { tenantId, user, loading: authLoading } = useAuth();
  const navigation = useNavigation<any>();

  const [cashiers,         setCashiers]         = useState<Cashier[]>([]);
  const [filteredCashiers, setFilteredCashiers] = useState<Cashier[]>([]);
  const [totalCount,       setTotalCount]       = useState(0);
  const [currentPage,      setCurrentPage]      = useState(1);
  const [totalPages,       setTotalPages]       = useState(1);
  const [lastDoc,          setLastDoc]          = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [pageCache,        setPageCache]        = useState<Record<number, {
    data: Cashier[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }>>({});

  const [loading,     setLoading]     = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);

  const [showAddModal,    setShowAddModal]    = useState(false);
  const [showShiftModal,  setShowShiftModal]  = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(null);

  const [searchQuery,  setSearchQuery]  = useState('');
  const [shiftFilter,  setShiftFilter]  = useState<ShiftFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const hasActiveFilter = searchQuery !== '' || shiftFilter !== 'all' || statusFilter !== 'all';

  const loadFirstPage = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      setLoading(true);
      setCurrentPage(1);
      setPageCache({});
      const result: PaginatedCashiers = await CashierService.getCashiersFirstPage(tenantId, PAGE_SIZE);
      setCashiers(result.cashiers);
      setFilteredCashiers(result.cashiers);
      setTotalCount(result.totalCount);
      setTotalPages(Math.ceil(result.totalCount / PAGE_SIZE));
      setLastDoc(result.lastDoc);
      setPageCache({ 1: { data: result.cashiers, lastDoc: result.lastDoc } });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [tenantId]);

  const handlePageChange = useCallback(async (page: number) => {
    if (!tenantId) return;
    if (pageCache[page]) {
      const cached = pageCache[page];
      setCashiers(cached.data);
      setFilteredCashiers(cached.data);
      setLastDoc(cached.lastDoc);
      setCurrentPage(page);
      return;
    }
    const prevCache = pageCache[page - 1];
    if (!prevCache?.lastDoc) return;
    try {
      setPageLoading(true);
      const result: PaginatedCashiers = await CashierService.getCashiersNextPage(tenantId, prevCache.lastDoc, PAGE_SIZE);
      setCashiers(result.cashiers);
      setFilteredCashiers(result.cashiers);
      setLastDoc(result.lastDoc);
      setCurrentPage(page);
      setPageCache(prev => ({ ...prev, [page]: { data: result.cashiers, lastDoc: result.lastDoc } }));
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); }
  }, [tenantId, pageCache]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  }, [loadFirstPage]);

  useEffect(() => {
    if (tenantId && !authLoading) loadFirstPage();
  }, [tenantId, authLoading, loadFirstPage]);

  const handleToggleStatus = async (cashier: Cashier) => {
    if (!tenantId) return;
    try {
      await CashierService.updateStatus(tenantId, cashier.id, cashier.status === 'active' ? 'inactive' : 'active');
      await loadFirstPage();
    } catch (e) { console.error(e); }
  };

  const handleViewHistory = (cashier: Cashier) => {
    setShowDetailModal(false);
    setSelectedCashier(null);
    navigation.navigate('AttendanceHistory', {
      cashierId:   cashier.id,
      cashierName: cashier.displayName,
    });
  };

  const activeCount   = cashiers.filter(c => c.status === 'active').length;
  const inactiveCount = cashiers.filter(c => c.status === 'inactive').length;
  const todayDay      = new Date().getDay();
  const todayCount    = cashiers.filter(c =>
    c.status === 'active' &&
    (!c.shift || c.shift.days.length === 0 || c.shift.days.includes(todayDay))
  ).length;

  return (
    <View style={styles.root}>
      <View style={styles.body}>

        <View style={styles.sidebar}>
          <CashierFilterWeb
            cashiers={cashiers}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            shiftFilter={shiftFilter}
            statusFilter={statusFilter}
            onFiltered={setFilteredCashiers}
            onShiftChange={setShiftFilter}
            onStatusChange={setStatusFilter}
          />
        </View>

        <View style={styles.rightCol}>
          <View style={styles.toolbar}>
            <View style={styles.stats}>
              <StatChip icon={<Users     size={14} color={COLORS.primary} />} value={totalCount}    label="Total"          bg="rgba(28,58,90,0.07)" color={COLORS.primary} />
              <StatChip icon={<UserCheck size={14} color="#10B981" />}        value={activeCount}   label="Aktif"          bg="#F0FDF4"              color="#10B981" />
              {inactiveCount > 0 && (
                <StatChip icon={<UserX   size={14} color="#EF4444" />}        value={inactiveCount} label="Nonaktif"       bg="#FEF2F2"              color="#EF4444" />
              )}
              <StatChip icon={<Clock     size={14} color="#3B82F6" />}        value={todayCount}    label="Masuk Hari Ini" bg="#EFF6FF"              color="#3B82F6" />
              {!hasActiveFilter && totalPages > 1 && (
                <Text style={styles.pageInfo}>Hal. {currentPage} / {totalPages}</Text>
              )}
              {hasActiveFilter && filteredCashiers.length !== cashiers.length && (
                <Text style={styles.pageInfo}>{filteredCashiers.length} tampil</Text>
              )}
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
              <Plus size={16} color="#FFF" />
              <Text style={styles.addBtnText}>Tambah Kasir</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {loading || pageLoading ? (
              <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 80 }} />
            ) : (
              <CashierListWeb
                data={filteredCashiers}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                isAdmin={user?.role === 'admin'}
                onEditShift={(cashier) => { setSelectedCashier(cashier); setShowShiftModal(true); }}
                onToggleStatus={handleToggleStatus}
                onViewDetail={(cashier) => { setSelectedCashier(cashier); setShowDetailModal(true); }}
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

      <AddCashierModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadFirstPage}
        tenantId={tenantId}
        storeName={user?.storeName}
      />
      <EditShiftModal
        visible={showShiftModal}
        cashier={selectedCashier}
        tenantId={tenantId || ''}
        onClose={() => { setShowShiftModal(false); setSelectedCashier(null); }}
        onSuccess={loadFirstPage}
      />
      <CashierDetailModal
        visible={showDetailModal}
        cashier={selectedCashier}
        tenantId={tenantId || ''}
        onClose={() => { setShowDetailModal(false); setSelectedCashier(null); }}
        onViewHistory={handleViewHistory}
      />
    </View>
  );
};

const StatChip = ({ icon, value, label, bg, color }: {
  icon: React.ReactNode; value: number | string; label: string; bg: string; color: string;
}) => (
  <View style={[styles.statChip, { backgroundColor: bg }]}>
    {icon}
    <Text style={[styles.statVal,   { color }]}>{value}</Text>
    <Text style={[styles.statLabel, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  root:    { flex: 1, overflow: 'hidden' as any },
  body:    { flex: 1, flexDirection: 'row', overflow: 'hidden' as any },
  sidebar: { width: 268, backgroundColor: '#FFF', borderRightWidth: 1, borderRightColor: '#E2E8F0', overflow: 'hidden' as any },
  rightCol:{ flex: 1, flexDirection: 'column', overflow: 'hidden' as any },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 12 },
  stats:    { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' as any },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statVal:  { fontSize: 13, fontFamily: 'PoppinsBold' },
  statLabel:{ fontSize: 11, fontFamily: 'PoppinsRegular' },
  pageInfo: { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginLeft: 4 },
  addBtn:    { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, gap: 6, cursor: 'pointer' as any },
  addBtnText:{ color: '#FFF', fontFamily: 'PoppinsBold', fontSize: 13 },
  listScroll:  { flex: 1 },
  listContent: { padding: 18, paddingBottom: 40 },
});

export default CashierManagementWeb;