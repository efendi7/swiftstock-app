import React, { useRef, useCallback, useState } from 'react';
import { 
  View, Text, StyleSheet, Animated, StatusBar, ActivityIndicator, 
  RefreshControl, Modal, ScrollView, TouchableOpacity 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { X } from 'lucide-react-native'; 
import { COLORS } from '../../../../constants/colors';
import { auth } from '../../../../services/firebaseConfig';
import { useDashboard } from '../../../../hooks/useDashboard'; 

// Components
import { CashierDashboardHeader } from './sections/CashierDashboardHeader';
import { CashierStatsGrid } from './sections/CashierStatsGrid';
import { CashierDashboardChart } from './sections/CashierDashboardChart';
import { CashierSalesRanking, CashierStockRanking } from './sections/CashierRankings';
import { CashierActivity } from './sections/CashierActivity'; // Gunakan komponen yang sudah difilter

const CashierDashboard = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  
  const { loading, stats, activities, refreshData } = useDashboard();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Ambil nama user secara dinamis dari Auth
  const [currentDisplayName, setCurrentDisplayName] = useState(
    auth.currentUser?.displayName || 'Kasir Swiftstock'
  );

  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_MAX_HEIGHT = 240 + insets.top;
  const HEADER_MIN_HEIGHT = 75 + insets.top;

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
        <View style={styles.loadingWrapper}>
          {loading && !refreshing && <ActivityIndicator size="small" color={COLORS.secondary} />}
        </View>

        <View style={styles.contentWrapper}>
          <CashierStatsGrid
            totalProducts={stats.totalProducts}
            totalOut={stats.totalOut} 
            dateLabel="Hari ini"
          />

          <View style={styles.chartWrapper}>
            <CashierDashboardChart
              data={stats.weeklyData} 
              isLoading={loading} 
              selectedPreset="today" 
            />
          </View>

          <View style={styles.rankingSection}>
            {/* PERBAIKAN: Hanya kirim data dan onSeeMore agar tidak error IntrinsicAttributes */}
            <CashierSalesRanking
              data={stats.salesRanking || []} 
              onSeeMore={() => navigation.navigate('Product', { filterType: 'sold-desc' })}
            />

            <CashierStockRanking
              data={stats.stockRanking || []} 
              onSeeMore={() => navigation.navigate('Inventory')}
            />

            {/* PERBAIKAN: Gunakan CashierActivity untuk handle logika filter "Anda" dan "Admin" */}
            <CashierActivity 
              activities={activities} 
              currentUserName={currentDisplayName}
              onSeeMore={() => setModalVisible(true)} 
            />
          </View>
        </View>

        <Text style={styles.footerBrand}>Swiftstock by Efendi • 2025</Text>
      </Animated.ScrollView>

      {/* MODAL RIWAYAT LENGKAP KASIR */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: insets.top + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Riwayat Aktivitas</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ padding: 20 }}>
                {/* Gunakan komponen yang sama di dalam modal */}
                <CashierActivity 
                  activities={activities} 
                  currentUserName={currentDisplayName}
                />
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