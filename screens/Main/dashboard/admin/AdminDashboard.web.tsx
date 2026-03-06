import React, { useCallback, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { COLORS } from '@constants/colors';
import { auth } from '@services/firebaseConfig';
import { useDashboard } from '@hooks/useDashboard';
import { useAuth } from '@hooks/auth/useAuth';

import { AdminStatsGrid }    from './sections/AdminStatsGrid';
import { AdminDashboardChart } from './sections/AdminDashboardChart';
import { AdminSalesRanking, AdminStockRanking } from './sections/AdminRankings';
import { AdminActivity }     from './sections/AdminActivity';
import { ActivityModal }     from './modal/ActivityModal';
import { DateRangeSelector } from '@components/dashboard/DateRangeSelector';
import { StockPurchaseChart } from '@components/dashboard/chart/StockPurchaseChart';

const AdminDashboardWeb = () => {
  const navigation = useNavigation<any>();
  const { tenantId } = useAuth();
  const {
    loading, stats, activities,
    selectedPreset, refreshData, setPresetRange,
  } = useDashboard();

  const [modalVisible, setModalVisible] = useState(false);
  const [currentDisplayName, setCurrentDisplayName] = useState('User Swiftstock');

  useEffect(() => {
    refreshData();
    const name = auth.currentUser?.displayName || stats?.userName || 'User Swiftstock';
    setCurrentDisplayName(name);
  }, [refreshData, stats?.userName]);

  const getDateLabel = () => {
    const labels: Record<string, string> = {
      today: 'Hari ini',
      week:  '7 Hari Terakhir',
      month: '30 Hari Terakhir',
      year:  '1 Tahun',
    };
    return labels[selectedPreset] || 'Hari ini';
  };

  return (
    <View style={styles.root}>

      {/* ── TOOLBAR — sticky ──────────────────────────────── */}
      <View style={styles.toolbar}>
        <View>
          <Text style={styles.periodLabel}>Periode Analisis</Text>
          <Text style={styles.periodValue}>{getDateLabel()}</Text>
        </View>
        <DateRangeSelector
          selectedPreset={selectedPreset}
          onSelectPreset={setPresetRange}
        />
      </View>

      {/* ── SCROLL AREA ───────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* STATS GRID */}
        <AdminStatsGrid
          totalProducts={stats?.totalProducts || 0}
          totalIn={stats?.totalIn || 0}
          totalOut={stats?.totalOut || 0}
          dateLabel={getDateLabel()}
          isLoading={loading}
        />

        {/* ── ROW 1: CHART PENJUALAN + CHART STOK MASUK ──── */}
        <View style={styles.row}>

          {/* Chart Penjualan */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Grafik Penjualan</Text>
            <AdminDashboardChart
              data={stats?.weeklyData || []}
              isLoading={loading}
              selectedPreset={selectedPreset}
              dateRangeLabel={stats?.dateRangeLabel}
            />
          </View>

          {/* Chart Stok Masuk */}
          <View style={styles.card}>
            <StockPurchaseChart
              unitData={stats?.stockUnitData   || []}
              valueData={stats?.stockValueData || []}
              newData={stats?.stockNewData     || []}
              isLoading={loading}
              selectedPreset={selectedPreset}
              dateRangeLabel={stats?.dateRangeLabel}
            />
          </View>
        </View>

        {/* ── ROW 2: ACTIVITY + RANKINGS ──────────────────── */}
        <View style={[styles.row, styles.rowMt]}>

          {/* Activity — 60% */}
          <View style={[styles.card, styles.activityCol]}>
            <AdminActivity
              activities={activities?.slice(0, 8) || []}
              currentUserName={currentDisplayName}
              onSeeMore={() => setModalVisible(true)}
              tenantId={tenantId || ''}
            />
          </View>

          {/* Rankings — 40% */}
          <View style={styles.rankingCol}>
            <View style={styles.card}>
              <AdminSalesRanking
                title="Produk Terlaris"
                data={stats?.salesRanking || []}
                unit="Terjual"
                color={COLORS.secondary}
                onSeeMore={() => navigation.navigate('WebProducts', { filterType: 'sold-desc' })}
              />
            </View>
            <View style={[styles.card, styles.cardMt]}>
              <AdminStockRanking
                title="Stok Kritis"
                data={stats?.stockRanking || []}
                unit="Sisa"
                color="#ef4444"
                onSeeMore={() => navigation.navigate('WebProducts', { filterType: 'stock-critical' })}
              />
            </View>
          </View>
        </View>

        <Text style={styles.footer}>Swiftstock POS Hybrid • SaaS Edition 2026</Text>
      </ScrollView>

      {/* MODALS */}
      <ActivityModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        currentUserName={currentDisplayName}
      />

      {/* FLOATING LOADER */}
      {loading && (
        <View style={styles.floatingLoader}>
          <ActivityIndicator size="small" color={COLORS.secondary} />
          <Text style={styles.loaderText}>Memperbarui...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    // @ts-ignore
    overflow: 'hidden',
  },

  // TOOLBAR
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Platform.select({ web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.03)' } as any }),
  },
  periodLabel: {
    fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  periodValue: { fontSize: 15, fontFamily: 'PoppinsSemiBold', color: '#1E293B', marginTop: 2 },

  // SCROLL
  scroll:        { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48 },

  // ROW — 2 kolom equal
  row: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
  },
  rowMt: { marginTop: 20 },

  // CARD
  card: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      web: { boxShadow: '0px 4px 16px rgba(0,0,0,0.04)' } as any,
      default: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
    }),
  },
  cardMt:      { marginTop: 20 },
  cardTitle:   { fontSize: 14, fontFamily: 'PoppinsSemiBold', color: '#1E293B', marginBottom: 12 },

  // Row 2 kolom tidak equal
  activityCol: { flex: 1.4 },
  rankingCol:  { flex: 1, flexDirection: 'column' },

  // FOOTER
  footer: {
    textAlign: 'center', color: '#CBD5E1',
    fontSize: 11, marginTop: 48, fontFamily: 'PoppinsRegular',
  },

  // FLOATING LOADER
  floatingLoader: {
    position: 'absolute', top: 72, right: 24,
    backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#E2E8F0',
    ...Platform.select({ web: { boxShadow: '0px 8px 20px rgba(0,0,0,0.08)' } as any }),
  },
  loaderText: { fontSize: 12, color: COLORS.secondary, fontFamily: 'PoppinsMedium' },
});

export default AdminDashboardWeb;