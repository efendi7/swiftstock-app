/**
 * MoneyFlowChart.tsx — Recharts
 * Parameter Uang: Pendapatan vs Modal Stok
 * Tooltip: tampilkan keuntungan + margin langsung
 * Warna sesuai KPI card: Pendapatan=teal, Modal=merah, Keuntungan=biru
 */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
  ComposedChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react-native';

const C_REVENUE = '#00A79D'; // teal  — sama dengan KPI Pendapatan
const C_MODAL   = '#F43F5E'; // merah — sama dengan KPI Modal Stok
const C_PROFIT  = '#3B82F6'; // biru  — sama dengan KPI Keuntungan

const fmtRp = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `Rp ${(abs/1_000_000_000).toFixed(1)}M`;
  if (abs >= 1_000_000)     return `Rp ${(abs/1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000)         return `Rp ${(abs/1_000).toFixed(0)}rb`;
  return `Rp ${abs.toLocaleString('id-ID')}`;
};

export interface MoneyDataPoint {
  label:    string;
  revenue?: number;
  modal?:   number;
}

interface Props {
  data?:           MoneyDataPoint[];
  isLoading?:      boolean;
  dateRangeLabel?: string;
  totalRevenue?:   number;
  totalExpense?:   number;
  totalProfit?:    number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const revenue = payload.find((p: any) => p.dataKey === 'revenue')?.value ?? 0;
  const modal   = payload.find((p: any) => p.dataKey === 'modal')?.value   ?? 0;
  const profit  = revenue - modal;
  const margin  = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
  const isProfit = profit >= 0;

  return (
    <View style={tt.box}>
      <Text style={tt.label}>{label}</Text>
      <View style={tt.divider} />
      <View style={tt.row}>
        <View style={[tt.dot, { backgroundColor: C_REVENUE }]} />
        <Text style={tt.name}>Pendapatan</Text>
        <Text style={[tt.val, { color: C_REVENUE }]}>{fmtRp(revenue)}</Text>
      </View>
      <View style={tt.row}>
        <View style={[tt.dot, { backgroundColor: C_MODAL }]} />
        <Text style={tt.name}>Modal Stok</Text>
        <Text style={[tt.val, { color: C_MODAL }]}>{fmtRp(modal)}</Text>
      </View>
      <View style={tt.separator} />
      <View style={tt.row}>
        <View style={[tt.dot, { backgroundColor: isProfit ? C_PROFIT : C_MODAL }]} />
        <Text style={tt.name}>{isProfit ? 'Keuntungan' : 'Kerugian'}</Text>
        <Text style={[tt.val, { color: isProfit ? C_PROFIT : C_MODAL, fontFamily: 'PoppinsBold' }]}>
          {isProfit ? '+' : '-'}{fmtRp(Math.abs(profit))}
        </Text>
      </View>
      <View style={[tt.marginBadge, { backgroundColor: (isProfit ? C_PROFIT : C_MODAL) + '15' }]}>
        <Text style={[tt.marginText, { color: isProfit ? C_PROFIT : C_MODAL }]}>
          Margin {isProfit ? '+' : ''}{margin}%
        </Text>
      </View>
    </View>
  );
};

const tt = StyleSheet.create({
  box:         { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', minWidth: 180, ...Platform.select({ web: { boxShadow: '0 6px 20px rgba(0,0,0,0.10)' } as any }) },
  label:       { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#1E293B', marginBottom: 8 },
  divider:     { height: 1, backgroundColor: '#F1F5F9', marginBottom: 8 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dot:         { width: 8, height: 8, borderRadius: 4 },
  name:        { flex: 1, fontSize: 10, fontFamily: 'PoppinsRegular', color: '#64748B' },
  val:         { fontSize: 11, fontFamily: 'PoppinsSemiBold' },
  separator:   { height: 1, backgroundColor: '#F1F5F9', marginVertical: 6 },
  marginBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 4 },
  marginText:  { fontSize: 11, fontFamily: 'PoppinsBold' },
});

const _MoneyFlowChart: React.FC<any> = ({
  data = [], isLoading = false, dateRangeLabel,
  totalRevenue = 0, totalExpense = 0, totalProfit = 0,
}) => {
  const hasData   = data.some((d: any) => (d.revenue ?? 0) > 0 || (d.modal ?? 0) > 0);
  const isProfit  = totalProfit >= 0;
  const margin    = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
  const badgeColor = totalProfit > 0 ? C_PROFIT : totalProfit < 0 ? C_MODAL : '#94A3B8';
  const badgeLabel = totalProfit > 0 ? 'Untung' : totalProfit < 0 ? 'Rugi' : 'Impas';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: C_REVENUE + '18' }]}>
          <TrendingUp size={15} color={C_REVENUE} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Pendapatan & Modal</Text>
          <Text style={styles.subtitle}>{fmtRp(totalRevenue)} pendapatan periode ini</Text>
        </View>
        {/* Badge Untung/Rugi permanen */}
        {(totalRevenue > 0 || totalExpense > 0) && (
          <View style={[styles.badge, { backgroundColor: badgeColor + '18', borderColor: badgeColor + '40' }]}>
            <Text style={[styles.badgeLabel, { color: badgeColor }]}>{badgeLabel}</Text>
            <Text style={[styles.badgeVal, { color: badgeColor }]}>
              {totalProfit !== 0 ? fmtRp(Math.abs(totalProfit)) : '–'}
            </Text>
            {margin !== 0 && (
              <Text style={[styles.badgeMar, { color: badgeColor }]}>{margin > 0 ? '+' : ''}{margin}%</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.chartWrap}>
        {!hasData ? (
          <View style={styles.empty}>
            <TrendingUp size={32} color="#E2E8F0" strokeWidth={1.5} />
            <Text style={styles.emptyText}>Belum ada data keuangan</Text>
          </View>
        ) : (
          <ResponsiveContainer width="99%" height={220} minHeight={220}>
            <ComposedChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }} style={{ outline: "none" }}>
              <defs>
                <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C_REVENUE} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={C_REVENUE} stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gModal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C_MODAL} stopOpacity={0.14} />
                  <stop offset="95%" stopColor={C_MODAL} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: 'PoppinsRegular', fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: 'PoppinsRegular', fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => fmtRp(v).replace('Rp ','')} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, fontFamily: 'PoppinsRegular', paddingTop: 6 }} />
              <Area isAnimationActive={false} connectNulls yAxisId={undefined} type="monotone" dataKey="revenue" name="Pendapatan"
                stroke={C_REVENUE} strokeWidth={2.5} fill="url(#gRevenue)"
                dot={{ r: 3, fill: C_REVENUE }} activeDot={{ r: 5 }} />
              <Area isAnimationActive={false} connectNulls type="monotone" dataKey="modal" name="Modal Stok"
                stroke={C_MODAL} strokeWidth={2} fill="url(#gModal)"
                dot={{ r: 3, fill: C_MODAL }} activeDot={{ r: 5 }}
                strokeDasharray="5 3" />
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
  badge:      { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'flex-end', gap: 1 },
  badgeLabel: { fontSize: 9, fontFamily: 'PoppinsSemiBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeVal:   { fontSize: 12, fontFamily: 'PoppinsBold', lineHeight: 16 },
  badgeMar:   { fontSize: 9, fontFamily: 'PoppinsMedium' },
  chartWrap:  { flex: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: '#FAFCFF', paddingTop: 4 },
  empty:      { height: 220, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText:  { fontSize: 13, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
  footer:     { flexDirection: 'row', justifyContent: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 10 },
  footerText: { fontSize: 10, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
});

export const MoneyFlowChart = React.memo(_MoneyFlowChart);
export default MoneyFlowChart;