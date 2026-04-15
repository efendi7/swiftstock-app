/**
 * NewProductChart.tsx — Recharts
 * Bar chart: jumlah jenis produk baru per periode
 */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sparkles } from 'lucide-react-native';

const COLOR = '#10B981';

interface DataPoint { label: string; value: number; }
interface Props {
  data?:           DataPoint[];
  isLoading?:      boolean;
  dateRangeLabel?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <View style={tt.box}>
      <Text style={tt.label}>{label}</Text>
      <View style={tt.row}>
        <View style={[tt.dot, { backgroundColor: COLOR }]} />
        <Text style={[tt.val, { color: COLOR }]}>{payload[0].value} produk baru</Text>
      </View>
    </View>
  );
};
const tt = StyleSheet.create({
  box:   { backgroundColor: '#fff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#E2E8F0', ...Platform.select({ web: { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' } as any }) },
  label: { fontSize: 11, fontFamily: 'PoppinsSemiBold', color: '#334155', marginBottom: 4 },
  row:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:   { width: 8, height: 8, borderRadius: 4 },
  val:   { fontSize: 11, fontFamily: 'PoppinsBold' },
});

const _NewProductChart: React.FC<any> = ({
  data = [], isLoading = false, dateRangeLabel,
}: any) => {
  const total   = data.reduce((s: number, d: any) => s + d.value, 0);
  const hasData = data.some((d: any) => d.value > 0);
  const maxVal  = Math.max(...data.map((d: any) => d.value), 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: COLOR + '18' }]}>
          <Sparkles size={15} color={COLOR} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Produk Baru</Text>
          <Text style={[styles.subtitle, { color: COLOR }]}>Total: {total} jenis produk baru</Text>
        </View>
      </View>

      <View style={styles.chartWrap}>
        {!hasData ? (
          <View style={styles.empty}>
            <Sparkles size={32} color="#E2E8F0" strokeWidth={1.5} />
            <Text style={styles.emptyText}>Belum ada produk baru</Text>
          </View>
        ) : (
          <ResponsiveContainer width="99%" height={200} maxHeight={200}>
            <BarChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }} barCategoryGap="60%" style={{ outline: "none" }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'PoppinsRegular', fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'PoppinsRegular', fill: '#94A3B8' }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar isAnimationActive={false} dataKey="value" name="Produk Baru" radius={[5, 5, 0, 0]} maxBarSize={32}>
                {data.map((entry: any, i: number) => (
                  <Cell
                    key={i}
                    fill={COLOR}
                    opacity={0.4 + (entry.value / maxVal) * 0.6}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </View>

      {dateRangeLabel && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>{dateRangeLabel}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
  iconBox:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title:      { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  subtitle:   { fontSize: 11, fontFamily: 'PoppinsRegular', marginTop: 2 },
  chartWrap:  { borderRadius: 10, overflow: 'hidden', backgroundColor: '#FAFCFF', paddingTop: 4 },
  empty:      { height: 200, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText:  { fontSize: 13, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
  footer:     { flexDirection: 'row', justifyContent: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 10 },
  footerText: { fontSize: 10, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
});

export const NewProductChart = React.memo(_NewProductChart);
export default NewProductChart;