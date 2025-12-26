import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';
import { StatIcon } from './StatIcon';

interface StatCardProps {
  icon: ReactNode;
  iconBgColor: string;
  value: number | string;
  label: string;
  width?: number;
  height?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  icon, iconBgColor, value, label, width, height = 70 
}) => (
  <View style={[styles.card, width ? { width } : {}, { height }]}>
    <StatIcon icon={icon} backgroundColor={iconBgColor} size={36} />
    <View style={styles.textContainer}>
      <Text style={styles.value} numberOfLines={1}>{value}</Text>
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f5f5f5',
    elevation: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  textContainer: { marginLeft: 10, flex: 1, justifyContent: 'center' },
  value: { fontSize: 15, fontFamily: 'PoppinsBold', color: COLORS.textDark, lineHeight: 19 },
  label: { fontSize: 9, fontFamily: 'PoppinsRegular', color: COLORS.textLight, marginTop: 1, lineHeight: 11 },
});