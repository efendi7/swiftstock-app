/**
 * StockPurchaseChart.tsx
 * Chart stok masuk dengan 3 tab metrik:
 * - Unit Masuk (jumlah unit)
 * - Nilai Beli (rupiah)
 * - Produk Baru (jumlah produk ditambahkan)
 *
 * Dipakai di AdminDashboardWeb side-by-side dengan AdminDashboardChart.
 * Bisa juga dipakai di mobile tanpa perubahan.
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  useWindowDimensions, Platform,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { PackagePlus, TrendingDown, ShoppingCart } from 'lucide-react-native';
import { COLORS } from '../../../constants/colors';
import { ChartDataPoint } from '../../../types/dashboard.types';

type MetricKey = 'unit' | 'value' | 'new';

interface Props {
  unitData?:  ChartDataPoint[];
  valueData?: ChartDataPoint[];
  newData?:   ChartDataPoint[];
  isLoading?: boolean;
  selectedPreset: 'today' | 'week' | 'month' | 'year';
  dateRangeLabel?: string;
}

const METRICS: { key: MetricKey; label: string; icon: any; color: string; unit: string }[] = [
  { key: 'unit',  label: 'Unit Masuk',   icon: PackagePlus,   color: '#3B82F6', unit: 'unit' },
  { key: 'value', label: 'Nilai Beli',   icon: ShoppingCart,  color: '#8B5CF6', unit: 'Rp'   },
  { key: 'new',   label: 'Produk Baru',  icon: TrendingDown,  color: '#10B981', unit: 'item' },
];

export const StockPurchaseChart: React.FC<Props> = ({
  unitData  = [],
  valueData = [],
  newData   = [],
  isLoading = false,
  selectedPreset,
  dateRangeLabel,
}) => {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('unit');
  const { width: windowWidth } = useWindowDimensions();

  const getChartWidth = () => {
    if (Platform.OS === 'web') return Math.min(windowWidth * 0.3, 520);
    return windowWidth - 80;
  };

  const dataMap: Record<MetricKey, ChartDataPoint[]> = {
    unit:  unitData,
    value: valueData,
    new:   newData,
  };

  const current    = METRICS.find(m => m.key === activeMetric)!;
  const chartData  = dataMap[activeMetric];
  const values     = chartData.map(d => d.value);
  const labels     = chartData.map(d => d.label ?? '');
  const totalValue = values.reduce((s, v) => s + v, 0);
  const hasData    = totalValue > 0;

  const formatTotal = () => {
    if (activeMetric === 'value') {
      if (totalValue >= 1_000_000) return `Rp ${(totalValue / 1_000_000).toFixed(1)}jt`;
      if (totalValue >= 1_000)     return `Rp ${(totalValue / 1_000).toFixed(0)}rb`;
      return `Rp ${totalValue.toLocaleString('id-ID')}`;
    }
    return `${totalValue.toLocaleString('id-ID')} ${current.unit}`;
  };

  const chartConfig = {
    backgroundColor: '#FFF',
    backgroundGradientFrom: '#FFF',
    backgroundGradientTo: '#FFF',
    decimalPlaces: 0,
    color: () => current.color,
    labelColor: () => '#94A3B8',
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#FFF' },
    propsForBackgroundLines: { strokeDasharray: '0', stroke: '#F0F0F0' },
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: current.color + '18' }]}>
          <current.icon size={18} color={current.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Analitik Stok Masuk</Text>
          <Text style={[styles.subtitle, { color: current.color }]}>
            Total: {formatTotal()}
          </Text>
        </View>
      </View>

      {/* TAB METRIK */}
      <View style={styles.tabs}>
        {METRICS.map(m => (
          <TouchableOpacity
            key={m.key}
            style={[
              styles.tab,
              activeMetric === m.key && { backgroundColor: m.color, borderColor: m.color },
            ]}
            onPress={() => setActiveMetric(m.key)}
            activeOpacity={0.75}
          >
            <m.icon
              size={12}
              color={activeMetric === m.key ? '#FFF' : '#64748B'}
            />
            <Text style={[
              styles.tabText,
              activeMetric === m.key && styles.tabTextActive,
            ]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CHART */}
      <View style={styles.chartArea}>
        {isLoading ? (
          <ActivityIndicator size="large" color={current.color} style={{ marginTop: 40 }} />
        ) : hasData ? (
          <LineChart
            data={{ labels, datasets: [{ data: values.length > 0 ? values : [0, 0] }] }}
            width={getChartWidth()}
            height={180}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withVerticalLines
            withHorizontalLines
            withInnerLines
            withOuterLines={false}
            yAxisLabel={activeMetric === 'value' ? 'Rp ' : ''}
            formatYLabel={val => {
              const n = parseInt(val);
              if (activeMetric === 'value') {
                if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'jt';
                if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'rb';
              }
              return val;
            }}
          />
        ) : (
          <View style={styles.empty}>
            <PackagePlus size={36} color="#E2E8F0" strokeWidth={1.5} />
            <Text style={styles.emptyText}>Belum ada data stok masuk</Text>
            <Text style={styles.emptyHint}>Tambah stok produk untuk melihat grafik</Text>
          </View>
        )}
      </View>

      {/* SUMMARY CHIPS */}
      <View style={styles.summaryRow}>
        <SummaryChip
          label="Unit Masuk"
          value={unitData.reduce((s, d) => s + d.value, 0).toLocaleString('id-ID')}
          unit="unit"
          color="#3B82F6"
        />
        <SummaryChip
          label="Nilai Beli"
          value={(() => {
            const v = valueData.reduce((s, d) => s + d.value, 0);
            if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'jt';
            if (v >= 1_000)     return (v / 1_000).toFixed(0) + 'rb';
            return v.toLocaleString('id-ID');
          })()}
          unit="Rp"
          color="#8B5CF6"
        />
        <SummaryChip
          label="Produk Baru"
          value={newData.reduce((s, d) => s + d.value, 0).toLocaleString('id-ID')}
          unit="item"
          color="#10B981"
        />
      </View>

      {/* FOOTER */}
      {dateRangeLabel && (
        <Text style={styles.footerLabel}>📅 {dateRangeLabel}</Text>
      )}
    </View>
  );
};

// ── SUMMARY CHIP ──────────────────────────────────────────
const SummaryChip = ({ label, value, unit, color }: {
  label: string; value: string; unit: string; color: string;
}) => (
  <View style={[styles.chip, { borderColor: color + '30', backgroundColor: color + '0D' }]}>
    <Text style={[styles.chipValue, { color }]}>{value}</Text>
    <Text style={[styles.chipUnit,  { color }]}> {unit}</Text>
    <Text style={styles.chipLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },

  // HEADER
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  iconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title:    { fontSize: 14, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  subtitle: { fontSize: 12, fontFamily: 'PoppinsRegular', marginTop: 1 },

  // TABS
  tabs: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    // @ts-ignore
    cursor: 'pointer',
  },
  tabText: {
    fontSize: 11,
    fontFamily: 'PoppinsMedium',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFF',
    fontFamily: 'PoppinsBold',
  },

  // CHART
  chartArea: {
    alignItems: 'center',
    backgroundColor: 'rgba(248,250,252,0.6)',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 14,
    minHeight: 200,
    justifyContent: 'center',
  },
  chart: { marginVertical: 4, borderRadius: 12 },

  // EMPTY
  empty: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#94A3B8' },
  emptyHint: { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#CBD5E1' },

  // SUMMARY
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  chipValue: { fontSize: 14, fontFamily: 'PoppinsBold' },
  chipUnit:  { fontSize: 11, fontFamily: 'PoppinsRegular' },
  chipLabel: { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 2 },

  // FOOTER
  footerLabel: {
    fontSize: 11,
    fontFamily: 'PoppinsRegular',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default StockPurchaseChart;