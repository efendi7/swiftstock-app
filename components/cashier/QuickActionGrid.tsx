import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';

interface QuickActionProps {
  onStartSale: () => void;
  onHistory: () => void;
}

export const QuickActionGrid = ({ onStartSale, onHistory }: QuickActionProps) => {
  return (
    <View style={styles.grid}>
      {/* Start Sale Button */}
      <TouchableOpacity 
        style={styles.card} 
        onPress={onStartSale} 
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.success, COLORS.success + 'CC']}
          style={styles.gradient}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.emoji}>🏪</Text>
          </View>
          <Text style={styles.cardTitle}>Mulai Penjualan</Text>
          <View style={styles.arrowBadge}>
            <Text style={styles.arrow}>›</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* History Button */}
      <TouchableOpacity 
        style={styles.card} 
        onPress={onHistory} 
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.secondary, COLORS.secondary + 'CC']}
          style={styles.gradient}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.emoji}>📊</Text>
          </View>
          <Text style={styles.cardTitle}>Riwayat Transaksi</Text>
          <View style={styles.arrowBadge}>
            <Text style={styles.arrow}>›</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 10,
  },
  card: {
    flex: 1,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  gradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  arrowBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -2,
  },
});