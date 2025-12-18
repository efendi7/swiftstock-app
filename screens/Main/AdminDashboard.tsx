import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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

  /* REFRESH SAAT TAB AKTIF */
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', refreshData);
    return unsubscribe;
  }, [navigation, refreshData]);

  /* HEADER ANIMATION */
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
        totalRevenue={stats.totalRevenue}
        totalExpense={stats.totalExpense}
        totalProfit={stats.totalProfit}
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
          <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 50 }} />
        ) : (
          <>
            <StatsGrid
              totalProducts={stats.totalProducts}
              inToday={stats.inToday}
              outToday={stats.outToday}
            />

            <DashboardChart data={stats.weeklyData} />

            <LowStockAlert
              count={stats.lowStockCount}
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
