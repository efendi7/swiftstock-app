// components/products/ProductCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { Product } from '../../types/product.types';

interface Props {
  item: Product;
}

const ProductCard = ({ item }: Props) => {
  const margin = item.price - item.purchasePrice;
  const isProfit = margin >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.category}>Kategori: {item.category || 'Tanpa Kategori'}</Text>
          <Text style={styles.supplier}>Pemasok: {item.supplier || 'Umum'}</Text>
          <Text style={styles.barcode}>Code: {item.barcode}</Text>
        </View>
        <View style={[styles.stockBadge, { backgroundColor: item.stock < 10 ? COLORS.danger : COLORS.success }]}>
          <Text style={styles.stockText}>{item.stock}</Text>
        </View>
      </View>

      <View style={styles.priceSection}>
        <View>
          <Text style={styles.label}>Harga Beli</Text>
          <Text style={styles.purchasePrice}>Rp {item.purchasePrice.toLocaleString('id-ID')}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.label}>Harga Jual</Text>
          <Text style={styles.sellPrice}>Rp {item.price.toLocaleString('id-ID')}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.date}>
          {item.createdAt?.toDate?.().toLocaleDateString('id-ID') || '-'}
        </Text>
        <View style={[styles.profitBadge, { backgroundColor: isProfit ? '#E8F5E9' : '#FFEBEE' }]}>
          <Text style={[styles.profitText, { color: isProfit ? COLORS.success : COLORS.danger }]}>
            {isProfit ? 'Untung' : 'Rugi'}: Rp {Math.abs(margin).toLocaleString('id-ID')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 24,
    marginBottom: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: 'bold', color: COLORS.textDark },
  category: { fontSize: 13, color: COLORS.secondary, marginTop: 4, fontWeight: '600' },
  supplier: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  barcode: { fontSize: 11, color: COLORS.textLight, marginTop: 4 },
  stockBadge: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  stockText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  priceSection: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F1F5F9' },
  label: { fontSize: 10, color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  purchasePrice: { fontSize: 15, color: COLORS.textDark, fontWeight: '600', marginTop: 4 },
  sellPrice: { fontSize: 16, color: COLORS.secondary, fontWeight: 'bold', marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  date: { fontSize: 11, color: COLORS.textLight },
  profitBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  profitText: { fontSize: 12, fontWeight: 'bold' },
});

export default ProductCard;