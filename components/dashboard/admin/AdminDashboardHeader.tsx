// components/dashboard/admin/AdminDashboardHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react-native';
import { DashboardHeader } from '../DashboardHeader';
import { COLORS } from '../../../constants/colors';

interface AdminDashboardHeaderProps {
  headerHeight: Animated.AnimatedInterpolation<number>;
  revenueOpacity: Animated.AnimatedInterpolation<number>;
  topPadding: number;
  displayName: string;
  role: string;
  totalRevenue: number;
  totalExpense: number;
  totalProfit: number;
  lowStockCount: number;
  onLowStockPress: () => void;
  onNotificationPress?: () => void;
}

export const AdminDashboardHeader: React.FC<AdminDashboardHeaderProps> = ({
  headerHeight,
  revenueOpacity,
  topPadding,
  displayName,
  role,
  totalRevenue,
  totalExpense,
  totalProfit,
  lowStockCount,
  onLowStockPress,
  onNotificationPress,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const profitPercentage = totalRevenue > 0 
    ? ((totalProfit / totalRevenue) * 100).toFixed(1) 
    : '0.0';

  return (
    <DashboardHeader
      headerHeight={headerHeight}
      contentOpacity={revenueOpacity} // ← Gunakan contentOpacity, bukan revenueOpacity
      topPadding={topPadding}
      displayName={displayName}
      role={role}
      gradientColors={[COLORS.primary, COLORS.primaryDark || '#152D47'] as const} // ← Tambahkan 'as const'
      onNotificationPress={onNotificationPress}
      showNotification={true}
      showLogout={false}
    >
      {/* Konten Spesifik Admin */}
      <View style={styles.adminContent}>
        {/* Financial Summary */}
        <View style={styles.financialCard}>
          <View style={styles.mainMetric}>
            <Text style={styles.metricLabel}>Total Pendapatan</Text>
            <Text style={styles.metricValue}>{formatCurrency(totalRevenue)}</Text>
          </View>

          <View style={styles.subMetrics}>
            <View style={styles.subMetric}>
              <TrendingDown size={16} color={COLORS.danger} />
              <View style={styles.subMetricText}>
                <Text style={styles.subLabel}>Pengeluaran</Text>
                <Text style={[styles.subValue, { color: COLORS.danger }]}>
                  {formatCurrency(totalExpense)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.subMetric}>
              <TrendingUp size={16} color={COLORS.success} />
              <View style={styles.subMetricText}>
                <Text style={styles.subLabel}>Profit ({profitPercentage}%)</Text>
                <Text style={[styles.subValue, { color: COLORS.success }]}>
                  {formatCurrency(totalProfit)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Low Stock Alert */}
        {lowStockCount > 0 && (
          <TouchableOpacity style={styles.alertBanner} onPress={onLowStockPress}>
            <AlertCircle size={18} color={COLORS.danger} />
            <Text style={styles.alertText}>
              {lowStockCount} produk stok menipis
            </Text>
            <Text style={styles.alertAction}>Lihat →</Text>
          </TouchableOpacity>
        )}
      </View>
    </DashboardHeader>
  );
};

const styles = StyleSheet.create({
  adminContent: {
    gap: 12,
  },
  financialCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    // backdropFilter tidak didukung di React Native, hapus baris ini
  },
  mainMetric: {
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.8,
    fontFamily: 'PoppinsRegular',
  },
  metricValue: {
    fontSize: 28,
    fontFamily: 'PoppinsBold',
    color: '#FFF',
    marginTop: 2,
  },
  subMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  subMetric: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subMetricText: {
    flex: 1,
  },
  subLabel: {
    fontSize: 10,
    color: '#FFF',
    opacity: 0.8,
    fontFamily: 'PoppinsRegular',
  },
  subValue: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 4,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: '#FFF',
    fontFamily: 'PoppinsMedium',
  },
  alertAction: {
    fontSize: 13,
    color: '#FFF',
    fontFamily: 'PoppinsSemiBold',
  },
});