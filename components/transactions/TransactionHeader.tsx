import React from 'react';
import { View, Text, StyleSheet } from 'react-native';  // ← Tambahkan StyleSheet di sini
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { styles, COLORS } from './styles';

interface Props {
  isAdmin: boolean;
}

export const TransactionHeader: React.FC<Props> = ({ isAdmin }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <LinearGradient 
        colors={[COLORS.primary, '#2c537a']} 
        style={StyleSheet.absoluteFill}  // Sekarang sudah dikenali
      />
      <Text style={styles.title}>Laporan Penjualan</Text>
      <Text style={styles.subtitle}>
        {isAdmin ? 'Semua Transaksi Kasir' : 'Transaksi Saya'}
      </Text>
    </View>
  );
};