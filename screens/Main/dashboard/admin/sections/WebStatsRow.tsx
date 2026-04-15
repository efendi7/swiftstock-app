/**
 * WebStatsRow.tsx — 4 Metrik dengan SVG ilustrasi besar di kanan
 * SVG sesuai konteks: uang/coin untuk Pendapatan, receipt untuk Pengeluaran,
 * box-in untuk Stok Masuk, box-out untuk Stok Keluar.
 * Delta komparasi muncul untuk SEMUA preset (today/week/month/year).
 */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '@constants/colors';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

export interface StatsComparison {
  prevRevenue:      number;
  prevTransactions: number;
}

interface Props {
  totalRevenue:      number;
  totalExpense:      number;
  totalTransactions: number;
  totalIn:           number;
  totalOut:          number;
  totalNewProducts?: number;
  comparison?:       StatsComparison;
  selectedPreset:    'today' | 'week' | 'month' | 'year';
  isLoading?:        boolean;
}

const fmtRp = (n: number): string => {
  const abs = Math.abs(n), s = n < 0 ? '−' : '';
  if (abs >= 1_000_000_000) return `${s}${(abs/1e9).toFixed(1)}M`;
  if (abs >= 1_000_000)     return `${s}${(abs/1e6).toFixed(1)}jt`;
  if (abs >= 1_000)         return `${s}${(abs/1e3).toFixed(0)}rb`;
  return `${s}${abs.toLocaleString('id-ID')}`;
};
const fmtNum = (n: number) => n.toLocaleString('id-ID');
const calcDelta = (curr: number, prev: number) =>
  prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;
const CMP: Record<string, string> = {
  today: 'vs kemarin', week: 'vs minggu lalu',
  month: 'vs bulan lalu', year: 'vs tahun lalu',
};

// ─── SVG Ilustrasi besar ───────────────────────────────────
// Setiap SVG didesain 96×80 agar proporsional di sisi kanan card

const SvgRevenue = ({ color }: { color: string }) => (
  <svg width="96" height="80" viewBox="0 0 96 80" fill="none">
    {/* Koin besar */}
    <circle cx="54" cy="38" r="28" fill={color} fillOpacity="0.10"/>
    <circle cx="54" cy="38" r="20" fill={color} fillOpacity="0.16"/>
    <circle cx="54" cy="38" r="13" fill={color} fillOpacity="0.28"/>
    {/* Simbol Rp */}
    <text x="48" y="43" fontFamily="Arial" fontWeight="bold" fontSize="13" fill={color} fillOpacity="0.85">Rp</text>
    {/* Koin kecil kiri */}
    <circle cx="20" cy="52" r="12" fill={color} fillOpacity="0.08"/>
    <circle cx="20" cy="52" r="7"  fill={color} fillOpacity="0.14"/>
    {/* Panah naik */}
    <polyline points="14,62 22,48 30,55 42,40" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" fill="none"/>
    <polygon  points="44,36 40,42 48,42" fill={color} fillOpacity="0.5"/>
  </svg>
);

const SvgExpense = ({ color }: { color: string }) => (
  <svg width="96" height="80" viewBox="0 0 96 80" fill="none">
    {/* Struk / receipt */}
    <rect x="26" y="12" width="44" height="56" rx="5" fill={color} fillOpacity="0.10"/>
    <rect x="32" y="20" width="32" height="4" rx="2" fill={color} fillOpacity="0.30"/>
    <rect x="32" y="30" width="24" height="3" rx="1.5" fill={color} fillOpacity="0.22"/>
    <rect x="32" y="38" width="28" height="3" rx="1.5" fill={color} fillOpacity="0.22"/>
    <rect x="32" y="46" width="20" height="3" rx="1.5" fill={color} fillOpacity="0.22"/>
    {/* garis bawah total */}
    <rect x="32" y="54" width="32" height="2" rx="1" fill={color} fillOpacity="0.40"/>
    <rect x="46" y="58" width="18" height="4" rx="2" fill={color} fillOpacity="0.28"/>
    {/* Panah keluar */}
    <polyline points="72,44 82,44" stroke={color} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.45"/>
    <polyline points="78,40 82,44 78,48" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.45"/>
  </svg>
);

const SvgStockIn = ({ color }: { color: string }) => (
  <svg width="96" height="80" viewBox="0 0 96 80" fill="none">
    {/* Kotak kardus */}
    <rect x="20" y="34" width="50" height="34" rx="4" fill={color} fillOpacity="0.12"/>
    <polygon points="20,34 45,22 70,34" fill={color} fillOpacity="0.20"/>
    {/* Garis tengah kotak */}
    <line x1="45" y1="22" x2="45" y2="68" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" strokeOpacity="0.35"/>
    {/* Tutup kotak terbuka */}
    <polyline points="20,34 30,26 45,34" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.40"/>
    {/* Panah masuk dari atas */}
    <line x1="77" y1="12" x2="77" y2="36" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.65"/>
    <polygon points="71,32 77,42 83,32" fill={color} fillOpacity="0.65"/>
  </svg>
);

const SvgStockOut = ({ color }: { color: string }) => (
  <svg width="96" height="80" viewBox="0 0 96 80" fill="none">
    {/* Kotak kardus */}
    <rect x="20" y="30" width="50" height="34" rx="4" fill={color} fillOpacity="0.12"/>
    <polygon points="20,30 45,18 70,30" fill={color} fillOpacity="0.20"/>
    <line x1="45" y1="18" x2="45" y2="64" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" strokeOpacity="0.35"/>
    {/* Panah keluar ke kanan */}
    <line x1="72" y1="47" x2="90" y2="47" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.65"/>
    <polygon points="84,41 94,47 84,53" fill={color} fillOpacity="0.65"/>
    {/* Tanda minus di kotak */}
    <rect x="34" y="43" width="16" height="3" rx="1.5" fill={color} fillOpacity="0.40"/>
  </svg>
);

// ─── Delta Badge ────────────────────────────────────────────
interface DeltaProps { pct: number | null; compareLabel: string; nominalLabel?: string }
const DeltaBadge: React.FC<DeltaProps> = ({ pct, compareLabel, nominalLabel }) => {
  if (pct === null) return null;
  const up    = pct > 0;
  const Icon  = pct === 0 ? Minus : up ? TrendingUp : TrendingDown;
  const color = pct === 0 ? '#94A3B8' : up ? COLORS.success : COLORS.danger;
  const bg    = pct === 0 ? '#F1F5F9' : up ? '#F0FDF4'      : '#FEF2F2';
  return (
    <View style={db.wrap}>
      <View style={[db.badge, { backgroundColor: bg }]}>
        <Icon size={10} color={color} />
        <Text style={[db.pct, { color }]}>{up ? '+' : ''}{pct}%</Text>
      </View>
      <Text style={db.lbl}>{compareLabel}</Text>
      {nominalLabel ? <Text style={db.nom}>{nominalLabel}</Text> : null}
    </View>
  );
};
const db = StyleSheet.create({
  wrap:  { marginTop: 8, gap: 3 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  pct:   { fontSize: 10, fontFamily: 'PoppinsSemiBold' },
  lbl:   { fontSize: 9, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  nom:   { fontSize: 9, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
});

// ─── Card ───────────────────────────────────────────────────
interface CardProps {
  accentColor: string;
  label:       string;
  value:       string;
  subLabel?:   string;
  deltaNode?:  React.ReactNode;
  SvgIcon:     React.FC<{ color: string }>;
  isLoading?:  boolean;
}
const MetricCard: React.FC<CardProps> = ({
  accentColor, label, value, subLabel, deltaNode, SvgIcon, isLoading,
}) => (
  <View style={[mc.wrap, { opacity: isLoading ? 0.6 : 1 }]}>
    {/* Accent bar atas */}
    <View style={[mc.bar, { backgroundColor: accentColor }]} />

    {/* Konten: teks kiri + SVG kanan */}
    <View style={mc.body}>
      <View style={mc.left}>
        {/* Label kecil + dot warna */}
        <View style={mc.labelRow}>
          <View style={[mc.dot, { backgroundColor: accentColor }]} />
          <Text style={mc.label}>{label}</Text>
        </View>
        <Text style={mc.value} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        {subLabel ? <Text style={mc.sub}>{subLabel}</Text> : null}
        {deltaNode ?? null}
      </View>

      {/* SVG ilustrasi besar di kanan */}
      {Platform.OS === 'web' && (
        <View style={mc.svgWrap} pointerEvents="none">
          <SvgIcon color={accentColor} />
        </View>
      )}
    </View>
  </View>
);

const mc = StyleSheet.create({
  wrap:     {
    flex: 1, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
    ...Platform.select({ web: { boxShadow: '0 2px 14px rgba(0,0,0,0.06)', contain: 'layout style' } as any }),
  },
  bar:      { height: 3, width: '100%' },
  body:     { flexDirection: 'row', alignItems: 'flex-end', padding: 16, paddingTop: 14 },
  left:     { flex: 1, paddingBottom: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  dot:      { width: 7, height: 7, borderRadius: 4 },
  label:    { fontSize: 11, fontFamily: 'PoppinsMedium', color: COLORS.textLight },
  value:    { fontSize: 24, fontFamily: 'PoppinsBold', color: COLORS.textDark, letterSpacing: -0.5 },
  sub:      { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 3 },
  svgWrap:  { marginLeft: 4, marginBottom: -4 },  // sedikit turun agar pas di pojok kanan bawah
});

// ─── Main ───────────────────────────────────────────────────
const _WebStatsRow: React.FC<Props> = ({
  totalRevenue, totalExpense, totalTransactions,
  totalIn, totalOut, totalNewProducts = 0,
  comparison, selectedPreset, isLoading,
}) => {
  const cmpLabel    = CMP[selectedPreset] ?? 'vs sebelumnya';
  // Delta selalu dihitung dari comparison — muncul di semua preset
  const revDelta    = comparison != null ? calcDelta(totalRevenue, comparison.prevRevenue) : null;
  const revDeltaNom = comparison && comparison.prevRevenue > 0
    ? `selisih Rp ${fmtRp(Math.abs(totalRevenue - comparison.prevRevenue))}`
    : undefined;
  const txDelta     = comparison != null ? calcDelta(totalTransactions, comparison.prevTransactions) : null;

  return (
    <View style={styles.row}>

      <MetricCard
        accentColor="#00A79D"
        label="Pendapatan"
        value={`Rp ${fmtRp(totalRevenue)}`}
        subLabel={`dari ${fmtNum(totalTransactions)} transaksi`}
        deltaNode={<DeltaBadge pct={revDelta} compareLabel={cmpLabel} nominalLabel={revDeltaNom} />}
        SvgIcon={SvgRevenue}
        isLoading={isLoading}
      />

      <MetricCard
        accentColor="#F59E0B"
        label="Pengeluaran"
        value={`Rp ${fmtRp(totalExpense)}`}
        subLabel="modal stok periode ini"
        SvgIcon={SvgExpense}
        isLoading={isLoading}
      />

      <MetricCard
        accentColor="#3B82F6"
        label="Stok Masuk"
        value={`${fmtNum(totalIn)} unit`}
        subLabel={totalNewProducts > 0 ? `termasuk ${totalNewProducts} produk baru` : 'unit masuk ke gudang'}
        SvgIcon={SvgStockIn}
        isLoading={isLoading}
      />

      <MetricCard
        accentColor="#8B5CF6"
        label="Stok Keluar"
        value={`${fmtNum(totalOut)} unit`}
        subLabel="unit terjual / keluar"
        deltaNode={<DeltaBadge pct={txDelta} compareLabel={cmpLabel} />}
        SvgIcon={SvgStockOut}
        isLoading={isLoading}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14, marginBottom: 20 },
});

export const WebStatsRow = React.memo(_WebStatsRow);
export default WebStatsRow;