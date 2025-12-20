import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './transactionStyles';

export const InfoRow = ({ label, value, icon }: any) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <View style={styles.infoValueContainer}>
      {icon}
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

export const Divider = () => <View style={styles.divider} />;