import React, { useRef, useCallback, useState } from 'react';
import { 
  View, Text, StyleSheet, Animated, StatusBar, ActivityIndicator, 
  RefreshControl, Modal, ScrollView, TouchableOpacity 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { X, AlertCircle } from 'lucide-react-native'; 
import { COLORS } from '../../constants/colors';
import { auth } from '../../services/firebaseConfig';
import { useDashboard } from '../../hooks/useDashboard'; 

// Components
import { CashierHeader } from '../../components/cashier/CashierHeader';
import { StatsGrid } from '../../components/dashboard/StatsGrid';
import { DashboardChart } from '../../components/dashboard/DashboardChart';
import { ProductRankingCard } from '../../components/dashboard/ProductRankingCard';
import { RecentActivityCard } from '../../components/dashboard/RecentActivityCard';

const CashierDashboard = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  
  // Ambil data dari hook
  const { loading, stats, activities, refreshData } = useDashboard();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentDisplayName, setCurrentDisplayName] = useState(auth.currentUser?.displayName || 'Kasir');

  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_MAX_HEIGHT = 240 + insets.top;
  const HEADER_MIN_HEIGHT = 75 + insets.top;

  // Sinkronisasi data setiap kali layar difokuskan
  useFocusEffect(
    useCallback(() => {
      refreshData(); // Ini akan memanggil DashboardService.getPresetDateRange('today') secara default
      if (auth.currentUser?.displayName) setCurrentDisplayName(auth.currentUser.displayName);
    }, [refreshData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 1. HEADER - Tetap Hari Ini */}
      <CashierHeader
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
          paddingBottom: 40 + insets.bottom, 
          paddingHorizontal: 20 
        }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
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
        {/* Indikator Laporan Hari Ini
        <View style={styles.todayBadge}>
          <Text style={styles.todayText}>Laporan Operasional Hari Ini</Text>
        </View> */}

        <View style={styles.loadingWrapper}>
          {loading && !refreshing && <ActivityIndicator size="small" color={COLORS.secondary} />}
        </View>

        <View style={styles.contentWrapper}>
          {/* 2. STATS GRID - Menampilkan performa stok hari ini */}
          <StatsGrid
            totalProducts={stats.totalProducts}
            totalIn={stats.totalIn}
            totalOut={stats.totalOut} 
            dateLabel="Hari ini"
          />

          {/* 3. CHART - Tren penjualan per jam (Hari ini) */}
          <View style={styles.chartWrapper}>
            <DashboardChart 
              data={stats.weeklyData} 
              isLoading={loading} 
              selectedPreset="today" 
            />
          </View>

          <View style={styles.rankingSection}>
            {/* 4. RANKING PENJUALAN - Produk laku hari ini */}
            <ProductRankingCard 
              title="Produk Terlaris Hari Ini" 
              data={stats.salesRanking || []} 
              unit="Terjual" 
              color={COLORS.secondary} 
            />

            {/* 5. RANKING STOK - Dimunculkan kembali untuk kontrol inventori */}
            <ProductRankingCard 
              title="Peringatan Stok Rendah" 
              data={stats.stockRanking || []} 
              unit="Sisa" 
              color="#ef4444" // Merah untuk peringatan
              onSeeMore={() => {
    // Navigasikan ke layar Inventori atau buka modal khusus stok
    navigation.navigate('Inventory'); 
  }}
            />

            {/* 6. AKTIVITAS TERBARU */}
            <RecentActivityCard 
              activities={activities.slice(0, 5)} 
              onSeeMore={() => setModalVisible(true)} 
            />
          </View>
        </View>

        <Text style={styles.footerBrand}>SwiftPay Ecosystem • 2025</Text>
      </Animated.ScrollView>

      {/* MODAL RIWAYAT */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: insets.top + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Riwayat Aktivitas</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><X size={24} color={COLORS.textDark} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ padding: 20 }}>
                <RecentActivityCard activities={activities} onSeeMore={() => {}} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  todayBadge: {
    backgroundColor: '#F0F9FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  todayText: {
    color: '#0369A1',
    fontSize: 11,
    fontFamily: 'PoppinsMedium',
  },
  loadingWrapper: { height: 10, justifyContent: 'center', alignItems: 'center', marginVertical: 4 },
  contentWrapper: { marginTop: 0 },
  chartWrapper: { marginTop: 10, minHeight: 220 },
  rankingSection: { marginTop: 20, paddingBottom: 20, gap: 15 },
  footerBrand: { textAlign: 'center', color: COLORS.textLight, fontSize: 11, marginTop: 40, fontFamily: 'PoppinsRegular' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalTitle: { fontSize: 18, fontFamily: 'PoppinsBold', color: COLORS.textDark },
});

export default CashierDashboard;