/**
 * ProfitChart.tsx
 * Ringkasan Keuangan — horizontal bar Revenue vs Modal vs Profit
 * Tidak pakai per-hari (misleading karena beda waktu beli & jual)
 * Data: totalRevenue, totalExpense, totalProfit (scalar dari dashboardService)
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { TrendingUp, TrendingDown, Minus, DollarSign } from 'lucide-react-native';

const COLOR_REVENUE = '#00A79D'; // teal — pendapatan
const COLOR_MODAL   = '#F43F5E'; // merah — modal stok
const COLOR_PROFIT  = '#10B981'; // hijau — untung
const COLOR_LOSS    = '#EF4444'; // merah tua — rugi
const COLOR_BREAK   = '#F59E0B'; // amber — impas

interface Props {
  totalRevenue:   number;
  totalExpense:   number;
  totalProfit:    number;
  isLoading?:     boolean;
  dateRangeLabel?: string;
}

const fmtRp = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `Rp ${(abs/1_000_000_000).toFixed(1)}M`;
  if (abs >= 1_000_000)     return `Rp ${(abs/1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000)         return `Rp ${(abs/1_000).toFixed(0)}rb`;
  return `Rp ${abs.toLocaleString('id-ID')}`;
};

const AnimatedBar: React.FC<{
  ratio: number;
  color: string;
  delay?: number;
}> = ({ ratio, color, delay = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: ratio,
      duration: 700,
      delay,
      useNativeDriver: false,
    }).start();
  }, [ratio]);

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          backgroundColor: color,
          flex: anim,
        },
      ]}
    />
  );
};

export const ProfitChart: React.FC<Props> = ({
  totalRevenue, totalExpense, totalProfit,
  isLoading = false, dateRangeLabel,
}) => {
  const hasData    = totalRevenue > 0 || totalExpense > 0;
  const maxVal     = Math.max(totalRevenue, totalExpense, Math.abs(totalProfit), 1);
  const margin     = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  const isProfit   = totalProfit > 0;
  const isLoss     = totalProfit < 0;
  const statusColor = isProfit ? COLOR_PROFIT : isLoss ? COLOR_LOSS : COLOR_BREAK;
  const StatusIcon  = isProfit ? TrendingUp : isLoss ? TrendingDown : Minus;
  const statusLabel = isProfit ? 'UNTUNG' : isLoss ? 'RUGI' : 'IMPAS';

  const rows = [
    {
      label:  'Pendapatan',
      sub:    'dari penjualan',
      value:  totalRevenue,
      color:  COLOR_REVENUE,
      ratio:  totalRevenue / maxVal,
      delay:  0,
    },
    {
      label:  'Modal Stok',
      sub:    'pembelian stok',
      value:  totalExpense,
      color:  COLOR_MODAL,
      ratio:  totalExpense / maxVal,
      delay:  100,
    },
    {
      label:  isLoss ? 'Kerugian' : 'Keuntungan',
      sub:    `margin ${Math.abs(margin)}%`,
      value:  Math.abs(totalProfit),
      color:  statusColor,
      ratio:  Math.abs(totalProfit) / maxVal,
      delay:  200,
    },
  ];

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: statusColor + '18' }]}>
          <DollarSign size={15} color={statusColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Ringkasan Keuangan</Text>
          <Text style={[styles.subtitle, { color: statusColor }]}>
            {dateRangeLabel ?? 'Periode ini'}
          </Text>
        </View>
        {/* Status badge */}
        <View style={[styles.badge, { backgroundColor: statusColor + '15', borderColor: statusColor + '35' }]}>
          <StatusIcon size={11} color={statusColor} />
          <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* BARS */}
      {!hasData ? (
        <View style={styles.empty}>
          <DollarSign size={32} color="#E2E8F0" strokeWidth={1.5} />
          <Text style={styles.emptyText}>Belum ada data keuangan</Text>
          <Text style={styles.emptyHint}>Data muncul setelah ada transaksi</Text>
        </View>
      ) : (
        <View style={styles.barsWrap}>
          {rows.map((row) => (
            <View key={row.label} style={styles.barRow}>

              {/* Label kiri */}
              <View style={styles.barLabel}>
                <Text style={styles.barLabelText}>{row.label}</Text>
                <Text style={styles.barLabelSub}>{row.sub}</Text>
              </View>

              {/* Bar track */}
              <View style={styles.barTrack}>
                <AnimatedBar ratio={row.ratio} color={row.color} delay={row.delay} />
                <View style={{ flex: Math.max(1 - row.ratio, 0) }} />
              </View>

              {/* Nilai kanan */}
              <Text style={[styles.barValue, { color: row.color }]}>
                {fmtRp(row.value)}
              </Text>

            </View>
          ))}

          {/* Divider + margin summary */}
          <View style={styles.divider} />
          <View style={styles.summary}>
            <View style={styles.summaryLeft}>
              <StatusIcon size={13} color={statusColor} />
              <Text style={[styles.summaryLabel, { color: statusColor }]}>
                {isLoss ? 'Rugi bersih' : 'Profit bersih'}
              </Text>
            </View>
            <View style={styles.summaryRight}>
              <Text style={[styles.summaryValue, { color: statusColor }]}>
                {isLoss ? '-' : '+'}{fmtRp(Math.abs(totalProfit))}
              </Text>
              <View style={[styles.marginBadge, { backgroundColor: statusColor + '15' }]}>
                <Text style={[styles.marginText, { color: statusColor }]}>
                  {Math.abs(margin)}% margin
                </Text>
              </View>
            </View>
          </View>

        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header:     { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  iconBox:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title:      { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  subtitle:   { fontSize: 11, fontFamily: 'PoppinsRegular', marginTop: 2 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontFamily: 'PoppinsBold' },

  barsWrap: { flex: 1, gap: 0 },

  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  barLabel: { width: 80 },
  barLabelText: { fontSize: 11, fontFamily: 'PoppinsSemiBold', color: '#334155' },
  barLabelSub:  { fontSize: 9,  fontFamily: 'PoppinsRegular',  color: '#94A3B8', marginTop: 1 },

  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bar: { height: 12, borderRadius: 6 },

  barValue: { width: 72, fontSize: 12, fontFamily: 'PoppinsBold', textAlign: 'right' as any },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },

  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  summaryLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryLabel: { fontSize: 12, fontFamily: 'PoppinsSemiBold' },
  summaryRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryValue: { fontSize: 15, fontFamily: 'PoppinsBold' },
  marginBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  marginText:   { fontSize: 10, fontFamily: 'PoppinsBold' },

  empty:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 48 },
  emptyText: { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#94A3B8' },
  emptyHint: { fontSize: 11, fontFamily: 'PoppinsRegular',  color: '#CBD5E1' },
});

export default ProfitChart;