// screens/Main/AdminDashboard.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { AdminTabParamList } from '../../navigation/types';

import { COLORS } from '../../constants/colors';
import { useDashboard } from '../../hooks/useDashboard';

import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { StatsGrid } from '../../components/dashboard/StatsGrid';
import { DashboardChart } from '../../components/dashboard/DashboardChart';
import { LowStockAlert } from '../../components/dashboard/LowStockAlert';

type NavigationProp = BottomTabNavigationProp<AdminTabParamList, 'AdminDashboard'>;

const AdminDashboard = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const { loading, stats, refreshData } = useDashboard();
  const scrollY = useRef(new Animated.Value(0)).current;

  const HEADER_MAX_HEIGHT = 230 + insets.top;
  const HEADER_MIN_HEIGHT = 70 + insets.top;

  // Refresh saat pertama kali dibuka
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Refresh setiap kali screen ini difocus (kembali dari ProductScreen, dll)
  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 140],
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

      <DashboardHeader
        headerHeight={headerHeight}
        revenueOpacity={revenueOpacity}
        topPadding={insets.top + 10}
        totalRevenue={stats.totalRevenue || 0}
        totalExpense={stats.totalExpense || 0}
        totalProfit={stats.totalProfit || 0}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: HEADER_MAX_HEIGHT + 12,
          paddingBottom: 100 + insets.bottom,
          paddingHorizontal: 20,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.secondary} />
            <Text style={styles.loadingText}>Memuat data dashboard...</Text>
          </View>
        ) : (
          <>
            <StatsGrid
              totalProducts={stats.totalProducts || 0}
              inToday={stats.inToday || 0}
              outToday={stats.outToday || 0}
            />

            <DashboardChart data={stats.weeklyData || []} />

            <LowStockAlert
              count={stats.lowStockCount || 0}
              onPress={() => navigation.navigate('Product')}
            />

            <View style={styles.demoContent}>
              <Text style={styles.demoText}>SwiftPay Analytics Engine</Text>
            </View>

            <Text style={styles.footerBrand}>
              SwiftPay Ecosystem v1.0 • 2025
            </Text>
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textLight,
    fontSize: 14,
  },
  demoContent: {
    height: 100,
    marginTop: 10,
    backgroundColor: '#FFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  demoText: { color: COLORS.textLight, fontSize: 12 },
  footerBrand: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontSize: 11,
    marginTop: 40,
  },
});

export default AdminDashboard;