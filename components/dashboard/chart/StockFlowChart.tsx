/**
 * StockFlowChart.tsx — Stok Masuk & Keluar + sub-indikator Produk Baru
 * Produk baru ditampilkan sebagai line tipis di atas area stok masuk.
 */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
  ComposedChart, Area, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { ArrowDownUp } from 'lucide-react-native';

const C_IN      = '#3B82F6'; // biru  — Stok Masuk
const C_OUT     = '#F59E0B'; // amber — Stok Keluar
const C_NEW     = '#8B5CF6'; // ungu  — Produk Baru (sub-indikator)

const fmtUnit = (n: number) => {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}rb`;
  return String(n);
};

export interface UnitDataPoint {
  label:       string;
  unitIn?:     number;
  unitOut?:    number;
  newProducts?: number; // produk baru per bucket (sub-indikator)
}

interface Props {
  data?:           UnitDataPoint[];
  isLoading?:      boolean;
  dateRangeLabel?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const unitIn      = payload.find((p: any) => p.dataKey === 'unitIn')?.value      ?? 0;
  const unitOut     = payload.find((p: any) => p.dataKey === 'unitOut')?.value     ?? 0;
  const newProducts = payload.find((p: any) => p.dataKey === 'newProducts')?.value ?? 0;
  const selisih     = unitIn - unitOut;
  return (
    <View style={tt.box}>
      <Text style={tt.label}>{label}</Text>
      <View style={tt.divider} />
      <View style={tt.row}>
        <View style={[tt.dot, { backgroundColor: C_IN }]} />
        <Text style={tt.name}>Stok Masuk</Text>
        <Text style={[tt.val, { color: C_IN }]}>{unitIn.toLocaleString('id-ID')} unit</Text>
      </View>
      <View style={tt.row}>
        <View style={[tt.dot, { backgroundColor: C_OUT }]} />
        <Text style={tt.name}>Stok Keluar</Text>
        <Text style={[tt.val, { color: C_OUT }]}>{unitOut.toLocaleString('id-ID')} unit</Text>
      </View>
      {newProducts > 0 && (
        <View style={tt.row}>
          <View style={[tt.dot, { backgroundColor: C_NEW }]} />
          <Text style={tt.name}>Produk Baru</Text>
          <Text style={[tt.val, { color: C_NEW }]}>{newProducts} produk</Text>
        </View>
      )}
      <View style={tt.separator} />
      <View style={tt.row}>
        <View style={[tt.dot, { backgroundColor: selisih >= 0 ? C_IN : C_OUT }]} />
        <Text style={tt.name}>Selisih stok</Text>
        <Text style={[tt.val, { color: selisih >= 0 ? C_IN : C_OUT }]}>
          {selisih >= 0 ? '+' : ''}{selisih.toLocaleString('id-ID')} unit
        </Text>
      </View>
    </View>
  );
};
const tt = StyleSheet.create({
  box:       { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', minWidth: 175, ...Platform.select({ web: { boxShadow: '0 6px 20px rgba(0,0,0,0.10)' } as any }) },
  label:     { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#1E293B', marginBottom: 8 },
  divider:   { height: 1, backgroundColor: '#F1F5F9', marginBottom: 8 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dot:       { width: 8, height: 8, borderRadius: 4 },
  name:      { flex: 1, fontSize: 10, fontFamily: 'PoppinsRegular', color: '#64748B' },
  val:       { fontSize: 11, fontFamily: 'PoppinsSemiBold' },
  separator: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 6 },
});

const _StockFlowChart: React.FC<Props> = ({
  data = [], isLoading = false, dateRangeLabel,
}) => {
  const hasData    = data.some((d: any) => (d.unitIn ?? 0) > 0 || (d.unitOut ?? 0) > 0);
  const hasNewProd = data.some((d: any) => (d.newProducts ?? 0) > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: C_IN + '18' }]}>
          <ArrowDownUp size={15} color={C_IN} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Stok Masuk & Keluar</Text>
          <Text style={styles.subtitle}>
            Pergerakan unit{hasNewProd ? ' + produk baru' : ''}
          </Text>
        </View>
      </View>

      <View style={styles.chartWrap}>
        {!hasData ? (
          <View style={styles.empty}>
            <ArrowDownUp size={32} color="#E2E8F0" strokeWidth={1.5} />
            <Text style={styles.emptyText}>Belum ada data stok</Text>
          </View>
        ) : (
          <ResponsiveContainer width="99%" height={220} minHeight={220}>
            <ComposedChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gUnitIn2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C_IN}  stopOpacity={0.22} />
                  <stop offset="95%" stopColor={C_IN}  stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gUnitOut2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C_OUT} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={C_OUT} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fontFamily: 'PoppinsRegular', fill: '#94A3B8' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fontFamily: 'PoppinsRegular', fill: '#94A3B8' }}
                axisLine={false} tickLine={false}
                tickFormatter={fmtUnit} width={36}
                yAxisId="unit"
              />
              {/* Sumbu Y kanan untuk produk baru (skala kecil) */}
              {hasNewProd && (
                <YAxis
                  yAxisId="new"
                  orientation="right"
                  tick={{ fontSize: 9, fontFamily: 'PoppinsRegular', fill: C_NEW + 'AA' }}
                  axisLine={false} tickLine={false}
                  allowDecimals={false}
                  width={22}
                  tickFormatter={v => `${v}p`}
                />
              )}
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle" iconSize={8}
                wrapperStyle={{ fontSize: 10, fontFamily: 'PoppinsRegular', paddingTop: 6 }}
              />
              <Area
                yAxisId="unit"
                isAnimationActive={false} connectNulls type="monotone"
                dataKey="unitIn" name="Stok Masuk"
                stroke={C_IN} strokeWidth={2.5} fill="url(#gUnitIn2)"
                dot={{ r: 3, fill: C_IN }} activeDot={{ r: 5 }}
              />
              <Area
                yAxisId="unit"
                isAnimationActive={false} connectNulls type="monotone"
                dataKey="unitOut" name="Stok Keluar"
                stroke={C_OUT} strokeWidth={2.5} strokeDasharray="5 3"
                fill="url(#gUnitOut2)"
                dot={{ r: 4, fill: C_OUT, strokeWidth: 0 }} activeDot={{ r: 6 }}
              />
              {/* Sub-indikator produk baru: line tipis + dot kecil */}
              {hasNewProd && (
                <Line
                  yAxisId="new"
                  isAnimationActive={false} connectNulls type="monotone"
                  dataKey="newProducts" name="Produk Baru"
                  stroke={C_NEW} strokeWidth={1.5} strokeDasharray="2 3"
                  dot={{ r: 4, fill: C_NEW, strokeWidth: 1.5, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: C_NEW }}
                />
              )}
            </ComposedChart>
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
  empty:      { height: 220, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText:  { fontSize: 13, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
  footer:     { flexDirection: 'row', justifyContent: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 10 },
  footerText: { fontSize: 10, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
});

export const StockFlowChart = React.memo(_StockFlowChart);
export default StockFlowChart;