/**
 * StockUnitChart.tsx
 * Chart stok masuk — satuan unit barang (qty yang ditambah ke produk existing)
 */
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { PackagePlus, Calendar } from 'lucide-react-native';
import { ChartDataPoint } from '@/types/dashboard.types';

const COLOR = '#3B82F6';

const fmtNum = (n: number) => n.toLocaleString('id-ID');

interface Props {
  data?:           ChartDataPoint[];
  isLoading?:      boolean;
  selectedPreset:  'today' | 'week' | 'month' | 'year';
  dateRangeLabel?: string;
  chartWidth?:     number;
}

export const StockUnitChart: React.FC<Props> = ({
  data = [], isLoading = false, selectedPreset, dateRangeLabel, chartWidth = 360,
}) => {
  const total   = data.reduce((s, d) => s + d.value, 0);
  const hasData = data.some(d => d.value > 0);

  const maxRaw   = Math.max(...data.map(d => d.value), 1);
  const maxValue = Math.ceil(maxRaw * 1.25);

  const chartData = data.map(d => ({
    value: d.value,
    label: d.label ?? '',
    labelTextStyle: { color: '#94A3B8', fontSize: 9, fontFamily: 'PoppinsRegular' },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: COLOR + '18' }]}>
          <PackagePlus size={15} color={COLOR} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Stok Masuk</Text>
          <Text style={[styles.subtitle, { color: COLOR }]}>
            Total: {fmtNum(total)} unit
          </Text>
        </View>
      </View>

      <View style={styles.chartArea}>
        {isLoading ? (
          <ActivityIndicator size="large" color={COLOR} />
        ) : !hasData ? (
          <View style={styles.empty}>
            <PackagePlus size={32} color="#E2E8F0" strokeWidth={1.5} />
            <Text style={styles.emptyText}>Belum ada stok masuk</Text>
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
            color={COLOR}
            thickness={2.5}
            curved
            areaChart
            startFillColor={COLOR}
            endFillColor="#fff"
            startOpacity={0.18}
            endOpacity={0.01}
            hideDataPoints={false}
            dataPointsColor={COLOR}
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
              if (n >= 1_000) return `${(n/1_000).toFixed(0)}rb`;
              return String(n);
            }}
            pointerConfig={{
              pointerStripHeight: 170,
              pointerStripColor: '#CBD5E1',
              pointerStripWidth: 1,
              pointerColor: COLOR,
              radius: 6,
              pointerLabelWidth: 100,
              pointerLabelHeight: 36,
              activatePointersOnLongPress: false,
              autoAdjustPointerLabelPosition: false,
              shiftPointerLabelX: -50,
              shiftPointerLabelY: -80,
              pointerLabelComponent: (items: any[]) => (
                <View style={[styles.tooltip, { borderColor: COLOR + '40' }]}>
                  <Text style={[styles.tooltipVal, { color: COLOR }]}>
                    {fmtNum(items[0]?.value ?? 0)} unit
                  </Text>
                </View>
              ),
            }}
          />
        )}
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
  container:  { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 10 },
  iconBox:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title:      { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  subtitle:   { fontSize: 11, fontFamily: 'PoppinsRegular', marginTop: 2 },
  chartArea:  { borderRadius: 10, overflow: 'hidden', marginBottom: 10, backgroundColor: '#FAFCFF', paddingTop: 8, minHeight: 210, justifyContent: 'center', alignItems: 'flex-start' },
  empty:      { alignItems: 'center', gap: 8, paddingVertical: 40, width: '100%' },
  emptyText:  { fontSize: 13, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
  tooltip:    { backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  tooltipVal: { fontSize: 12, fontFamily: 'PoppinsBold' },
  footer:     { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  footerText: { fontSize: 10, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
});