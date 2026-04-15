/**
 * ProductRankingCard.tsx
 * Produk Terlaris + Stok Kritis dalam 1 card dengan tab toggle
 * Max 5 produk per tab
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ShoppingBag, AlertTriangle, ChevronRight } from 'lucide-react-native';
import { COLORS } from '@constants/colors';

interface ProductStat {
  id:    string;
  name:  string;
  value: number;
}

interface Props {
  salesRanking:  ProductStat[];
  stockRanking:  ProductStat[];
  isLoading?:    boolean;
  onSeeMoreSales?:  () => void;
  onSeeMoreStock?:  () => void;
}

type Tab = 'sales' | 'stock';

const _ProductRankingCard: React.FC<Props> = ({
  salesRanking, stockRanking, isLoading,
  onSeeMoreSales, onSeeMoreStock,
}) => {
  const [tab, setTab] = useState<Tab>('sales');

  const isSales  = tab === 'sales';
  const data     = (isSales ? salesRanking : stockRanking).slice(0, 5);
  const maxVal   = Math.max(...data.map(d => d.value), 1);
  const unit     = isSales ? 'terjual' : 'sisa';
  const barColor = isSales ? COLORS.secondary : '#EF4444';
  const onSeeMore = isSales ? onSeeMoreSales : onSeeMoreStock;

  return (
    <View style={styles.container}>

      {/* Header + tabs */}
      <View style={styles.header}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, isSales && styles.tabActive]}
            onPress={() => setTab('sales')}
          >
            <ShoppingBag
              size={12}
              color={isSales ? COLORS.secondary : COLORS.textLight}
            />
            <Text style={[styles.tabTxt, isSales && { color: COLORS.secondary }]}>
              Terlaris
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, !isSales && styles.tabActiveRed]}
            onPress={() => setTab('stock')}
          >
            <AlertTriangle
              size={12}
              color={!isSales ? '#EF4444' : COLORS.textLight}
            />
            <Text style={[styles.tabTxt, !isSales && { color: '#EF4444' }]}>
              Stok Kritis
            </Text>
          </TouchableOpacity>
        </View>

        {onSeeMore && (
          <TouchableOpacity style={styles.seeMore} onPress={onSeeMore}>
            <Text style={styles.seeMoreTxt}>Lihat semua</Text>
            <ChevronRight size={12} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <View style={styles.list}>
        {data.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTxt}>
              {isSales ? 'Belum ada penjualan' : 'Tidak ada stok kritis'}
            </Text>
          </View>
        ) : (
          data.map((item, i) => {
            const barW = Math.max((item.value / maxVal) * 100, 4);
            return (
              <View key={item.id} style={styles.item}>
                {/* Rank */}
                <Text style={[
                  styles.rank,
                  i === 0 && { color: barColor, fontFamily: 'PoppinsBold' },
                ]}>
                  {i + 1}
                </Text>
                {/* Name + bar */}
                <View style={styles.itemMain}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.val, { color: barColor }]}>
                      {item.value.toLocaleString('id-ID')} {unit}
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[
                      styles.barFill,
                      {
                        width: `${barW}%` as any,
                        backgroundColor: barColor,
                        opacity: 0.25 + (i === 0 ? 0.75 : (1 - i / data.length) * 0.55),
                      },
                    ]} />
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  tabs:     { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 3, gap: 2 },
  tab:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  tabActive:    { backgroundColor: COLORS.secondary + '18' },
  tabActiveRed: { backgroundColor: '#FEF2F2' },
  tabTxt:   { fontSize: 11, fontFamily: 'PoppinsMedium', color: COLORS.textLight },

  seeMore:    { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeMoreTxt: { fontSize: 10, fontFamily: 'PoppinsMedium', color: COLORS.primary },

  list:  { gap: 10 },
  empty: { paddingVertical: 24, alignItems: 'center' },
  emptyTxt: { fontSize: 12, fontFamily: 'PoppinsMedium', color: COLORS.textLight },

  item:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rank:     { width: 16, fontSize: 11, fontFamily: 'PoppinsMedium', color: COLORS.textLight, textAlign: 'center' },
  itemMain: { flex: 1, gap: 4 },
  nameRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name:     { flex: 1, fontSize: 12, fontFamily: 'PoppinsMedium', color: COLORS.textDark, marginRight: 8 },
  val:      { fontSize: 11, fontFamily: 'PoppinsBold' },
  barTrack: { height: 4, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  barFill:  { height: 4, borderRadius: 4 },
});

export const ProductRankingCard = React.memo(_ProductRankingCard);
export default ProductRankingCard;