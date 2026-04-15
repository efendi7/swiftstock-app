/**
 * HourlyChart.tsx — Scatter Plot kepadatan transaksi
 *
 * today → Jam Tersibuk   — scatter plot 24 jam (sumbu X = jam, Y = transaksi, size = revenue)
 * week  → Hari Tersibuk  — scatter plot 7 hari
 * month → Tanggal Tersibuk — scatter plot 28-31 tanggal
 * year  → Bulan Tersibuk — scatter plot 12 bulan
 */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
  ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceLine,
} from 'recharts';
import { Clock, Calendar, CalendarDays, CalendarRange } from 'lucide-react-native';

const C_DOT   = '#3B82F6';
const C_PEAK  = '#00A79D';
const C_REF   = '#F59E0B';

const fmtRp = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}rb`;
  return `${n}`;
};

export interface HourlyDataPoint {
  key:     string;
  label:   string;
  count:   number;
  revenue: number;
}

type Preset = 'today' | 'week' | 'month' | 'year';

interface Props {
  data?:           HourlyDataPoint[];
  isLoading?:      boolean;
  selectedPreset?: Preset;
}

const PRESET_CONFIG: Record<Preset, {
  title:      string;
  subtitle:   (peak: HourlyDataPoint | null) => string;
  emptyText:  string;
  Icon:       any;
  showRefLine: boolean;
  xLabel:     string;
}> = {
  today: {
    title:      'Kepadatan Transaksi per Jam',
    subtitle:   p => p ? `Puncak: ${p.label} · ${p.count} transaksi` : 'Sebaran titik transaksi hari ini',
    emptyText:  'Belum ada transaksi hari ini',
    Icon:       Clock,
    showRefLine: true,
    xLabel:     'Jam',
  },
  week: {
    title:      'Kepadatan Transaksi per Hari',
    subtitle:   p => p ? `Hari tersibuk: ${p.label} · ${p.count} transaksi` : 'Sebaran titik transaksi minggu ini',
    emptyText:  'Belum ada transaksi minggu ini',
    Icon:       CalendarDays,
    showRefLine: false,
    xLabel:     'Hari',
  },
  month: {
    title:      'Kepadatan Transaksi per Tanggal',
    subtitle:   p => p ? `Tgl tersibuk: ${p.label} · ${p.count} transaksi` : 'Sebaran titik transaksi bulan ini',
    emptyText:  'Belum ada transaksi bulan ini',
    Icon:       Calendar,
    showRefLine: false,
    xLabel:     'Tanggal',
  },
  year: {
    title:      'Kepadatan Transaksi per Bulan',
    subtitle:   p => p ? `Bulan tersibuk: ${p.label} · ${p.count} transaksi` : 'Sebaran titik transaksi tahun ini',
    emptyText:  'Belum ada transaksi tahun ini',
    Icon:       CalendarRange,
    showRefLine: false,
    xLabel:     'Bulan',
  },
};

// ── Tooltip ────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, preset }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as HourlyDataPoint;
  const labelFull = preset === 'month' ? `Tanggal ${d.label}` : d.label;
  return (
    <View style={tt.box}>
      <Text style={tt.label}>{labelFull}</Text>
      <View style={tt.divider} />
      <View style={tt.row}>
        <View style={[tt.dot, { backgroundColor: C_DOT }]} />
        <Text style={tt.name}>Transaksi</Text>
        <Text style={[tt.val, { color: C_DOT }]}>{d.count}</Text>
      </View>
      <View style={tt.row}>
        <View style={[tt.dot, { backgroundColor: C_PEAK }]} />
        <Text style={tt.name}>Pendapatan</Text>
        <Text style={[tt.val, { color: C_PEAK }]}>Rp {fmtRp(d.revenue)}</Text>
      </View>
    </View>
  );
};
const tt = StyleSheet.create({
  box:     { backgroundColor: '#fff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#E2E8F0', minWidth: 155, ...Platform.select({ web: { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' } as any }) },
  label:   { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#1E293B', marginBottom: 6 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 6 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  dot:     { width: 7, height: 7, borderRadius: 4 },
  name:    { flex: 1, fontSize: 10, fontFamily: 'PoppinsRegular', color: '#64748B' },
  val:     { fontSize: 11, fontFamily: 'PoppinsSemiBold' },
});

// ── Custom dot shape ────────────────────────────────────────
const CustomDot = (props: any) => {
  const { cx, cy, payload, peak } = props;
  const isPeak = peak && payload?.key === peak.key;
  const r = isPeak ? 9 : Math.max(5, Math.min(14, 4 + payload?.count / 3));
  return (
    <circle
      cx={cx} cy={cy} r={r}
      fill={isPeak ? C_PEAK : C_DOT}
      opacity={isPeak ? 1 : 0.55 + (payload?.count / (peak?.count || 1)) * 0.35}
      stroke={isPeak ? '#fff' : 'none'}
      strokeWidth={isPeak ? 2 : 0}
    />
  );
};

// ── Main ────────────────────────────────────────────────────
const _HourlyChart: React.FC<Props> = ({
  data = [], isLoading, selectedPreset = 'today',
}) => {
  const cfg     = PRESET_CONFIG[selectedPreset];
  const Icon    = cfg.Icon;
  const hasData = data.some(d => d.count > 0);

  const WEEK_ORDER = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const displayData: (HourlyDataPoint & { x: number })[] = (() => {
    let sorted = selectedPreset === 'week'
      ? [...data].sort((a, b) => WEEK_ORDER.indexOf(a.key) - WEEK_ORDER.indexOf(b.key))
      : selectedPreset === 'month'
        ? [...data].sort((a, b) => Number(a.key) - Number(b.key))
        : [...data];
    // Tambah index numerik untuk sumbu X scatter
    return sorted.map((d, i) => ({ ...d, x: i }));
  })();

  const peak = hasData
    ? displayData.reduce((mx, d) => d.count > mx.count ? d : mx, displayData[0])
    : null;

  const nowIdx = selectedPreset === 'today'
    ? new Date().getHours()
    : -1;

  // Label map: index numerik -> label string untuk tickFormatter
  const labelMap: Record<number, string> = {};
  displayData.forEach(d => { labelMap[d.x] = d.label; });

  // Ticks yang ditampilkan (filter agar tidak crowded)
  const xTickInterval = selectedPreset === 'today' ? 2
    : selectedPreset === 'month' ? 4 : 0;
  const filteredTicks = displayData
    .filter((_, i) => xTickInterval === 0 ? true : i % (xTickInterval + 1) === 0)
    .map(d => d.x);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: C_DOT + '18' }]}>
          <Icon size={15} color={C_DOT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{cfg.title}</Text>
          <Text style={styles.subtitle}>{cfg.subtitle(peak)}</Text>
        </View>
        {peak && peak.count > 0 && (
          <View style={styles.peakBadge}>
            <Text style={styles.peakText}>{peak.label}</Text>
            <Text style={styles.peakSub}>tersibuk</Text>
          </View>
        )}
      </View>

      {/* Chart */}
      <View style={styles.chartWrap}>
        {!hasData ? (
          <View style={styles.empty}>
            <Icon size={28} color="#E2E8F0" strokeWidth={1.5} />
            <Text style={styles.emptyText}>{cfg.emptyText}</Text>
          </View>
        ) : (
          <ResponsiveContainer width="99%" height={200} minHeight={200}>
            <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F1F5F9"
                vertical={false}
              />
              <XAxis
                type="number"
                dataKey="x"
                domain={[0, displayData.length - 1]}
                ticks={filteredTicks}
                tickFormatter={(val: number) => labelMap[val] ?? ''}
                tick={{ fontSize: 9, fontFamily: 'PoppinsRegular', fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
                name={cfg.xLabel}
              />
              <YAxis
                type="number"
                dataKey="count"
                tick={{ fontSize: 9, fontFamily: 'PoppinsRegular', fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={28}
                name="Transaksi"
              />
              {/* ZAxis untuk ukuran dot — menggunakan count untuk radius */}
              <ZAxis dataKey="count" range={[40, 400]} />
              <Tooltip
                content={<CustomTooltip preset={selectedPreset} />}
                cursor={{ strokeDasharray: '3 3', stroke: '#E2E8F0' }}
              />
              {/* Garis "jam sekarang" hanya untuk today */}
              {cfg.showRefLine && nowIdx >= 0 && (
                <ReferenceLine
                  x={nowIdx}
                  stroke={C_REF}
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                  label={{
                    value: 'Skrg',
                    fontSize: 8,
                    fill: C_REF,
                    fontFamily: 'PoppinsMedium',
                    position: 'insideTopRight',
                  }}
                />
              )}
              <Scatter
                data={displayData}
                shape={(p: any) => <CustomDot {...p} peak={peak} />}
                isAnimationActive={false}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10, minHeight: 48 },
  iconBox:   { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  subtitle:  { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 2 },
  peakBadge: { borderRadius: 10, backgroundColor: C_PEAK + '15', borderWidth: 1, borderColor: C_PEAK + '40', paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center' },
  peakText:  { fontSize: 12, fontFamily: 'PoppinsBold', color: C_PEAK },
  peakSub:   { fontSize: 9, fontFamily: 'PoppinsRegular', color: C_PEAK + 'CC' },
  chartWrap: { flex: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: '#FAFCFF', paddingTop: 4 },
  empty:     { height: 200, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 13, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
});

export const HourlyChart = React.memo(_HourlyChart);
export default HourlyChart;