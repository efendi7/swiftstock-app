import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Package, ArrowDownLeft, ArrowUpRight, ClipboardList } from 'lucide-react-native';
import { COLORS } from '../../../../../constants/colors';
import { BaseStatsGrid, StatsGridHeader, StatItem } from '../../../../../components/dashboard/stats';

const { width } = Dimensions.get('window');

const PADDING_OUTER = 40; // ScrollView padding
const PADDING_INNER = 32; // Card padding
const GAP = 10;

const CARD_WIDTH = (width - PADDING_OUTER - PADDING_INNER - (GAP * 2)) / 3;

interface AdminStatsGridProps {
  totalProducts: number;
  totalIn: number;
  totalOut: number;
  dateLabel?: string;
  isLoading?: boolean;
}

export const AdminStatsGrid: React.FC<AdminStatsGridProps> = React.memo(
  ({ totalProducts, totalIn, totalOut, dateLabel = 'Hari ini', isLoading }) => {

    const compactNumberStyle = {
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '700' as const,
    };

    const renderHeader = () => (
      <StatsGridHeader
        icon={<ClipboardList size={18} color={COLORS.primary} />}
        title="Ringkasan Inventaris"
        dateLabel={dateLabel}
        variant="default"
      />
    );

    const renderStats = () => (
      <View style={styles.gridContainer}>

        {/* Item 1 */}
        <StatItem
          icon={<Package size={16} color="#059669" />}
          iconBgColor="#f0fdf4"
          value={totalProducts}
          label="Total Produk"
          width={CARD_WIDTH}
          valueStyle={compactNumberStyle}
        />

        {/* Divider */}
        <View style={styles.divider} />

        {/* Item 2 */}
        <StatItem
          icon={<ArrowDownLeft size={16} color="#10b981" />}
          iconBgColor="#ecfdf5"
          value={totalIn}
          label="Stok Masuk"
          width={CARD_WIDTH}
          valueStyle={compactNumberStyle}
        />

        {/* Divider */}
        <View style={styles.divider} />

        {/* Item 3 */}
        <StatItem
          icon={<ArrowUpRight size={16} color="#ef4444" />}
          iconBgColor="#fef2f2"
          value={totalOut}
          label="Stok Keluar"
          width={CARD_WIDTH}
          valueStyle={compactNumberStyle}
        />

      </View>
    );

    return (
      <BaseStatsGrid
        dateLabel={dateLabel}
        isLoading={isLoading}
        renderHeader={renderHeader}
        renderStats={renderStats}
        containerStyle="card"
      />
    );
  }
);

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
  },

  divider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
});

export default AdminStatsGrid;
