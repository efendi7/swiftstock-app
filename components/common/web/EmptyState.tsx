/**
 * components/common/web/EmptyState.tsx
 * Empty state generik dengan icon bulat + pesan teks.
 * Dipakai di ProductListWeb, CashierListWeb, AttendanceManagementWeb, dll.
 *
 * Cara pakai:
 *   <EmptyState icon={<PackageSearch size={48} color="#94A3B8" />} message="Belum ada produk" />
 *   <EmptyState icon={<Users size={48} color="#94A3B8" />} message="Tidak ada kasir" color="#94A3B8" />
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  icon:      React.ReactNode;
  message:   string;
  color?:    string;
  /** Sub-teks kecil di bawah pesan (opsional) */
  subtext?:  string;
}

const EmptyState: React.FC<Props> = ({
  icon, message, color = '#94A3B8', subtext,
}) => (
  <View style={s.wrap}>
    <View style={[s.circle, { backgroundColor: color + '18' }]}>
      {icon}
    </View>
    <Text style={[s.msg, { color }]}>{message}</Text>
    {subtext && <Text style={s.sub}>{subtext}</Text>}
  </View>
);

const s = StyleSheet.create({
  wrap:   { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, gap: 12 },
  circle: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  msg:    { fontSize: 15, fontFamily: 'PoppinsBold', textAlign: 'center' as any, maxWidth: 280 },
  sub:    { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#94A3B8', textAlign: 'center' as any, maxWidth: 260, marginTop: -4 },
});

export default EmptyState;