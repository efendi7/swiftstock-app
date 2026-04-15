import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { PackagePlus, DollarSign, Sparkles, Calendar } from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import { ChartDataPoint } from '@/types/dashboard.types';

interface Props {
  unitData?:       ChartDataPoint[];
  valueData?:      ChartDataPoint[];
  newData?:        ChartDataPoint[];
  isLoading?:      boolean;
  selectedPreset:  'today' | 'week' | 'month' | 'year';
  dateRangeLabel?: string;
  chartWidth?:     number;
}

const fmtRp  = (n: number) => {
  if (n >= 1_000_000_000) return `Rp ${(n/1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000)     return `Rp ${(n/1_000_000).toFixed(1)}jt`;
  if (n >= 1_000)         return `Rp ${(n/1_000).toFixed(0)}rb`;
  return `Rp ${n.toLocaleString('id-ID')}`;
};
const fmtNum = (n: number) => n.toLocaleString('id-ID');

const LINE_UNIT = '#3B82F6';
const LINE_NEW  = '#10B981';

export const StockPurchaseChart: React.FC<Props> = ({
  unitData = [], valueData = [], newData = [],
  isLoading = false, selectedPreset, dateRangeLabel, chartWidth = 360,
}) => {
  const totalUnit  = unitData.reduce((s, d) => s + d.value, 0);
  const totalNew   = newData.reduce((s, d) => s + d.value, 0);
  const totalValue = valueData.reduce((s, d) => s + d.value, 0);
  const hasData    = totalUnit > 0 || totalNew > 0;
  const maxLen     = Math.max(unitData.length, newData.length, 2);

  const unitChartData = Array.from({ length: maxLen }, (_, i) => ({
    value: unitData[i]?.value ?? 0,
    label: unitData[i]?.label ?? '',
    labelTextStyle: { color: '#94A3B8', fontSize: 9, fontFamily: 'PoppinsRegular' },
  }));
  const newChartData = Array.from({ length: maxLen }, (_, i) => ({
    value: newData[i]?.value ?? 0,
  }));

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: LINE_UNIT + '18' }]}>
          <PackagePlus size={15} color={LINE_UNIT} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Analitik Stok Masuk</Text>
          <Text style={styles.subtitle}>
            {fmtNum(totalUnit)} unit masuk • {fmtNum(totalNew)} produk baru
          </Text>
        </View>
      </View>

      {/* LEGENDA */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: LINE_UNIT }]} />
          <Text style={styles.legendText}>Stok Masuk (qty existing)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: LINE_NEW }]} />
          <Text style={styles.legendText}>Produk Baru ditambahkan</Text>
        </View>
      </View>

      {/* CHART */}
      <View style={styles.chartArea}>
        {isLoading ? (
          <ActivityIndicator size="large" color={LINE_UNIT} />
        ) : !hasData ? (
          <View style={styles.empty}>
            <PackagePlus size={32} color="#E2E8F0" strokeWidth={1.5} />
            <Text style={styles.emptyText}>Belum ada data stok masuk</Text>
            <Text style={styles.emptyHint}>Tambah stok produk untuk melihat grafik</Text>
          </View>
        ) : (
          <LineChart
            data={unitChartData}
            data2={newChartData}
            width={chartWidth}
            height={190}
            // Line 1
            color={LINE_UNIT}
            thickness={2.5}
            curved
            areaChart
            startFillColor={LINE_UNIT}
            endFillColor="#fff"
            startOpacity={0.15}
            endOpacity={0.01}
            // Line 2
            color2={LINE_NEW}
            thickness2={2}
            areaChart2
            startFillColor2={LINE_NEW}
            endFillColor2="#fff"
            startOpacity2={0.10}
            endOpacity2={0.01}
            // Axis
            yAxisTextStyle={{ color: '#94A3B8', fontSize: 10, fontFamily: 'PoppinsRegular' }}
            xAxisLabelTextStyle={{ color: '#94A3B8', fontSize: 9, fontFamily: 'PoppinsRegular' }}
            yAxisColor="transparent"
            xAxisColor="#F1F5F9"
            rulesColor="#F1F5F9"
            rulesType="solid"
            noOfSections={4}
            yAxisTextNumberOfLines={1}
            hideDataPoints={false}
            dataPointsColor={LINE_UNIT}
            dataPointsColor2={LINE_NEW}
            dataPointsRadius={3}
            dataPointsRadius2={2.5}
            formatYLabel={(v) => {
              const n = Number(v);
              if (n >= 1_000) return `${(n/1_000).toFixed(0)}rb`;
              return String(n);
            }}
            // Tooltip
            pointerConfig={{
              pointerStripHeight: 170,
              pointerStripColor: '#CBD5E1',
              pointerStripWidth: 1,
              pointerColor: LINE_UNIT,
              radius: 5,
              pointerLabelWidth: 130,
              pointerLabelHeight: 56,
              activatePointersOnLongPress: false,
              autoAdjustPointerLabelPosition: true,
              pointerLabelComponent: (items: any[]) => (
                <View style={styles.tooltip}>
                  <View style={styles.tooltipRow}>
                    <View style={[styles.tooltipDot, { backgroundColor: LINE_UNIT }]} />
                    <Text style={[styles.tooltipVal, { color: LINE_UNIT }]}>
                      {fmtNum(items[0]?.value ?? 0)} unit
                    </Text>
                  </View>
                  <View style={styles.tooltipRow}>
                    <View style={[styles.tooltipDot, { backgroundColor: LINE_NEW }]} />
                    <Text style={[styles.tooltipVal, { color: LINE_NEW }]}>
                      {fmtNum(items[1]?.value ?? 0)} baru
                    </Text>
                  </View>
                </View>
              ),
            }}
          />
        )}
      </View>

      {/* SUMMARY CHIPS — 2 chip: Stok gabung + Pengeluaran */}
      <View style={styles.summaryRow}>

        {/* CHIP 1: Stok Masuk gabung Produk Baru — icon kiri, teks kanan */}
        <View style={[styles.chip, { borderColor: LINE_UNIT + '30', backgroundColor: LINE_UNIT + '0D' }]}>
          <View style={[styles.chipIcon, { backgroundColor: LINE_UNIT + '18' }]}>
            <PackagePlus size={16} color={LINE_UNIT} />
          </View>
          <View style={styles.chipText}>
            <View style={styles.chipValueRow}>
              <Text style={[styles.chipValue, { color: LINE_UNIT }]}>{fmtNum(totalUnit)}</Text>
              <Text style={[styles.chipValueSub, { color: LINE_UNIT }]}> unit</Text>
            </View>
            <Text style={styles.chipLabel}>Stok Masuk</Text>
            <View style={styles.chipBadgeRow}>
              <View style={[styles.chipBadge, { backgroundColor: LINE_NEW + '18' }]}>
                <Sparkles size={9} color={LINE_NEW} />
                <Text style={[styles.chipBadgeText, { color: LINE_NEW }]}>
                  {fmtNum(totalNew)} produk baru
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* CHIP 2: Pengeluaran — icon kiri, teks kanan */}
        <View style={[styles.chip, { borderColor: '#8B5CF630', backgroundColor: '#8B5CF60D' }]}>
          <View style={[styles.chipIcon, { backgroundColor: '#8B5CF618' }]}>
            <DollarSign size={16} color="#8B5CF6" />
          </View>
          <View style={styles.chipText}>
            <View style={styles.chipValueRow}>
              <Text style={[styles.chipValue, { color: '#8B5CF6' }]}>{fmtRp(totalValue)}</Text>
            </View>
            <Text style={styles.chipLabel}>Pengeluaran Stok</Text>
            <Text style={styles.chipSub}>modal pembelian stok</Text>
          </View>
        </View>

      </View>

      {dateRangeLabel && (
        <View style={styles.footer}>
          <Calendar size={11} color="#94A3B8" />
          <Text style={styles.footerText}>{dateRangeLabel}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  iconBox:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title:      { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  subtitle:   { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 2 },

  legend:     { flexDirection: 'row', gap: 14, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendLine: { width: 16, height: 3, borderRadius: 2 },
  legendText: { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#64748B' },

  chartArea: {
    borderRadius: 10, overflow: 'hidden',
    marginBottom: 14, justifyContent: 'center', alignItems: 'flex-start',
    backgroundColor: '#FAFCFF', paddingTop: 8,
    minHeight: 210,
  },

  empty:     { alignItems: 'center', gap: 6, paddingVertical: 40, width: '100%' },
  emptyText: { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#94A3B8' },
  emptyHint: { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#CBD5E1' },

  tooltip: {
    backgroundColor: '#FFF', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: '#E2E8F0',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, gap: 4,
  },
  tooltipRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tooltipDot: { width: 8, height: 8, borderRadius: 4 },
  tooltipVal: { fontSize: 12, fontFamily: 'PoppinsBold' },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  chip: {
    flex: 1, borderRadius: 14, borderWidth: 1,
    paddingVertical: 12, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  chipIcon: {
    width: 40, height: 40, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  chipText:     { flex: 1 },
  chipValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 1 },
  chipValue:    { fontSize: 18, fontFamily: 'PoppinsBold', lineHeight: 22 },
  chipValueSub: { fontSize: 11, fontFamily: 'PoppinsMedium' },
  chipLabel:    { fontSize: 11, fontFamily: 'PoppinsSemiBold', color: '#475569', marginTop: 2 },
  chipSub:      { fontSize: 9, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 1 },
  chipBadgeRow: { flexDirection: 'row', marginTop: 5 },
  chipBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  chipBadgeText:{ fontSize: 10, fontFamily: 'PoppinsMedium' },

  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    justifyContent: 'center', paddingTop: 8,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  footerText: { fontSize: 10, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
});

export default StockPurchaseChart;