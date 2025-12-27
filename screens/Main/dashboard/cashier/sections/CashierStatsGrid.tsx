import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Package, ArrowUpRight, ClipboardList } from 'lucide-react-native';
import { COLORS } from '../../../../../constants/colors';
// Import langsung dari file component (bukan dari index.ts)
import { BaseStatsGrid } from '../../../../../components/dashboard/stats/BaseStatsGrid';
import { StatCard } from '../../../../../components/dashboard/stats/StatCard';

const { width } = Dimensions.get('window');
const PADDING_SCREEN = 40;
const GAP = 12;
const CARD_WIDTH = (width - PADDING_SCREEN - GAP) / 2;

interface CashierStatsGridProps {
  totalProducts: number;
  totalOut: number;
  dateLabel?: string;
  isLoading?: boolean;
}

export const CashierStatsGrid: React.FC<CashierStatsGridProps> = React.memo(
  ({ totalProducts, totalOut, isLoading }) => {
    
    const renderHeader = () => (
      <View style={styles.headerTitle}>
        <ClipboardList size={18} color={COLORS.textDark} style={{ marginRight: 8 }} />
        <Text style={styles.sectionTitle}>Ringkasan Penjualan</Text>
      </View>
    );

    const renderStats = () => (
      <View style={styles.gridContainer}>
        {/* Total Produk */}
        <StatCard
          icon={<Package size={16} color="#3b82f6" />}
          iconBgColor="#eff6ff"
          value={totalProducts}
          label="Total Produk"
          width={CARD_WIDTH}
        />

        {/* Stok Keluar Hari Ini */}
        <StatCard
          icon={<ArrowUpRight size={16} color="#ef4444" />}
          iconBgColor="#fef2f2"
          value={totalOut}
          label="Total Stok Keluar"
          width={CARD_WIDTH}
        />
      </View>
    );

    return (
      <BaseStatsGrid
        isLoading={isLoading}
        renderHeader={renderHeader}
        renderStats={renderStats}
        containerStyle="flat"
      />
    );
  }
);

const styles = StyleSheet.create({
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'PoppinsSemiBold',
    color: COLORS.textDark,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});