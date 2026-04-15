/**
 * components/common/StatsToolbar.tsx
 * Toolbar berisi stat chips + slot tombol aksi kanan.
 * Reusable di ProductScreenWeb, AttendanceManagementWeb, CashierManagementWeb, dll.
 *
 * Cara pakai:
 *   <StatsToolbar
 *     stats={[
 *       { icon: <Package size={14} color={COLORS.primary} />, value: 120, label: 'Total', bg: '...', color: '...' },
 *     ]}
 *     right={<TouchableOpacity ...><Text>Tambah</Text></TouchableOpacity>}
 *   />
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface StatItem {
  icon:   React.ReactNode;
  value:  string | number;
  label:  string;
  bg:     string;
  color:  string;
}

interface Props {
  stats:  StatItem[];
  right?: React.ReactNode;   // tombol aksi di kanan (opsional)
  extra?: React.ReactNode;   // slot tambahan di tengah (opsional)
}

const StatsToolbar: React.FC<Props> = ({ stats, right, extra }) => (
  <View style={s.wrap}>
    <View style={s.left}>
      {stats.map((st, i) => (
        <View key={i} style={[s.chip, { backgroundColor: st.bg }]}>
          {st.icon}
          <Text style={[s.val, { color: st.color }]}>{st.value}</Text>
          <Text style={[s.lbl, { color: st.color }]}>{st.label}</Text>
        </View>
      ))}
      {extra}
    </View>
    {right && <View style={s.right}>{right}</View>}
  </View>
);

const s = StyleSheet.create({
  wrap:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 11, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 12 },
  left:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' as any, flex: 1 },
  right: { flexShrink: 0 },
  chip:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  val:   { fontSize: 13, fontFamily: 'PoppinsBold' },
  lbl:   { fontSize: 11, fontFamily: 'PoppinsRegular' },
});

export default StatsToolbar;
export type { Props as StatsToolbarProps };