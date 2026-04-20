import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { COLORS }           from '@constants/colors';
import { auth }             from '@services/firebaseConfig';
import { useDashboard }     from '@hooks/useDashboard';
import { useAuth }          from '@hooks/auth/useAuth';
import { SettingsService }  from '@services/settingsService';
import { DashboardService } from '@services/dashboardService';
import { PeriodCompareData } from '@components/dashboard/chart/PeriodCompareCard';
import SkeletonLoading from '@components/common/web/SkeletonLoading';

import { WebStatsRow, StatsComparison }  from './sections/WebStatsRow';
import { WebDualColumn }                 from './sections/WebDualColumn';
import { WebActivityRow }                from './sections/WebActivityRow';
import { WebDateBar }                    from './sections/WebDateBar';
import { ActivityModal }                 from './modal/ActivityModal';

// ─── Helper: periode sebelumnya ─────────────────────────────
function getPreviousDateRange(preset: string, currentStart: Date) {
  if (preset === 'today') {
    const s = new Date(currentStart); s.setDate(s.getDate() - 1); s.setHours(0, 0, 0, 0);
    const e = new Date(s); e.setHours(23, 59, 59, 999);
    return { startDate: s, endDate: e };
  }
  if (preset === 'week') {
    const e = new Date(currentStart); e.setDate(e.getDate() - 1); e.setHours(23, 59, 59, 999);
    const s = new Date(e); s.setDate(s.getDate() - 6); s.setHours(0, 0, 0, 0);
    return { startDate: s, endDate: e };
  }
  if (preset === 'month') {
    const s = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 1);
    const e = new Date(currentStart.getFullYear(), currentStart.getMonth(), 0); e.setHours(23, 59, 59, 999);
    return { startDate: s, endDate: e };
  }
  const y = currentStart.getFullYear() - 1;
  return { startDate: new Date(y, 0, 1), endDate: new Date(y, 11, 31, 23, 59, 59, 999) };
}

const PERIOD_LABEL: Record<string, string> = {
  today: 'vs kemarin', week: 'vs minggu lalu',
  month: 'vs bulan lalu', year: 'vs tahun lalu',
};

const AdminDashboardWeb = () => {
  const navigation = useNavigation<any>();
  const { tenantId } = useAuth();
  const {
    loading, stats, activities,
    selectedPreset, refreshData, setPresetRange,
  } = useDashboard();

  const [modalVisible, setModalVisible]             = useState(false);
  const [currentDisplayName, setCurrentDisplayName] = useState('User Swiftstock');
  const [refreshing, setRefreshing]                 = useState(false);
  const [periodCompare, setPeriodCompare]           = useState<PeriodCompareData | undefined>();
  const [comparison, setComparison]                 = useState<StatsComparison | undefined>();

  // Primitive deps untuk useEffect komparasi
  const statsRevenue      = stats?.totalRevenue      ?? -1;
  const statsTransactions = stats?.totalTransactions ?? -1;
  const statsProfit       = stats?.totalProfit       ?? -1;

  // Fetch data periode sebelumnya untuk komparasi top cards + PeriodCompare
  useEffect(() => {
    if (!tenantId) return;
    const now = new Date();
    let currentStart = new Date(now);
    if (selectedPreset === 'today')       { currentStart.setHours(0, 0, 0, 0); }
    else if (selectedPreset === 'week')   { const d = now.getDay() || 7; currentStart.setDate(now.getDate() - d + 1); currentStart.setHours(0, 0, 0, 0); }
    else if (selectedPreset === 'month')  { currentStart = new Date(now.getFullYear(), now.getMonth(), 1); }
    else                                  { currentStart = new Date(now.getFullYear(), 0, 1); }

    const prevRange = getPreviousDateRange(selectedPreset, currentStart);

    DashboardService.fetchDashboardStats(tenantId, prevRange, selectedPreset)
      .then(prev => {
        // Data untuk WebStatsRow top cards
        setComparison({
          prevRevenue:      prev.totalRevenue,
          prevTransactions: prev.totalTransactions,
        });
        // Data untuk PeriodCompareCard
        setPeriodCompare({
          current:  { revenue: statsRevenue,      transactions: statsTransactions, profit: statsProfit },
          previous: { revenue: prev.totalRevenue, transactions: prev.totalTransactions, profit: prev.totalProfit },
          periodLabel: PERIOD_LABEL[selectedPreset] || 'vs sebelumnya',
        });
      })
      .catch(() => { setComparison(undefined); setPeriodCompare(undefined); });
  }, [tenantId, selectedPreset, statsRevenue, statsTransactions, statsProfit]);

  useEffect(() => { refreshData(); }, [refreshData]);

  useEffect(() => {
    const name = auth.currentUser?.displayName || stats?.userName || 'User Swiftstock';
    setCurrentDisplayName(name);
  }, [stats?.userName]);

  const getDateLabel = useCallback(() => {
    const labels: Record<string, string> = { today: 'Hari ini', week: '7 Hari Terakhir', month: '30 Hari Terakhir', year: '1 Tahun' };
    return labels[selectedPreset] || 'Hari ini';
  }, [selectedPreset]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true); await refreshData(); setRefreshing(false);
  }, [refreshData]);

  // Memoize semua array/object agar React.memo di children efektif
  const moneyData       = useMemo(() => stats?.moneyData       ?? [], [stats?.moneyData]);
  const unitData        = useMemo(() => stats?.unitData        ?? [], [stats?.unitData]);
  const stockNewData    = useMemo(() => stats?.stockNewData    ?? [], [stats?.stockNewData]);
  const hourlyData      = useMemo(() => stats?.hourlyData,            [stats?.hourlyData]);
  const salesRanking    = useMemo(() => stats?.salesRanking    ?? [], [stats?.salesRanking]);
  const stockRanking    = useMemo(() => stats?.stockRanking    ?? [], [stats?.stockRanking]);
  const paymentData     = useMemo(() => stats?.paymentData     ?? [], [stats?.paymentData]);
  const memberStats     = useMemo(() => stats?.memberStats,           [stats?.memberStats]);
  const activitiesSlice = useMemo(() => activities?.slice(0, 10) ?? [], [activities]);

  // unitData dengan newProducts sub-indikator digabung dari stockNewData
  const unitDataEnriched = useMemo(() => {
    if (!unitData.length || !stockNewData.length) return unitData;
    return unitData.map((d, i) => ({
      ...d,
      newProducts: (stockNewData[i] as any)?.value ?? 0,
    }));
  }, [unitData, stockNewData]);

  const onSeeMoreActivity = useCallback(() => setModalVisible(true), []);
  const onSeeMoreSales    = useCallback(() => navigation.navigate('WebProducts', { filterType: 'sold-desc' }), [navigation]);
  const onSeeMoreStock    = useCallback(() => navigation.navigate('WebProducts', { filterType: 'stock-critical' }), [navigation]);

  return (
    <View style={styles.root}>

      <WebDateBar
        selectedPreset={selectedPreset}
        onSelectPreset={setPresetRange}
        dateLabel={getDateLabel()}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && !stats ? (
          <View style={{ gap: 24 }}>
            <SkeletonLoading type="card" rows={4} columns={4} />
            <SkeletonLoading type="table" rows={5} />
            <SkeletonLoading type="sidebar" />
          </View>
        ) : (
          <>
            {/* ROW 1 — 4 Metrik Utama Dinamis */}
        <WebStatsRow
          totalRevenue={stats?.totalRevenue           ?? 0}
          totalExpense={stats?.totalExpense           ?? 0}
          totalTransactions={stats?.totalTransactions ?? 0}
          totalIn={stats?.totalIn                     ?? 0}
          totalOut={stats?.totalOut                   ?? 0}
          totalNewProducts={stats?.totalNewProducts   ?? 0}
          comparison={comparison}
          selectedPreset={selectedPreset}
          isLoading={loading}
        />

        {/* ROW 2+3 — Dual Column: 3 chart kiri / 3 panel kanan */}
        <WebDualColumn
          moneyData={moneyData}
          unitData={unitDataEnriched}
          hourlyData={hourlyData}
          totalRevenue={stats?.totalRevenue ?? 0}
          totalExpense={stats?.totalExpense ?? 0}
          totalProfit={stats?.totalProfit  ?? 0}
          selectedPreset={selectedPreset}
          dateRangeLabel={stats?.dateRangeLabel}
          periodCompare={periodCompare}
          paymentData={paymentData}
          memberStats={memberStats}
          salesRanking={salesRanking}
          stockRanking={stockRanking}
          onSeeMoreSales={onSeeMoreSales}
          onSeeMoreStock={onSeeMoreStock}
          isLoading={loading}
        />

        {/* ROW 4 — Aktivitas Full-Width (mandiri, tidak ada elemen di samping) */}
        <WebActivityRow
          activities={activitiesSlice}
          currentUserName={currentDisplayName}
          tenantId={tenantId || ''}
          isLoading={loading}
          onSeeMore={onSeeMoreActivity}
        />

        <Text style={styles.footer}>Swiftstock POS Hybrid • SaaS Edition 2026</Text>
          </>
        )}
      </ScrollView>

      <ActivityModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        currentUserName={currentDisplayName}
      />

      {loading && stats && (
        <View style={styles.floatingLoader}>
          <ActivityIndicator size="small" color={COLORS.secondary} />
          <Text style={styles.loaderText}>Memperbarui...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#F0F4F8', overflow: 'hidden' as any,
                   ...Platform.select({ web: { contain: 'strict' } as any }) },
  scroll:        { flex: 1, ...Platform.select({ web: { willChange: 'transform' } as any }) },
  scrollContent: { padding: 24, paddingBottom: 56 },
  footer:        { textAlign: 'center', color: '#CBD5E1', fontSize: 11, marginTop: 48, fontFamily: 'PoppinsRegular' },
  floatingLoader:{ position: 'absolute', top: 72, right: 24, backgroundColor: '#FFF',
                   paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                   flexDirection: 'row', alignItems: 'center', gap: 8,
                   borderWidth: 1, borderColor: '#E2E8F0',
                   ...Platform.select({ web: { boxShadow: '0px 8px 20px rgba(0,0,0,0.08)' } as any }) },
  loaderText:    { fontSize: 12, color: COLORS.secondary, fontFamily: 'PoppinsMedium' },
});

export default AdminDashboardWeb;