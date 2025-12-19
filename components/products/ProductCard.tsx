// components/products/ProductCard.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Package, AlertCircle, X } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Product } from '../../types/product.types';

interface Props {
  item: Product;
}

const ProductCard = ({ item }: Props) => {
  const [modalVisible, setModalVisible] = useState(false);
  const isLowStock = item.stock < 10;
  const margin = item.price - item.purchasePrice;
  const isProfit = margin >= 0;

  return (
    <>
      <TouchableOpacity 
        style={styles.card}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          {isLowStock ? (
            <AlertCircle size={24} color={COLORS.danger} />
          ) : (
            <Package size={24} color={COLORS.success} />
          )}
        </View>
        
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <View style={styles.stockContainer}>
            <Text style={[styles.stockText, { color: isLowStock ? COLORS.danger : COLORS.success }]}>
              {isLowStock ? 'Stok Menipis' : 'Stok Aman'}
            </Text>
            <Text style={styles.stockNumber}>• {item.stock} unit</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Modal Detail */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Produk</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Nama Produk</Text>
                <Text style={styles.detailValue}>{item.name}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Kode Produk</Text>
                <Text style={styles.detailValue}>{item.barcode}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Kategori</Text>
                <Text style={styles.detailValue}>{item.category || 'Tanpa Kategori'}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Pemasok</Text>
                <Text style={styles.detailValue}>{item.supplier || 'Umum'}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Stok Tersedia</Text>
                <View style={[styles.stockBadge, { backgroundColor: isLowStock ? COLORS.danger : COLORS.success }]}>
                  <Text style={styles.stockBadgeText}>{item.stock} unit</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Harga Beli</Text>
                <Text style={styles.priceValue}>Rp {item.purchasePrice.toLocaleString('id-ID')}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Harga Jual</Text>
                <Text style={[styles.priceValue, styles.sellPrice]}>Rp {item.price.toLocaleString('id-ID')}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Margin</Text>
                <View style={[styles.profitBadge, { backgroundColor: isProfit ? '#E8F5E9' : '#FFEBEE' }]}>
                  <Text style={[styles.profitText, { color: isProfit ? COLORS.success : COLORS.danger }]}>
                    {isProfit ? 'Untung' : 'Rugi'}: Rp {Math.abs(margin).toLocaleString('id-ID')}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Tanggal Dibuat</Text>
                <Text style={styles.detailValue}>
                  {item.createdAt?.toDate?.().toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  }) || '-'}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 13,
    fontWeight: '600',
  },
  stockNumber: {
    fontSize: 13,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 18,
    color: COLORS.textDark,
    fontWeight: 'bold',
  },
  sellPrice: {
    color: COLORS.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  stockBadgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  profitBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  profitText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
});

export default ProductCard;