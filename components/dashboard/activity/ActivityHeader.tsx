import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock } from 'lucide-react-native';
import { COLORS } from '../../../constants/colors';

interface ActivityHeaderProps {
  title: string;
  onSeeMore?: () => void;
  hasData: boolean;
}

export const ActivityHeader = ({ title, onSeeMore, hasData }: ActivityHeaderProps) => (
  <View style={styles.header}>
    <View style={styles.titleRow}>
      <View style={styles.iconWrapper}>
        <Clock size={14} color={COLORS.secondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
    {onSeeMore && hasData && (
      <TouchableOpacity onPress={onSeeMore} style={styles.filterBtn} activeOpacity={0.7}>
        <Text style={styles.filterText}>Lihat Semua</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 18,
    borderBottomWidth: 1, 
    borderBottomColor: '#F5F5F5', 
    paddingBottom: 10 
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrapper: {
    backgroundColor: `${COLORS.secondary}15`,
    padding: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: COLORS.textDark },
  filterBtn: { backgroundColor: '#F0F9F8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  filterText: { fontSize: 10, color: COLORS.primary, fontFamily: 'PoppinsMedium' },
});