/**
 * TargetCard.tsx
 * Progress omzet periode ini vs target yang diset admin
 * Support: today / week / month / year
 * Target diset manual di Settings > Profil Toko
 */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Target, Zap, TrendingUp } from 'lucide-react-native';

const C_OVER   = '#10B981';
const C_HIGH   = '#00A79D';
const C_MID    = '#F59E0B';
const C_LOW    = '#EF4444';

const fmtRp = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `Rp ${(abs / 1_000_000_000).toFixed(1)}M`;
  if (abs >= 1_000_000)     return `Rp ${(abs / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000)         return `Rp ${(abs / 1_000).toFixed(0)}rb`;
  return `Rp ${abs.toLocaleString('id-ID')}`;
};

const PRESET_LABEL: Record<string, string> = {
  today: 'Hari Ini',
  week:  'Minggu Ini',
  month: 'Bulan Ini',
  year:  'Tahun Ini',
};

export interface TargetData {
  currentRevenue: number;
  targetRevenue:  number;   // 0 = belum diset
  preset:         'today' | 'week' | 'month' | 'year';
}

interface Props {
  data?:        TargetData;
  isLoading?:   boolean;
  onSetTarget?: () => void;
}

// SVG arc setengah lingkaran
const ArcProgress = ({ pct, color }: { pct: number; color: string }) => {
  const cap   = Math.min(pct, 100);
  const total = 169.6; // panjang setengah lingkaran r=54
  const fill  = (cap / 100) * total;
  return (
    <svg width={128} height={80} viewBox="0 0 128 90" style={{ overflow: 'visible' }}>
      {/* Track */}
      <path d="M 10 64 A 54 54 0 0 1 118 64"
        fill="none" stroke="#F1F5F9" strokeWidth={10} strokeLinecap="round" />
      {/* Fill */}
      <path d="M 10 64 A 54 54 0 0 1 118 64"
        fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
        strokeDasharray={`${fill} ${total}`} />
    </svg>
  );
};

export const TargetCard: React.FC<Props> = ({ data, isLoading = false, onSetTarget }) => {
  const preset      = data?.preset ?? 'today';
  const presetLabel = PRESET_LABEL[preset];
  const current     = data?.currentRevenue ?? 0;
  const target      = data?.targetRevenue  ?? 0;

  // Belum ada target
  if (!data || target === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: '#00A79D18' }]}>
            <Target size={15} color="#00A79D" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Target {presetLabel}</Text>
            <Text style={styles.subtitle}>Belum ada target diset</Text>
          </View>
        </View>
        <View style={styles.noTargetBox}>
          <Target size={22} color="#CBD5E1" />
          <Text style={styles.noTargetText}>
            Set target omzet di Settings {'>'} Profil Toko untuk memantau progress toko Anda
          </Text>
          {onSetTarget && (
            <Text style={styles.setTargetBtn} onPress={onSetTarget}>
              Set Target →
            </Text>
          )}
        </View>
        {current > 0 && (
          <View style={styles.currentRow}>
            <TrendingUp size={12} color="#94A3B8" />
            <Text style={styles.currentText}>{presetLabel}: {fmtRp(current)}</Text>
          </View>
        )}
      </View>
    );
  }

  const pct       = Math.round((current / target) * 100);
  const isOver    = pct >= 100;
  const color     = isOver ? C_OVER : pct >= 75 ? C_HIGH : pct >= 40 ? C_MID : C_LOW;
  const remaining = Math.max(0, target - current);
  const statusText = isOver
    ? `Melampaui +${fmtRp(current - target)}`
    : `Sisa ${fmtRp(remaining)}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: color + '18' }]}>
          {isOver ? <Zap size={15} color={color} /> : <Target size={15} color={color} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Target {presetLabel}</Text>
          <Text style={[styles.subtitle, { color }]}>{statusText}</Text>
        </View>
      </View>

      {/* Arc */}
      <View style={styles.arcWrap}>
        {Platform.OS === 'web' && <ArcProgress pct={pct} color={color} />}
        <View style={styles.arcCenter}>
          <Text style={[styles.pctText, { color }]}>{Math.min(pct, 999)}%</Text>
          <Text style={styles.pctSub}>tercapai</Text>
        </View>
      </View>

      {/* Fallback progress bar (mobile) */}
      {Platform.OS !== 'web' && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, {
            width: `${Math.min(pct, 100)}%` as any,
            backgroundColor: color,
          }]} />
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{presetLabel}</Text>
          <Text style={[styles.statVal, { color }]}>{fmtRp(current)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Target</Text>
          <Text style={styles.statVal}>{fmtRp(target)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10, minHeight: 50 },
  iconBox:      { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title:        { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  subtitle:     { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 2 },

  noTargetBox:   { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, alignItems: 'center', gap: 8 },
  noTargetText:  { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', textAlign: 'center', lineHeight: 16 },
  setTargetBtn:  { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#00A79D', marginTop: 2 },
  currentRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  currentText:   { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8' },

  arcWrap:       { alignItems: 'center', justifyContent: 'center', height: 90, marginBottom: 6 },
  arcCenter:     { position: 'absolute', alignItems: 'center', bottom: 4 },
  pctText:       { fontSize: 26, fontFamily: 'PoppinsBold', lineHeight: 30 },
  pctSub:        { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8' },

  progressTrack: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressFill:  { height: 8, borderRadius: 4 },

  statsRow:      { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginTop: 4 },
  statItem:      { flex: 1, alignItems: 'center', gap: 2 },
  statDivider:   { width: 1, backgroundColor: '#E2E8F0' },
  statLabel:     { fontSize: 9, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  statVal:       { fontSize: 12, fontFamily: 'PoppinsBold', color: '#1E293B' },
});

export default TargetCard;