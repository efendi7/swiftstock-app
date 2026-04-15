/**
 * components/common/web/SkeletonLoading.tsx
 * Skeleton loading reusable — bisa dipakai di semua halaman web.
 *
 * Cara pakai:
 *   // Tabel/list rows
 *   <SkeletonLoading type="table" rows={8} />
 *
 *   // Kartu grid (dashboard)
 *   <SkeletonLoading type="card" rows={6} columns={3} />
 *
 *   // Sidebar filter
 *   <SkeletonLoading type="sidebar" />
 *
 *   // Stats chips di toolbar
 *   <SkeletonLoading type="stat" rows={4} />
 *
 *   // Teks paragraf
 *   <SkeletonLoading type="text" rows={5} />
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';

// ── BONE (unit terkecil) ───────────────────────────────────────────────────
interface BoneProps {
  width:   number | string;
  height:  number;
  radius?: number;
  style?:  any;
}

const Bone: React.FC<BoneProps> = ({ width, height, radius = 6, style }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, easing: Easing.ease, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: '#E2E8F0', opacity },
        style,
      ]}
    />
  );
};

// ── PRESET TYPES ──────────────────────────────────────────────────────────
type SkeletonType = 'table' | 'card' | 'sidebar' | 'stat' | 'text' | 'attendance';

interface Props {
  type?:    SkeletonType;
  rows?:    number;
  columns?: number;
  style?:   any;
}

const SkeletonLoading: React.FC<Props> = ({
  type = 'table', rows = 6, columns = 3, style,
}) => {
  switch (type) {

    // ── TABEL / LIST ROWS ──────────────────────────────────
    case 'table':
      return (
        <View style={[sk.wrap, style]}>
          {/* Header */}
          <View style={sk.tableHead}>
            {[36, '15%', '20%', '12%', '12%', '12%', '10%'].map((w, i) => (
              <Bone key={i} width={w} height={10} radius={4} />
            ))}
          </View>
          {/* Rows */}
          {Array.from({ length: rows }).map((_, r) => (
            <View key={r} style={sk.tableRow}>
              <Bone width={28}   height={10} radius={4} />
              <View style={sk.rowProduct}>
                <Bone width={36} height={36} radius={8} />
                <View style={sk.rowProductText}>
                  <Bone width="60%" height={11} radius={4} />
                  <Bone width="35%" height={9} radius={3} style={{ marginTop: 4 }} />
                </View>
              </View>
              <Bone width="12%" height={10} radius={4} />
              <Bone width="10%" height={10} radius={4} />
              <Bone width="10%" height={10} radius={4} />
              <Bone width={60}  height={26} radius={7} />
              <Bone width={60}  height={26} radius={7} />
            </View>
          ))}
        </View>
      );

    // ── KARTU GRID (dashboard) ─────────────────────────────
    case 'card':
      return (
        <View style={[sk.cardGrid, { gap: 16 }, style]}>
          {Array.from({ length: rows }).map((_, i) => (
            <View key={i} style={[sk.card, { width: `${Math.floor(100 / columns) - 2}%` as any }]}>
              <View style={sk.cardTop}>
                <Bone width={40} height={40} radius={10} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Bone width="60%" height={12} radius={4} />
                  <Bone width="40%" height={10} radius={4} />
                </View>
              </View>
              <Bone width="80%" height={24} radius={6} style={{ marginTop: 12 }} />
              <Bone width="50%" height={10} radius={4} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      );

    // ── SIDEBAR FILTER ─────────────────────────────────────
    case 'sidebar':
      return (
        <View style={[sk.sidebarWrap, style]}>
          {/* Search */}
          <Bone width="100%" height={34} radius={8} />
          <View style={sk.divider} />
          {/* Sections */}
          {[3, 3, 2].map((chips, si) => (
            <View key={si} style={sk.sidebarSection}>
              <View style={sk.sidebarSectionHead}>
                <Bone width="40%" height={10} radius={4} />
                <Bone width={16}  height={10} radius={4} />
              </View>
              {Array.from({ length: chips }).map((_, ci) => (
                <Bone key={ci} width="100%" height={34} radius={7} style={{ marginBottom: 4 }} />
              ))}
              <View style={sk.divider} />
            </View>
          ))}
        </View>
      );

    // ── STAT CHIPS (toolbar) ───────────────────────────────
    case 'stat':
      return (
        <View style={[sk.statRow, style]}>
          {Array.from({ length: rows }).map((_, i) => (
            <Bone key={i} width={88} height={32} radius={8} />
          ))}
        </View>
      );

    // ── TEKS PARAGRAF ──────────────────────────────────────
    case 'text':
      return (
        <View style={[sk.textWrap, style]}>
          {Array.from({ length: rows }).map((_, i) => (
            <Bone key={i} width={i === rows - 1 ? '60%' : `${85 + Math.random() * 15}%`} height={12} radius={4} style={{ marginBottom: 8 }} />
          ))}
        </View>
      );

    // ── TABEL ABSENSI ──────────────────────────────────────
    case 'attendance':
      return (
        <View style={[sk.wrap, style]}>
          {/* Header bulan */}
          <View style={sk.attHead}>
            <Bone width={160} height={12} radius={4} />
            {Array.from({ length: 10 }).map((_, i) => (
              <Bone key={i} width={36} height={12} radius={4} />
            ))}
          </View>
          {/* Rows kasir */}
          {Array.from({ length: rows }).map((_, r) => (
            <View key={r} style={sk.attRow}>
              <View style={sk.attNameCell}>
                <Bone width={32} height={32} radius={16} />
                <View style={{ gap: 5 }}>
                  <Bone width={100} height={11} radius={4} />
                  <Bone width={60}  height={9}  radius={3} />
                </View>
              </View>
              {Array.from({ length: 10 }).map((_, c) => (
                <Bone key={c} width={36} height={32} radius={6} />
              ))}
            </View>
          ))}
        </View>
      );

    default:
      return null;
  }
};

const sk = StyleSheet.create({
  wrap:    { gap: 4 },
  textWrap:{ gap: 0 },

  // Table
  tableHead:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 },
  tableRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, marginBottom: 3, borderWidth: 1, borderColor: '#F1F5F9' },
  rowProduct:    { flex: 3, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowProductText:{ flex: 1, gap: 4 },

  // Card
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap' as any },
  card:     { backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  cardTop:  { flexDirection: 'row', alignItems: 'center', gap: 12 },

  // Sidebar
  sidebarWrap:       { padding: 14, gap: 10 },
  sidebarSection:    { gap: 4 },
  sidebarSectionHead:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  divider:           { height: 1, backgroundColor: '#F1F5F9', marginVertical: 8 },

  // Stats
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Attendance
  attHead:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#F8FAFC', borderRadius: 8, marginBottom: 4 },
  attRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFF', borderRadius: 8, marginBottom: 3 },
  attNameCell:{ width: 160, flexDirection: 'row', alignItems: 'center', gap: 8 },
});

export { Bone };
export default SkeletonLoading;