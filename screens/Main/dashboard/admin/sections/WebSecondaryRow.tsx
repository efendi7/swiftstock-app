/**
 * WebSecondaryRow.tsx — ROW 3
 * Tiga chart seragam ukuran (alignItems:'stretch'):
 *   [StockFlowChart flex 1.6] [HourlyScatter flex 1.6] [ProductRankingCard flex 1]
 *
 * ProductRankingCard menggunakan flex:1 agar tingginya sama dengan sidebar
 * WebPaymentMemberCard di ROW 2 (keduanya flex:1 di kolom kanan).
 * Karena ROW 2 sidebar = flex:1 dari total row, dan ROW 3 rankCard = flex:1,
 * secara visual kolom kanan akan sejajar lebar.
 */
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

import { StockFlowChart }               from '@components/dashboard/chart/StockFlowChart';
import { HourlyChart, HourlyDataPoint } from '@components/dashboard/chart/HourlyChart';
import { ProductRankingCard }           from './ProductRankingCard';
import { ProductStat }                  from '@/types/dashboard.types';

interface Props {
  unitData:        { label: string; unitIn?: number; unitOut?: number; newProducts?: number }[];
  hourlyData?:     HourlyDataPoint[];
  salesRanking:    ProductStat[];
  stockRanking:    ProductStat[];
  selectedPreset:  'today' | 'week' | 'month' | 'year';
  isLoading:       boolean;
  dateRangeLabel?: string;
  onSeeMoreSales?: () => void;
  onSeeMoreStock?: () => void;
}

const shadow = Platform.select({
  web:     { boxShadow: '0px 4px 16px rgba(0,0,0,0.05)' } as any,
  default: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
});
const cardBase: object = {
  backgroundColor: '#FFF', borderRadius: 16, padding: 20,
  borderWidth: 1, borderColor: '#EFF2F7',
  ...shadow as any,
  ...Platform.select({ web: { contain: 'layout style', overflow: 'hidden' } as any }),
};

const _WebSecondaryRow: React.FC<Props> = ({
  unitData, hourlyData, salesRanking, stockRanking,
  selectedPreset, isLoading, dateRangeLabel,
  onSeeMoreSales, onSeeMoreStock,
}) => (
  <View style={styles.row}>

    {/* StockFlowChart — sama lebar dengan MoneyFlow di ROW 2 */}
    <View style={[cardBase, styles.chartCard]}>
      <StockFlowChart
        data={unitData}
        isLoading={isLoading}
        dateRangeLabel={dateRangeLabel}
      />
    </View>

    {/* HourlyChart Scatter — sama lebar */}
    <View style={[cardBase, styles.chartCard]}>
      <HourlyChart
        data={hourlyData}
        isLoading={isLoading}
        selectedPreset={selectedPreset}
      />
    </View>

    {/* ProductRankingCard — sama lebar dengan kolom sidebar ROW 2 */}
    <View style={[cardBase, styles.rankCard]}>
      <ProductRankingCard
        salesRanking={salesRanking}
        stockRanking={stockRanking}
        isLoading={isLoading}
        onSeeMoreSales={onSeeMoreSales}
        onSeeMoreStock={onSeeMoreStock}
      />
    </View>

  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    alignItems: 'stretch',  // semua card sama tinggi dalam row
  },
  chartCard: {
    flex: 1.6,  // sama persis dengan heroCard di WebMainRow
  },
  rankCard: {
    flex: 1,    // sama persis dengan sidebar di WebMainRow
  },
});

export const WebSecondaryRow = React.memo(_WebSecondaryRow);
export default WebSecondaryRow;