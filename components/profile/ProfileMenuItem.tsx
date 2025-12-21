import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

interface ProfileMenuItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLast?: boolean;
}

export const ProfileMenuItem = ({ icon, label, value, isLast }: ProfileMenuItemProps) => (
  <View style={[styles.menuItem, isLast && styles.menuItemLast]}>
    <View style={styles.menuLeft}>
      {icon}
      <Text style={styles.menuLabel}>{label}</Text>
    </View>
    <View style={styles.valueWrapper}>
      <Text style={styles.menuValue} numberOfLines={1} ellipsizeMode="tail">
        {value}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 14, fontFamily: 'PoppinsMedium', color: '#333' },
  valueWrapper: { flex: 1, marginLeft: 20 },
  menuValue: { 
    fontSize: 14, 
    color: COLORS.textLight, 
    textAlign: 'right', 
    fontFamily: 'PoppinsRegular' 
  },
});