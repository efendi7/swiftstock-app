/**
 * components/common/web/SidebarSection.tsx
 * Collapsible section untuk sidebar filter web.
 * Dipakai di FilterSectionWeb, AttendanceSidebarWeb, dll.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { COLORS } from '@constants/colors';

interface Props {
  title:     string;
  isOpen:    boolean;
  onToggle:  () => void;
  hasActive: boolean;
  onReset:   () => void;
  children:  React.ReactNode;
}

const SidebarSection: React.FC<Props> = ({
  title, isOpen, onToggle, hasActive, onReset, children,
}) => (
  <View style={s.wrap}>
    <TouchableOpacity style={s.head} onPress={onToggle} activeOpacity={0.7}>
      <View style={s.left}>
        <Text style={s.title}>{title}</Text>
        {hasActive && <View style={s.dot} />}
      </View>
      <View style={s.right}>
        {hasActive && (
          <TouchableOpacity onPress={onReset} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Text style={s.resetTxt}>Reset</Text>
          </TouchableOpacity>
        )}
        {isOpen
          ? <ChevronUp   size={12} color="#94A3B8" />
          : <ChevronDown size={12} color="#94A3B8" />}
      </View>
    </TouchableOpacity>
    {isOpen && children && <View style={s.body}>{children}</View>}
  </View>
);

const s = StyleSheet.create({
  wrap:     { marginBottom: 10 },
  head:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, cursor: 'pointer' as any },
  left:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  right:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title:    { fontSize: 10, fontFamily: 'PoppinsBold', color: '#64748B', textTransform: 'uppercase' as any, letterSpacing: 0.5 },
  dot:      { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.secondary },
  resetTxt: { fontSize: 9, fontFamily: 'PoppinsMedium', color: '#EF4444' },
  body:     { gap: 4 },
});

export default SidebarSection;