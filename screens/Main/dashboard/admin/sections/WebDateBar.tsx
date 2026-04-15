/**
 * WebDateBar.tsx — DateRangeSelector kiri, Refresh kanan
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { COLORS } from '@constants/colors';

const PRESETS = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'week',  label: '7 Hari'  },
  { key: 'month', label: '30 Hari' },
  { key: 'year',  label: '1 Tahun' },
] as const;

type Preset = typeof PRESETS[number]['key'];

interface Props {
  selectedPreset: Preset;
  onSelectPreset: (p: Preset) => void;
  dateLabel:      string;
  onRefresh?:     () => void;
  refreshing?:    boolean;
}

export const WebDateBar: React.FC<Props> = ({
  selectedPreset, onSelectPreset, dateLabel, onRefresh, refreshing,
}) => (
  <View style={styles.bar}>

    {/* KIRI — period label + pills sejajar */}
    <View style={styles.left}>
      <View style={styles.periodWrap}>
        <Text style={styles.periodLabel}>Periode</Text>
        <Text style={styles.periodValue}>{dateLabel}</Text>
      </View>
      <View style={styles.divider} />
      {/* Pills preset */}
      <View style={styles.pills}>
        {PRESETS.map(p => {
          const active = selectedPreset === p.key;
          return (
            <TouchableOpacity
              key={p.key}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => onSelectPreset(p.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>

    {/* KANAN — Refresh */}
    {onRefresh && (
      <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.75}>
        {refreshing
          ? <ActivityIndicator size="small" color={COLORS.secondary} />
          : <RefreshCw size={14} color={COLORS.secondary} />}
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDF2',
    ...Platform.select({ web: { boxShadow: '0px 2px 12px rgba(0,0,0,0.04)' } as any }),
  },

  left:       { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  periodWrap: { gap: 1 },
  periodLabel:{ fontSize: 9, fontFamily: 'PoppinsRegular', color: '#94A3B8', textTransform: 'uppercase' as any, letterSpacing: 0.5 },
  periodValue:{ fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },

  divider: { width: 1, height: 28, backgroundColor: '#E2E8F0' },

  pills:         { flexDirection: 'row', gap: 6 },
  pill:          { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  pillActive:    { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  pillText:      { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#64748B' },
  pillTextActive:{ color: '#FFF', fontFamily: 'PoppinsBold' },

  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    borderColor: `${COLORS.secondary}40`,
    backgroundColor: `${COLORS.secondary}08`,
  },
  refreshText: { fontSize: 12, fontFamily: 'PoppinsMedium', color: COLORS.secondary },
});