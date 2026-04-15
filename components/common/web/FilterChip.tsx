/**
 * components/common/web/FilterChip.tsx
 * Chip pill untuk filter sidebar web.
 * Dipakai di FilterSectionWeb, AttendanceSidebarWeb, dll.
 */
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { COLORS } from '@constants/colors';

interface Props {
  label:        string;
  sublabel?:    string;
  active:       boolean;
  activeColor?: string;
  icon?:        React.ReactNode;
  onPress:      () => void;
}

const FilterChip: React.FC<Props> = ({
  label, sublabel, active, activeColor, icon, onPress,
}) => {
  const bg     = active ? (activeColor ?? COLORS.secondary) : '#F8FAFC';
  const border = active ? (activeColor ?? COLORS.secondary) : '#E2E8F0';

  return (
    <TouchableOpacity
      style={[s.chip, { backgroundColor: bg, borderColor: border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {icon && <View style={s.icon}>{icon}</View>}
      <Text style={[s.label, active && s.labelActive]} numberOfLines={1}>
        {label}
        {sublabel
          ? <Text style={[s.sub, active && s.subActive]}> {sublabel}</Text>
          : null}
      </Text>
      {active && <Text style={s.check}>✓</Text>}
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  chip:        { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 6, gap: 6, cursor: 'pointer' as any },
  icon:        { width: 16, alignItems: 'center' },
  label:       { flex: 1, fontSize: 12, fontFamily: 'PoppinsMedium', color: '#374151' },
  labelActive: { color: '#FFF', fontFamily: 'PoppinsSemiBold' },
  sub:         { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  subActive:   { color: 'rgba(255,255,255,0.7)' },
  check:       { fontSize: 11, color: '#FFF', fontFamily: 'PoppinsBold' },
});

export default FilterChip;