import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Package, ArrowUpRight, ClipboardList, ShoppingBag } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

const { width } = Dimensions.get('window');
const PADDING_SCREEN = 40; 
const GAP = 12;
// Disesuaikan menjadi 2 kolom agar lebih proporsional
const CARD_WIDTH = (width - PADDING_SCREEN - GAP) / 2;

interface StatsGridProps {
  totalProducts: number;
  outToday: number;
}

export const StatsGrid: React.FC<StatsGridProps> = React.memo(
  ({ totalProducts, outToday }) => {
    return (
      <View style={styles.container}>
        <View style={styles.headerTitle}>
          <ClipboardList size={18} color={COLORS.textDark} style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Ringkasan Penjualan</Text>
        </View>

        <View style={styles.gridContainer}>
          {/* Total Produk */}
          <View style={styles.statCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#eff6ff' }]}>
               <Package size={16} color="#3b82f6" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.statValue}>{totalProducts}</Text>
              <Text style={styles.statLabel}>Total Produk</Text>
            </View>
          </View>

          {/* Stok Keluar Hari Ini */}
          <View style={styles.statCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#fef2f2' }]}>
               <ArrowUpRight size={16} color="#ef4444" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.statValue}>{outToday}</Text>
              <Text style={styles.statLabel}>Stok Keluar Hari Ini</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: { width: '100%', marginVertical: 10 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  gridContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%' 
  },
  statCard: {
    backgroundColor: '#FFF',
    width: CARD_WIDTH,
    height: 75,
    borderRadius: 15,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: { marginLeft: 10, flex: 1 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },
  statLabel: { 
    fontSize: 10, 
    color: COLORS.textLight, 
    marginTop: 2, 
    lineHeight: 12 
  },
});