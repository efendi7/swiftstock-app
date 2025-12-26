import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';

interface StatsGridHeaderProps {
  icon: ReactNode;
  title: string;
  dateLabel?: string;
  variant?: 'default' | 'compact';
}

export const StatsGridHeader: React.FC<StatsGridHeaderProps> = ({ 
  icon, title, dateLabel, variant = 'default' 
}) => (
  <View style={variant === 'compact' ? styles.headerCompact : styles.headerDefault}>
    <View style={styles.iconBox}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>{title}</Text>
      {dateLabel && <Text style={styles.date}>{dateLabel}</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  headerDefault: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerCompact: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: { padding: 8, backgroundColor: '#E8F5F3', borderRadius: 12, marginRight: 10 },
  title: { fontSize: 15, fontFamily: 'PoppinsSemiBold', color: COLORS.textDark },
  date: { fontSize: 11, fontFamily: 'PoppinsRegular', color: COLORS.textLight, marginTop: 1 },
});