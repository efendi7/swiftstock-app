import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Image } from 'react-native';
import { Package, AlertCircle, X, ChevronRight, Info } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Product } from '../../models/Product';

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
        activeOpacity={0.8}
      >
        {/* GAMBAR PRODUK (DI KIRI) */}
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: isLowStock ? '#FFF5F5' : '#F0F9FF' }]}>
              <Package size={24} color={isLowStock ? COLORS.danger : COLORS.primary} />
            </View>
          )}
        </View>
        
        <View style={styles.content}>
          <Text style={styles.categoryText}>{item.category || 'Tanpa Kategori'}</Text>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          
          <View style={styles.footerRow}>
            <Text style={styles.priceText}>Rp {item.price.toLocaleString('id-ID')}</Text>
            <View style={[styles.stockBadgeSmall, { backgroundColor: isLowStock ? '#FFF5F5' : '#F0FDF4' }]}>
              <View style={[styles.dot, { backgroundColor: isLowStock ? COLORS.danger : COLORS.success }]} />
              <Text style={[styles.stockValue, { color: isLowStock ? COLORS.danger : COLORS.success }]}>
                {item.stock} unit
              </Text>
            </View>
          </View>
        </View>

        <ChevronRight size={18} color="#CBD5E1" />
      </TouchableOpacity>

      {/* MODAL DETAIL PRODUK */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Produk</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* HERO IMAGE DI MODAL */}
              <View style={styles.modalHero}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.imageLarge} resizeMode="cover" />
                ) : (
                  <View style={styles.imageLargePlaceholder}>
                    <Package size={60} color="#E2E8F0" />
                    <Text style={{ color: '#94A3B8', marginTop: 10 }}>Tidak ada foto</Text>
                  </View>
                )}
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.mCategory}>{item.category}</Text>
                <Text style={styles.mName}>{item.name}</Text>
                <Text style={styles.mBarcode}>{item.barcode}</Text>

                <View style={styles.priceCard}>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Harga Jual</Text>
                    <Text style={styles.priceValMain}>Rp {item.price.toLocaleString('id-ID')}</Text>
                  </View>
                  <View style={styles.dividerVert} />
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Harga Beli</Text>
                    <Text style={styles.priceValSub}>Rp {item.purchasePrice.toLocaleString('id-ID')}</Text>
                  </View>
                </View>

                {/* INFO LIST */}
                <View style={styles.infoList}>
                  <InfoRow label="Pemasok" value={item.supplier || 'Umum'} />
                  <InfoRow label="Stok" value={`${item.stock} Unit`} color={isLowStock ? COLORS.danger : COLORS.success} />
                  <InfoRow 
                    label="Margin Keuntungan" 
                    value={`Rp ${margin.toLocaleString('id-ID')}`} 
                    color={isProfit ? COLORS.success : COLORS.danger} 
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

// Komponen Helper untuk Baris Info
const InfoRow = ({ label, value, color = COLORS.textDark }: any) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    // Shadow halus
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 14,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'PoppinsSemiBold',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontFamily: 'PoppinsBold',
    color: '#1E293B',
    marginBottom: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  priceText: {
    fontSize: 14,
    fontFamily: 'PoppinsBold',
    color: COLORS.secondary,
  },
  stockBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  stockValue: {
    fontSize: 11,
    fontFamily: 'PoppinsSemiBold',
  },

  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'PoppinsBold',
    color: '#1E293B',
  },
  closeBtn: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 12,
  },
  modalHero: {
    width: '90%',
    height: 200,
    alignSelf: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  imageLarge: {
    width: '100%',
    height: '100%',
  },
  imageLargePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 24,
  },
  mCategory: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: 'PoppinsBold',
    textTransform: 'uppercase',
  },
  mName: {
    fontSize: 22,
    fontFamily: 'PoppinsBold',
    color: '#1E293B',
    marginTop: 4,
  },
  mBarcode: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'PoppinsRegular',
    marginBottom: 20,
  },
  priceCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  dividerVert: {
    width: 1,
    backgroundColor: '#E2E8F0',
    height: '100%',
  },
  priceLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  priceValMain: {
    fontSize: 16,
    fontFamily: 'PoppinsBold',
    color: COLORS.secondary,
  },
  priceValSub: {
    fontSize: 16,
    fontFamily: 'PoppinsBold',
    color: '#1E293B',
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'PoppinsRegular',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#1E293B',
  },
});

export default ProductCard;