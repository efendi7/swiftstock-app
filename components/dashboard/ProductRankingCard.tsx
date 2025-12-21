import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowUpDown, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { ProductStat } from '../../types/dashboard.types';

interface Props {
  title: string;
  data: ProductStat[];
  unit: string;
  color: string;
  onSeeMore?: () => void; // Tambahkan prop ini
}

export const ProductRankingCard: React.FC<Props> = ({ title, data, unit, color, onSeeMore }) => {
  const isStockAlert = title.toLowerCase().includes('stok') || title.toLowerCase().includes('rendah');
  const [isAsc, setIsAsc] = useState(isStockAlert);

  // Sorting lokal
  const sortedData = [...data]
    .sort((a, b) => (isAsc ? a.value - b.value : b.value - a.value))
    .slice(0, 10);

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setIsAsc(!isAsc)}>
          <ArrowUpDown size={14} color={COLORS.primary} />
          <Text style={styles.filterText}>{isAsc ? 'Terendah ↑' : 'Tertinggi ↓'}</Text>
        </TouchableOpacity>
      </View>

      {sortedData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Belum ada data periode ini</Text>
        </View>
      ) : (
        <>
          {sortedData.map((item, index) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{index + 1}. {item.name}</Text>
                <Text style={styles.itemValue}>{item.value} {unit}</Text>
              </View>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.barFill, 
                    { width: `${(item.value / maxValue) * 100}%`, backgroundColor: color }
                  ]} 
                />
              </View>
            </View>
          ))}

          {/* Tombol Lihat Selengkapnya (Hanya muncul jika prop onSeeMore ada) */}
          {onSeeMore && (
            <TouchableOpacity style={styles.seeMoreBtn} onPress={onSeeMore}>
              <Text style={styles.seeMoreText}>Lihat Selengkapnya</Text>
              <ChevronRight size={14} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', paddingBottom: 10 },
  title: { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: COLORS.textDark },
  filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9F8', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  filterText: { fontSize: 10, marginLeft: 5, color: COLORS.primary, fontFamily: 'PoppinsMedium' },
  itemRow: { marginBottom: 14 },
  itemInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  itemName: { fontSize: 12, fontFamily: 'PoppinsRegular', color: COLORS.textDark, flex: 1, marginRight: 10 },
  itemValue: { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: COLORS.textDark },
  barContainer: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, width: '100%', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  emptyContainer: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { color: COLORS.textLight, fontSize: 12, fontFamily: 'PoppinsRegular' },
  
  // Style baru untuk tombol See More
  seeMoreBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 10, 
    paddingTop: 15, 
    borderTopWidth: 1, 
    borderTopColor: '#F5F5F5' 
  },
  seeMoreText: { 
    fontSize: 12, 
    color: COLORS.primary, 
    fontFamily: 'PoppinsMedium', 
    marginRight: 4 
  }
});