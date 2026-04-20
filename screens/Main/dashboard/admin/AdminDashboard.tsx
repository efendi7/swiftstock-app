import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, StatusBar, RefreshControl, Platform, TouchableOpacity, Alert
} from 'react-native';
import { Users, Package, Crown, FileText } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS } from '@constants/colors';
import { auth } from '@services/firebaseConfig';
import { useDashboard } from '@hooks/useDashboard';

import { AdminDashboardHeader } from './sections/AdminDashboardHeader';
import { AdminStatsGrid } from './sections/AdminStatsGrid';
import { AdminDashboardChart } from './sections/AdminDashboardChart';
import { DateRangeSelector } from '@components/dashboard/DateRangeSelector';
import { AdminSalesRanking, AdminStockRanking } from './sections/AdminRankings';
import { AdminActivity } from './sections/AdminActivity';
import { ActivityModal } from './modal/ActivityModal';
import SkeletonLoadingMobile from '@components/common/SkeletonLoadingMobile';

const AdminDashboard = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const {
    loading,
    stats,
    activities,
    selectedPreset,
    refreshData,
    setPresetRange,
  } = useDashboard();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const [currentDisplayName, setCurrentDisplayName] = useState('User Swiftstock');

  // Konfigurasi Header
  const HEADER_MAX_HEIGHT = 265 + insets.top;
  const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 90 + insets.top : 70 + insets.top;

  // Sync Nama & Data
  useFocusEffect(
    useCallback(() => {
      refreshData();
      const name = auth.currentUser?.displayName || stats?.userName || 'User Swiftstock';
      setCurrentDisplayName(name);
    }, [refreshData, stats?.userName]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const getDateLabel = () => {
    const labels: Record<string, string> = {
      today: 'Hari ini',
      week: '7 Hari',
      month: '30 Hari',
      year: '1 Tahun',
    };
    return labels[selectedPreset] || 'Hari ini';
  };

  // Animasi Header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const revenueOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Z-Index ditambahkan agar header tetap di atas */}
      <View style={[styles.headerFixed, { zIndex: 10 }]}>
        <AdminDashboardHeader
          headerHeight={headerHeight}
          revenueOpacity={revenueOpacity}
          topPadding={insets.top + 10}
          role="Administrator"
          displayName={currentDisplayName}
          totalRevenue={stats?.totalRevenue || 0}
          totalExpense={stats?.totalExpense || 0}
          totalProfit={stats?.totalProfit || 0}
          lowStockCount={stats?.lowStockCount || 0}
          onLowStockPress={() => navigation.navigate('Product')}
        />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: HEADER_MAX_HEIGHT + 10,
          paddingBottom: 40 + insets.bottom,
          paddingHorizontal: 20,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }, // Wajib false untuk height animation
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={HEADER_MAX_HEIGHT}
            colors={[COLORS.secondary]}
            tintColor={COLORS.secondary} // Untuk iOS
          />
        }>
        
        <DateRangeSelector
          selectedPreset={selectedPreset}
          onSelectPreset={setPresetRange}
        />

        {/* Quick Actions Shortcuts */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Pintasan Cepat</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('CashierManagement')}>
              <View style={[styles.iconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Users size={24} color="#3B82F6" />
              </View>
              <Text style={styles.actionText}>Kasir & Pegawai</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Product')}>
              <View style={[styles.iconWrap, { backgroundColor: '#F0FDF4' }]}>
                <Package size={24} color="#10B981" />
              </View>
              <Text style={styles.actionText}>Produk & Stok</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('Segera Hadir', 'Fitur Manajemen Member sedang dalam tahap pengembangan.')}>
              <View style={[styles.iconWrap, { backgroundColor: '#FEF2F2' }]}>
                <Crown size={24} color="#EF4444" />
              </View>
              <Text style={styles.actionText}>Daftar Member</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('Segera Hadir', 'Fitur Laporan Stok sedang dalam tahap pengembangan.')}>
              <View style={[styles.iconWrap, { backgroundColor: '#FFFBEB' }]}>
                <FileText size={24} color="#F59E0B" />
              </View>
              <Text style={styles.actionText}>Laporan Stok</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading && !refreshing ? (
          <View style={{ marginTop: 20 }}>
            <SkeletonLoadingMobile type="dashboard-card" rows={4} />
          </View>
        ) : (
          <View style={[styles.contentWrapper, { opacity: loading && !refreshing ? 0.6 : 1 }]}>
          <AdminStatsGrid
            totalProducts={stats?.totalProducts || 0}
            totalIn={stats?.totalIn || 0}
            totalOut={stats?.totalOut || 0}
            dateLabel={getDateLabel()}
          />

          <View style={styles.chartWrapper}>
            <AdminDashboardChart
              data={stats?.weeklyData || []}
              isLoading={loading}
              selectedPreset={selectedPreset}
              dateRangeLabel={stats?.dateRangeLabel}
            />
          </View>

          <View style={styles.rankingSection}>
            <AdminSalesRanking
              title="Produk Terlaris"
              data={stats?.salesRanking || []}
              unit="Terjual"
              color={COLORS.secondary}
              onSeeMore={() => navigation.navigate('Product', { filterType: 'sold-desc' })}
            />

            <AdminStockRanking
              title="Peringatan Stok Rendah"
              data={stats?.stockRanking || []}
              unit="Sisa"
              color="#ef4444"
              onSeeMore={() => navigation.navigate('Product', { filterType: 'stock-critical' })}
            />

            <AdminActivity
              activities={activities?.slice(0, 5) || []}
              currentUserName={currentDisplayName}
              onSeeMore={() => setModalVisible(true)}
            />
          </View>
        </View>
        )}

        <Text style={styles.footerBrand}>Swiftstock POS Hybrid • 2026</Text>
      </Animated.ScrollView>

      <ActivityModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        currentUserName={currentDisplayName}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'PoppinsBold', color: '#1E293B', marginBottom: 12 },
  quickActionsContainer: { marginTop: 16, marginBottom: 8 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontFamily: 'PoppinsSemiBold',
    color: '#334155',
    textAlign: 'center',
  },
  contentWrapper: {
    minHeight: 400,
  },
  chartWrapper: {
    marginTop: 15,
    minHeight: 250,
  },
  rankingSection: {
    marginTop: 20,
    paddingBottom: 20,
    gap: 16,
  },
  footerBrand: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 40,
    fontFamily: 'PoppinsRegular',
  },
});

export default AdminDashboard;