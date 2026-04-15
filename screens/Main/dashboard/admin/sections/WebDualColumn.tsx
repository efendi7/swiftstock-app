/**
 * WebDualColumn.tsx
 *
 * Dua kolom besar yang terkunci sejajar:
 *
 * KOLOM KIRI  (flex 1.6) — 3 chart berurutan:
 *   ┌─────────────────────┐
 *   │   MoneyFlowChart    │  card 1
 *   ├─────────────────────┤
 *   │   StockFlowChart    │  card 2
 *   ├─────────────────────┤
 *   │   HourlyScatter     │  card 3
 *   └─────────────────────┘
 *
 * KOLOM KANAN (flex 1) — 3 panel berurutan:
 *   ┌──────────────────┐
 *   │  PeriodCompare   │  card A
 *   ├──────────────────┤
 *   │ PaymentMember    │  card B
 *   ├──────────────────┤
 *   │ ProductRanking   │  card C
 *   └──────────────────┘
 *
 * Setiap pasangan (1↔A, 2↔B, 3↔C) berada dalam satu "baris virtual"
 * menggunakan flex + alignItems:'stretch' agar tinggi antar-pasangan
 * tidak harus sama — masing-masing tumbuh sesuai konten, tapi lebar
 * kolom selalu sejajar.
 */
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

import { MoneyFlowChart }                       from '@components/dashboard/chart/MoneyFlowChart';
import { StockFlowChart }                       from '@components/dashboard/chart/StockFlowChart';
import { HourlyChart, HourlyDataPoint }         from '@components/dashboard/chart/HourlyChart';
import { PeriodCompareCard, PeriodCompareData } from '@components/dashboard/chart/PeriodCompareCard';
import { WebPaymentMemberCard }                 from '@components/dashboard/chart/WebPaymentMemberCard';
import { ProductRankingCard }                   from './ProductRankingCard';
import { ProductStat }                          from '@/types/dashboard.types';

interface Props {
  // Kolom kiri
  moneyData:      { label: string; revenue?: number; modal?: number }[];
  unitData:       { label: string; unitIn?: number; unitOut?: number; newProducts?: number }[];
  hourlyData?:    HourlyDataPoint[];
  totalRevenue:   number;
  totalExpense:   number;
  totalProfit:    number;
  selectedPreset: 'today' | 'week' | 'month' | 'year';
  dateRangeLabel?: string;
  // Kolom kanan
  periodCompare?: PeriodCompareData;
  paymentData?:   { method: string; total: number }[];
  memberStats?:   {
    memberTx: number; nonMemberTx: number;
    totalTx: number; memberSpend: number; memberRate: number;
  };
  salesRanking:   ProductStat[];
  stockRanking:   ProductStat[];
  onSeeMoreSales?: () => void;
  onSeeMoreStock?: () => void;
  // Shared
  isLoading: boolean;
}

// ─── Shadow & card base ────────────────────────────────────
const shadow = Platform.select({
  web:     { boxShadow: '0px 4px 16px rgba(0,0,0,0.05)' } as any,
  default: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
});
const card: object = {
  backgroundColor: '#FFF',
  borderRadius: 16,
  padding: 20,
  borderWidth: 1,
  borderColor: '#EFF2F7',
  ...shadow as any,
  ...Platform.select({ web: { contain: 'layout style', overflow: 'hidden' } as any }),
};

// ─── Main ──────────────────────────────────────────────────
const _WebDualColumn: React.FC<Props> = ({
  moneyData, unitData, hourlyData,
  totalRevenue, totalExpense, totalProfit,
  selectedPreset, dateRangeLabel,
  periodCompare, paymentData, memberStats,
  salesRanking, stockRanking,
  onSeeMoreSales, onSeeMoreStock,
  isLoading,
}) => (
  <View style={styles.outer}>

    {/* ══ KOLOM KIRI ══ */}
    <View style={styles.leftCol}>

      <View style={card}>
        <MoneyFlowChart
          data={moneyData}
          isLoading={isLoading}
          dateRangeLabel={dateRangeLabel}
          totalRevenue={totalRevenue}
          totalExpense={totalExpense}
          totalProfit={totalProfit}
        />
      </View>

      <View style={card}>
        <StockFlowChart
          data={unitData}
          isLoading={isLoading}
          dateRangeLabel={dateRangeLabel}
        />
      </View>

      <View style={card}>
        <HourlyChart
          data={hourlyData}
          isLoading={isLoading}
          selectedPreset={selectedPreset}
        />
      </View>

    </View>

    {/* ══ KOLOM KANAN ══ */}
    <View style={styles.rightCol}>

      <View style={card}>
        <PeriodCompareCard data={periodCompare} isLoading={isLoading} />
      </View>

      <View style={card}>
        <WebPaymentMemberCard
          paymentData={paymentData}
          memberStats={memberStats}
          isLoading={isLoading}
        />
      </View>

      <View style={card}>
        <ProductRankingCard
          salesRanking={salesRanking}
          stockRanking={stockRanking}
          isLoading={isLoading}
          onSeeMoreSales={onSeeMoreSales}
          onSeeMoreStock={onSeeMoreStock}
        />
      </View>

    </View>

  </View>
);

const styles = StyleSheet.create({
  // Outer: dua kolom sejajar, kolom masing-masing adalah flex column
  outer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    alignItems: 'flex-start', // kolom tumbuh sendiri sesuai kontennya
  },
  leftCol: {
    flex: 1.6,
    gap: 14,
  },
  rightCol: {
    flex: 1,
    gap: 14,
  },
});

export const WebDualColumn = React.memo(_WebDualColumn);
export default WebDualColumn;