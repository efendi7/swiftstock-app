import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';

import { RootStackParamList, CashierTabParamList } from '../../navigation/types';
import { COLORS } from '../../constants/colors';
import { useCashierData } from '../../hooks/useCashierData';

import { CashierHeader } from '../../components/cashier/CashierHeader';
import { StatsGrid } from '../../components/cashier/StatsGrid';
// Import komponen chart yang sama dengan Admin
import { DashboardChart } from '../../components/dashboard/DashboardChart';

type CashierDashboardNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<CashierTabParamList, 'CashierDashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const CashierDashboard = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<CashierDashboardNavProp>();
  const { loading, stats, refreshData } = useCashierData();
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);

  const HEADER_MAX_HEIGHT = 230 + insets.top;
  const HEADER_MIN_HEIGHT = 70 + insets.top;

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useFocusEffect(
    useCallback(() => {
      refreshData();
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

      <CashierHeader
        headerHeight={headerHeight}
        contentOpacity={contentOpacity}
        topPadding={insets.top + 10}
        userName={stats.userName || 'Kasir'}
        todayTransactions={stats.todayTransactions || 0}
        todayRevenue={stats.todayRevenue || 0}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: HEADER_MAX_HEIGHT + 15,
          paddingBottom: 40 + insets.bottom,
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
            colors={[COLORS.secondary]}
            tintColor={COLORS.secondary}
            progressViewOffset={HEADER_MAX_HEIGHT}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
            <Text style={styles.loadingText}>Memuat data...</Text>
          </View>
        ) : (
          <>
            {/* 1. Grid Statistik Penjualan */}
            <StatsGrid 
              totalProducts={stats.totalProducts || 0}
              outToday={stats.itemsOut || 0}
            />

            {/* 2. Chart Tren Penjualan Kasir (Mingguan) */}
            <DashboardChart data={stats.weeklyData || []} />

            {/* 3. Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>💡 Tips Hari Ini</Text>
              <Text style={styles.infoText}>
                Grafik di atas menunjukkan performa penjualan Anda selama seminggu terakhir. Tetap semangat melayani pelanggan!
              </Text>
            </View>

            <Text style={styles.footerBrand}>SwiftPay Ecosystem v1.0 • 2025</Text>
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  loadingText: { marginTop: 12, color: COLORS.textLight, fontSize: 14 },
  infoCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  infoTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textDark, marginBottom: 5 },
  infoText: { fontSize: 13, color: COLORS.textLight, lineHeight: 20 },
  footerBrand: { textAlign: 'center', color: COLORS.textLight, fontSize: 11, marginTop: 40, marginBottom: 20 },
});

export default CashierDashboard;