/**
 * StatsToolbar.tsx — Responsive
 * Desktop/Tablet : ikon + angka + label
 * Mobile <768px  : ikon + angka saja (label disembunyikan, padding lebih kecil)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useWindowWidth } from '@hooks/useWindowWidth';

export interface StatItem {
  icon:  React.ReactNode;
  value: number;
  label: string;
  bg:    string;
  color: string;
}

interface Props {
  stats: StatItem[];
  right?: React.ReactNode;
}

const BP_MOBILE = 768;

const StatsToolbar: React.FC<Props> = ({ stats, right }) => {
  const windowWidth = useWindowWidth();
  const isMobile    = windowWidth < BP_MOBILE;

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>

      {/* STAT CHIPS */}
      <View style={styles.statsRow}>
        {stats.map((stat, i) => (
          <View
            key={i}
            style={[
              styles.chip,
              { backgroundColor: stat.bg },
              isMobile && styles.chipMobile,
            ]}
          >
            {/* Ikon */}
            <View style={styles.iconWrap}>{stat.icon}</View>

            {/* Angka */}
            <Text style={[styles.value, { color: stat.color }]}>
              {stat.value}
            </Text>

            {/* Label — disembunyikan di mobile */}
            {!isMobile && (
              <Text style={[styles.label, { color: stat.color }]}>
                {stat.label}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* SLOT KANAN (tombol tambah, filter, dll) */}
      {right && <View style={styles.rightSlot}>{right}</View>}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  containerMobile: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'nowrap' as any,
    flexShrink: 1,
    minWidth: 0,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  chipMobile: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },

  iconWrap: { flexShrink: 0 },

  value: {
    fontSize: 14,
    fontFamily: 'PoppinsBold',
  },
  label: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    opacity: 0.8,
  },

  rightSlot: { flexShrink: 0 },
});

export default StatsToolbar;