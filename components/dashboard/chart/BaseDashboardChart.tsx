import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { TrendingUp, Calendar } from 'lucide-react-native';
import { COLORS } from '@constants/colors';

export interface BaseChartProps {
  data?:           { value: number; label?: string }[];
  isLoading?:      boolean;
  selectedPreset:  'today' | 'week' | 'month' | 'year';
  title?:          string;
  accentColor?:    string;
  dateRangeLabel?: string;
  chartWidth?:     number; // dari onLayout parent
}

const fmtRp = (n: number) => {
  if (n >= 1_000_000_000) return `Rp ${(n/1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000)     return `Rp ${(n/1_000_000).toFixed(1)}jt`;
  if (n >= 1_000)         return `Rp ${(n/1_000).toFixed(0)}rb`;
  return `Rp ${n.toLocaleString('id-ID')}`;
};

export const BaseDashboardChart: React.FC<BaseChartProps> = ({
  data, isLoading = false, selectedPreset,
  title = 'Analitik Penjualan Toko',
  accentColor = COLORS.secondary,
  dateRangeLabel, chartWidth = 360,
}) => {
  const rawData = data && data.length > 0 ? data : [];
  const hasData = rawData.some(d => d.value > 0);
  const total   = rawData.reduce((s, d) => s + d.value, 0);

  // Padding atas: maxValue 20% di atas titik tertinggi agar tidak terpotong
  const maxRaw    = Math.max(...rawData.map(d => d.value), 1);
  const maxValue  = Math.ceil(maxRaw * 1.25);

  const chartData = rawData.map(d => ({
    value: d.value,
    label: d.label ?? '',
    labelTextStyle: { color: '#94A3B8', fontSize: 9, fontFamily: 'PoppinsRegular' },
  }));

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: accentColor + '18' }]}>
          <TrendingUp size={15} color={accentColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.subtitle, { color: accentColor }]}>
            Total: {fmtRp(total)}
          </Text>
        </View>
      </View>

      {/* CHART */}
      <View style={styles.chartArea}>
        {isLoading ? (
          <ActivityIndicator size="large" color={accentColor} />
        ) : !hasData ? (
          <View style={styles.empty}>
            <TrendingUp size={32} color="#E2E8F0" strokeWidth={1.5} />
            <Text style={styles.emptyText}>Belum ada data transaksi</Text>
          </View>
        ) : (
          <LineChart
            data={chartData}
            width={chartWidth - 40}
            height={190}
            maxValue={maxValue}
            initialSpacing={12}
            endSpacing={12}
            yAxisLabelWidth={38}
            color={accentColor}
            thickness={2.5}
            curved
            areaChart
            startFillColor={accentColor}
            endFillColor="#fff"
            startOpacity={0.18}
            endOpacity={0.01}
            hideDataPoints={false}
            dataPointsColor={accentColor}
            dataPointsRadius={4}
            yAxisTextStyle={{ color: '#94A3B8', fontSize: 10, fontFamily: 'PoppinsRegular' }}
            xAxisLabelTextStyle={{ color: '#94A3B8', fontSize: 9, fontFamily: 'PoppinsRegular' }}
            yAxisColor="transparent"
            xAxisColor="#F1F5F9"
            rulesColor="#F1F5F9"
            rulesType="solid"
            noOfSections={4}
            yAxisTextNumberOfLines={1}
            formatYLabel={(v) => {
              const n = Number(v);
              if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}jt`;
              if (n >= 1_000)     return `${(n/1_000).toFixed(0)}rb`;
              return String(n);
            }}
            pointerConfig={{
              pointerStripHeight: 170,
              pointerStripColor: '#CBD5E1',
              pointerStripWidth: 1,
              pointerColor: accentColor,
              radius: 6,
              pointerLabelWidth: 100,
              pointerLabelHeight: 36,
              activatePointersOnLongPress: false,
              autoAdjustPointerLabelPosition: false,
              shiftPointerLabelX: -50,
              shiftPointerLabelY: -80,
              pointerLabelComponent: (items: any[]) => (
                <View style={[styles.tooltip, { borderColor: accentColor + '40' }]}>
                  <Text style={[styles.tooltipVal, { color: accentColor }]}>
                    {fmtRp(items[0]?.value ?? 0)}
                  </Text>
                </View>
              ),
            }}
          />
        )}
      </View>

      {/* FOOTER */}
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

  header:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 10 },
  iconBox:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title:      { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  subtitle:   { fontSize: 11, fontFamily: 'PoppinsRegular', marginTop: 2 },

  chartArea: {
    borderRadius: 10, overflow: 'hidden',
    marginBottom: 10, justifyContent: 'center', alignItems: 'flex-start',
    backgroundColor: '#FAFCFF', paddingTop: 8,
  },

  empty:     { alignItems: 'center', gap: 8, paddingVertical: 40, width: '100%' },
  emptyText: { fontSize: 13, fontFamily: 'PoppinsMedium', color: '#94A3B8' },

  tooltip: {
    backgroundColor: '#FFF', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  tooltipVal: { fontSize: 12, fontFamily: 'PoppinsBold' },

  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    justifyContent: 'center', paddingTop: 10,
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  footerText: { fontSize: 10, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
});