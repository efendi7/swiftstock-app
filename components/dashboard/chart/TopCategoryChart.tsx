/**
 * TopCategoryChart.tsx
 * Kategori produk terlaris — horizontal bar chart
 * Data: dari items transaksi, group by product.category
 * Warna: palette konsisten, max 6 kategori + "Lainnya"
 */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Tag } from 'lucide-react-native';

const PALETTE = ['#00A79D','#3B82F6','#F59E0B','#8B5CF6','#EC4899','#10B981'];

const fmtRp = (n: number) => {
  if (n >= 1_000_000_000) return `${(n/1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000)     return `${(n/1_000_000).toFixed(1)}jt`;
  if (n >= 1_000)         return `${(n/1_000).toFixed(0)}rb`;
  return String(n);
};

export interface CategoryDataPoint {
  category: string;
  total:    number;  // Rp pendapatan
  qty:      number;  // total unit terjual
}

interface Props {
  data?:      CategoryDataPoint[];
  isLoading?: boolean;
  dateRangeLabel?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as CategoryDataPoint;
  return (
    <View style={tt.box}>
      <Text style={tt.label}>{d.category}</Text>
      <View style={tt.divider} />
      <View style={tt.row}>
        <Text style={tt.name}>Pendapatan</Text>
        <Text style={[tt.val, { color: '#00A79D' }]}>Rp {d.total.toLocaleString('id-ID')}</Text>
      </View>
      <View style={tt.row}>
        <Text style={tt.name}>Unit terjual</Text>
        <Text style={[tt.val, { color: '#3B82F6' }]}>{d.qty.toLocaleString('id-ID')} unit</Text>
      </View>
    </View>
  );
};

const tt = StyleSheet.create({
  box:     { backgroundColor: '#fff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#E2E8F0', minWidth: 160, ...Platform.select({ web: { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' } as any }) },
  label:   { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#1E293B', marginBottom: 6 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 6 },
  row:     { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 2 },
  name:    { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#64748B' },
  val:     { fontSize: 11, fontFamily: 'PoppinsSemiBold' },
});

const _TopCategoryChart: React.FC<any> = ({
  data = [], isLoading = false, dateRangeLabel,
}: any) => {
  const hasData = data.length > 0 && data.some((d: any) => d.total > 0);

  // Sort desc, max 6
  const chartData = [...data]
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: '#00A79D18' }]}>
          <Tag size={15} color="#00A79D" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Kategori Terlaris</Text>
          <Text style={styles.subtitle}>Pendapatan per kategori produk</Text>
        </View>
      </View>

      <View style={styles.chartWrap}>
        {!hasData ? (
          <View style={styles.empty}>
            <Tag size={28} color="#E2E8F0" strokeWidth={1.5} />
            <Text style={styles.emptyText}>Belum ada data kategori</Text>
          </View>
        ) : (
          <ResponsiveContainer width="99%" height={200} minHeight={200}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
              style={{ outline: 'none' }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 9, fontFamily: 'PoppinsRegular', fill: '#94A3B8' }}
                axisLine={false} tickLine={false}
                tickFormatter={fmtRp}
              />
              <YAxis
                type="category" dataKey="category"
                tick={{ fontSize: 10, fontFamily: 'PoppinsMedium', fill: '#475569' }}
                axisLine={false} tickLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
              <Bar dataKey="total" name="Pendapatan" radius={[0, 6, 6, 0]} maxBarSize={20} isAnimationActive={false}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
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
  header:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10, minHeight: 50 },
  iconBox:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  subtitle:   { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 2 },
  chartWrap:  { flex: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: '#FAFCFF', paddingTop: 4 },
  empty:      { height: 200, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText:  { fontSize: 13, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
  footer:     { flexDirection: 'row', justifyContent: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 10 },
  footerText: { fontSize: 10, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
});

export const TopCategoryChart = React.memo(_TopCategoryChart);
export default TopCategoryChart;