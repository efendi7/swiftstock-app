/**
 * PeriodCompareCard.tsx
 * Perbandingan periode ini vs periode sebelumnya
 * Tampil: Revenue, Transaksi, Profit — dengan arrow & %
 */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, GitCompare } from 'lucide-react-native';

const fmtRp = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `Rp ${(abs/1_000_000_000).toFixed(1)}M`;
  if (abs >= 1_000_000)     return `Rp ${(abs/1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000)         return `Rp ${(abs/1_000).toFixed(0)}rb`;
  return `Rp ${abs.toLocaleString('id-ID')}`;
};

const pct = (curr: number, prev: number): number => {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
};

export interface PeriodCompareData {
  current:  { revenue: number; transactions: number; profit: number };
  previous: { revenue: number; transactions: number; profit: number };
  periodLabel: string; // "vs minggu lalu", "vs bulan lalu"
}

interface Props {
  data?:      PeriodCompareData;
  isLoading?: boolean;
}

const MetricRow = ({
  label, curr, prev, format,
}: { label: string; curr: number; prev: number; format: (n: number) => string }) => {
  const diff    = pct(curr, prev);
  const isUp    = diff > 0;
  const isFlat  = diff === 0;
  const color   = isFlat ? '#94A3B8' : isUp ? '#10B981' : '#EF4444';

  return (
    <View style={mr.row}>
      <Text style={mr.label}>{label}</Text>
      <View style={mr.right}>
        <Text style={mr.curr}>{format(curr)}</Text>
        <View style={[mr.badge, { backgroundColor: color + '15' }]}>
          {isFlat
            ? <Minus size={10} color={color} />
            : isUp
              ? <ArrowUpRight size={10} color={color} />
              : <ArrowDownRight size={10} color={color} />
          }
          <Text style={[mr.pct, { color }]}>
            {isFlat ? '0%' : `${isUp ? '+' : ''}${diff}%`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const mr = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  label: { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#475569', flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  curr:  { fontSize: 13, fontFamily: 'PoppinsBold', color: '#1E293B' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  pct:   { fontSize: 10, fontFamily: 'PoppinsBold' },
});

export const PeriodCompareCard: React.FC<Props> = ({ data, isLoading = false }) => {
  if (!data) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: '#8B5CF618' }]}>
            <GitCompare size={15} color="#8B5CF6" />
          </View>
          <View>
            <Text style={styles.title}>Perbandingan Periode</Text>
            <Text style={styles.subtitle}>Tidak tersedia untuk rentang ini</Text>
          </View>
        </View>
        <View style={styles.empty}>
          <GitCompare size={28} color="#E2E8F0" strokeWidth={1.5} />
          <Text style={styles.emptyText}>Pilih preset Minggu/Bulan/Tahun</Text>
        </View>
      </View>
    );
  }

  const revDiff = pct(data.current.revenue, data.previous.revenue);
  const overallUp = revDiff >= 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: '#8B5CF618' }]}>
          <GitCompare size={15} color="#8B5CF6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Perbandingan Periode</Text>
          <Text style={styles.subtitle}>{data.periodLabel}</Text>
        </View>
        <View style={[styles.overallBadge, { backgroundColor: (overallUp ? '#10B981' : '#EF4444') + '15', borderColor: (overallUp ? '#10B981' : '#EF4444') + '40' }]}>
          {overallUp
            ? <TrendingUp size={14} color="#10B981" />
            : <TrendingDown size={14} color="#EF4444" />
          }
          <Text style={[styles.overallText, { color: overallUp ? '#10B981' : '#EF4444' }]}>
            {overallUp ? 'Naik' : 'Turun'}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <MetricRow
          label="Pendapatan"
          curr={data.current.revenue}
          prev={data.previous.revenue}
          format={fmtRp}
        />
        <MetricRow
          label="Transaksi"
          curr={data.current.transactions}
          prev={data.previous.transactions}
          format={n => `${Math.abs(n)} transaksi`}
        />
        <MetricRow
          label="Keuntungan"
          curr={data.current.profit}
          prev={data.previous.profit}
          format={fmtRp}
        />
      </View>

      {/* Sub-label periode sebelumnya */}
      <View style={styles.prevRow}>
        <Text style={styles.prevLabel}>Periode sebelumnya:</Text>
        <Text style={styles.prevVal}>{fmtRp(data.previous.revenue)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10, minHeight: 50 },
  iconBox:      { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title:        { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  subtitle:     { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 2 },
  overallBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  overallText:  { fontSize: 11, fontFamily: 'PoppinsBold' },
  body:         { gap: 0 },
  empty:        { height: 140, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText:    { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
  prevRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, marginTop: 4 },
  prevLabel:    { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  prevVal:      { fontSize: 11, fontFamily: 'PoppinsSemiBold', color: '#64748B' },
});

export default PeriodCompareCard;