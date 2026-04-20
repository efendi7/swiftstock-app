import React, { useRef, useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  StatusBar, 
  ActivityIndicator, 
  RefreshControl 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

// Constants & Config
import { COLORS } from '../../../../constants/colors';
import { auth } from '../../../../services/firebaseConfig';
import { useDashboard } from '../../../../hooks/useDashboard'; 

// Sections
import { CashierDashboardHeader } from './sections/CashierDashboardHeader';
import { CashierStatsGrid } from './sections/CashierStatsGrid';
import { CashierDashboardChart } from './sections/CashierDashboardChart';
import { CashierSalesRanking, CashierStockRanking } from './sections/CashierRankings';
import { CashierActivity } from './sections/CashierActivity'; 

// Modal (Gunakan ActivityModal yang sudah mendukung Infinite Scroll)
import { ActivityModal } from '../admin/modal/ActivityModal'; 
import SkeletonLoadingMobile from '@components/common/SkeletonLoadingMobile';

const CashierDashboard = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  
  // Hook Dashboard untuk data statistik dan aktivitas real-time
  const { loading, stats, activities, refreshData } = useDashboard();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Ambil nama user secara dinamis
  const [currentDisplayName, setCurrentDisplayName] = useState(
    auth.currentUser?.displayName || 'Kasir Swiftstock'
  );

  // --- LOGIKA ANIMASI HEADER ---
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_MAX_HEIGHT = 240 + insets.top;
  const HEADER_MIN_HEIGHT = 75 + insets.top;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 140], 
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT], 
    extrapolate: 'clamp',
  });

  const contentOpacity = scrollY.interpolate({
    inputRange: [0, 100], 
    outputRange: [1, 0], 
    extrapolate: 'clamp',
  });

  // --- SIDE EFFECTS ---
  useFocusEffect(
    useCallback(() => {
      refreshData();
      if (auth.currentUser?.displayName) {
        setCurrentDisplayName(auth.currentUser.displayName);
      }
    }, [refreshData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    if (auth.currentUser?.displayName) {
      setCurrentDisplayName(auth.currentUser.displayName);
    }
    setRefreshing(false);
  }, [refreshData]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER ANIMASI */}
      <CashierDashboardHeader
        headerHeight={headerHeight}
        contentOpacity={contentOpacity}
        topPadding={insets.top + 10}
        role="Kasir"
        displayName={currentDisplayName} 
        todayOut={stats.totalOut || 0}
        todayTransactions={stats.totalTransactions || 0}
        todayRevenue={stats.totalRevenue || 0}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingTop: HEADER_MAX_HEIGHT + 15, 
          paddingBottom: 100 + insets.bottom, 
          paddingHorizontal: 20 
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }], 
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            progressViewOffset={HEADER_MAX_HEIGHT} 
            colors={[COLORS.secondary]} 
          />
        }
      >
        {loading && !refreshing ? (
          <View style={{ marginTop: 20 }}>
            <SkeletonLoadingMobile type="dashboard-card" rows={4} />
          </View>
        ) : (
          <View style={styles.contentWrapper}>
            /* GRID STATISTIK */
          <CashierStatsGrid
            totalProducts={stats.totalProducts}
            totalOut={stats.totalOut} 
            dateLabel="Hari ini"
          />

          {/* CHART PENJUALAN */}
          <View style={styles.chartWrapper}>
            <CashierDashboardChart
              data={stats.weeklyData} 
              isLoading={loading} 
              selectedPreset="today" 
            />
          </View>

          {/* RANKING & AKTIVITAS PREVIEW */}
          <View style={styles.rankingSection}>
            <CashierSalesRanking
              data={stats.salesRanking || []} 
              onSeeMore={() => navigation.navigate('Product', { filterType: 'sold-desc' })}
            />

            <CashierStockRanking
              data={stats.stockRanking || []} 
              onSeeMore={() => navigation.navigate('Inventory')}
            />

            {/* CARD AKTIVITAS: Hanya preview 5 data. 
                Tombol 'Lihat Selengkapnya' akan membuka ActivityModal */}
            <CashierActivity 
              activities={activities.slice(0, 5)} 
              currentUserName={currentDisplayName}
              onSeeMore={() => setModalVisible(true)} 
            />
          </View>
        </View>
        )}

        <Text style={styles.footerBrand}>Swiftstock by Efendi • 2026</Text>
      </Animated.ScrollView>

      {/* MODAL RIWAYAT LENGKAP: 
          Sudah menggunakan FlatList + Infinite Scroll (Pagination) */}
      <ActivityModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        currentUserName={currentDisplayName}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  loadingWrapper: { 
    height: 10, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginVertical: 4 
  },
  contentWrapper: { 
    marginTop: 0 
  },
  chartWrapper: { 
    marginTop: 10, 
    minHeight: 220 
  },
  rankingSection: { 
    marginTop: 20, 
    paddingBottom: 20, 
    gap: 15 
  },
  footerBrand: { 
    textAlign: 'center', 
    color: COLORS.textLight, 
    fontSize: 11, 
    marginTop: 40, 
    fontFamily: 'PoppinsRegular' 
  },
});

export default CashierDashboard;