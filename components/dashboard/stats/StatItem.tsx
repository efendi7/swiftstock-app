import React, { ReactNode } from 'react';
import { View, Text, TextStyle, StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';
import { StatIcon } from './StatIcon';

interface StatItemProps {
  icon: ReactNode;
  iconBgColor: string;
  value: number | string;
  label: string;
  width?: number;
  compact?: boolean;
  valueStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export const StatItem: React.FC<StatItemProps> = ({
  icon, iconBgColor, value, label, width, compact, valueStyle, labelStyle
}) => (
  <View style={[styles.container, width ? { width } : {}, compact && styles.compact]}>
    <StatIcon 
      icon={icon} 
      backgroundColor={iconBgColor} 
      size={compact ? 24 : 28} 
      style={!compact ? { marginTop: 2 } : undefined}
    />
    <View style={styles.textContainer}>
      <Text style={[styles.value, compact && styles.valueCompact, valueStyle]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.label, compact && styles.labelCompact, labelStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start' },
  compact: { alignItems: 'center' },
  textContainer: { marginLeft: 8, flex: 1 },
  value: { fontSize: 13, fontFamily: 'PoppinsBold', color: COLORS.textDark, lineHeight: 16, letterSpacing: -0.4 },
  valueCompact: { fontSize: 12, lineHeight: 15 },
  label: { fontSize: 8, fontFamily: 'PoppinsRegular', color: COLORS.textLight, lineHeight: 10 },
  labelCompact: { fontSize: 7.5, lineHeight: 9.5 },
});