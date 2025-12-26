import React, { useRef, useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  StatusBar, 
  ActivityIndicator, 
  RefreshControl,
  Modal,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { X } from 'lucide-react-native';
import { COLORS } from '../../../../constants/colors';

// Import Firebase Auth untuk sinkronisasi profil real-time
import { auth } from '../../../../services/firebaseConfig';
import { useDashboard } from '../../../../hooks/useDashboard';


import { AdminDashboardHeader } from './sections/AdminDashboardHeader';
import { AdminStatsGrid } from './sections/AdminStatsGrid';
import { AdminDashboardChart } from './sections/AdminDashboardChart';
import { DateRangeSelector } from '../../../../components/dashboard/DateRangeSelector';
import { AdminSalesRanking, AdminStockRanking  } from './sections/AdminRankings';
import { AdminActivity } from './sections/AdminActivity';

const AdminDashboard = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  
  const { 
    loading, 
    stats, 
    activities, 
    selectedPreset, 
    refreshData, 
    setPresetRange 
  } = useDashboard();
  
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // State lokal untuk nama agar reaktif terhadap perubahan di profil
  const [currentDisplayName, setCurrentDisplayName] = useState(
    auth.currentUser?.displayName || stats.userName || 'User Swiftstock'
  );

  const HEADER_MAX_HEIGHT = 265 + insets.top;
  const HEADER_MIN_HEIGHT = 70 + insets.top;

  // Update nama setiap kali layar kembali difokuskan
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

  const getDateLabel = () => {
    const labels: Record<string, string> = { 
      today: 'Hari ini', 
      week: '7 Hari', 
      month: '30 Hari', 
      year: '1 Tahun' 
    };
    return labels[selectedPreset] || 'Hari ini';
  };

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 180], 
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT], 
    extrapolate: 'clamp',
  });

  const revenueOpacity = scrollY.interpolate({
    inputRange: [0, 120], 
    outputRange: [1, 0], 
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <AdminDashboardHeader
        headerHeight={headerHeight}
        revenueOpacity={revenueOpacity}
        topPadding={insets.top + 10}
        role="Administrator"
        displayName={currentDisplayName}
        totalRevenue={stats.totalRevenue || 0}
        totalExpense={stats.totalExpense || 0}
        totalProfit={stats.totalProfit || 0}
        lowStockCount={stats.lowStockCount || 0}
        onLowStockPress={() => navigation.navigate('Product')}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: HEADER_MAX_HEIGHT + 4,
          paddingBottom: 100 + insets.bottom,
          paddingHorizontal: 20,
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
        <DateRangeSelector 
          selectedPreset={selectedPreset} 
          onSelectPreset={setPresetRange} 
        />

        <View style={styles.loadingWrapper}>
          {loading && !refreshing && (
            <ActivityIndicator size="small" color={COLORS.secondary} />
          )}
        </View>

        <View 
          renderToHardwareTextureAndroid={true}
          style={[
            styles.contentWrapper, 
            { opacity: loading && !refreshing ? 0.7 : 1 }
          ]}
        >
          <AdminStatsGrid
            totalProducts={stats.totalProducts}
            totalIn={stats.totalIn}
            totalOut={stats.totalOut}
            dateLabel={getDateLabel()}
          />

          <View style={styles.chartWrapper}>
            <AdminDashboardChart 
              data={stats.weeklyData} 
              isLoading={loading}
              selectedPreset={selectedPreset}
            />
          </View>

          <View style={styles.rankingSection}>
            <AdminSalesRanking 
    title="Produk Terlaris Hari Ini" 
    data={stats.salesRanking || []} 
    unit="Terjual" 
    color={COLORS.secondary} 
    // Navigasi ke Product dengan parameter filter Terlaris
    onSeeMore={() => navigation.navigate('Product', { filterType: 'sold-desc' })} 
  />

  <AdminStockRanking 
    title="Peringatan Stok Rendah" 
    data={stats.stockRanking || []} 
    unit="Sisa" 
    color="#ef4444" 
    // Navigasi ke Product dengan parameter filter Kritis
    onSeeMore={() => navigation.navigate('Product', { filterType: 'stock-critical' })} 
  />

            <AdminActivity 
              activities={activities.slice(0, 5)}
              onSeeMore={() => setModalVisible(true)}
            />
          </View>
        </View>

        <Text style={styles.footerBrand}>Swiftstock by Efendi • 2025</Text>
      </Animated.ScrollView>

      {/* MODAL RIWAYAT LENGKAP */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
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
                <AdminActivity
                  activities={activities}
                  onSeeMore={() => {}}
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
  loadingWrapper: { 
    height: 0, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginVertical: 4,
  },
  contentWrapper: {
    marginTop: 0,
    minHeight: 400, 
  },
  chartWrapper: {
    marginTop: 10,
    minHeight: 220,
  },
  rankingSection: {
    marginTop: 20,
    paddingBottom: 20,
    gap: 15,
  },
  footerBrand: { 
    textAlign: 'center', 
    color: COLORS.textLight, 
    fontSize: 11, 
    marginTop: 40, 
    fontFamily: 'PoppinsRegular' 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'PoppinsBold',
    color: COLORS.textDark,
  },
});

export default AdminDashboard;