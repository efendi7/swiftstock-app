import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Edit2, Package, AlertTriangle, TrendingUp } from 'lucide-react-native';
import { Product } from '../../types/product.types';

interface ProductCardProps {
  product: Product & { sold?: number };
  onEditPress: (product: Product) => void;
  isAdmin?: boolean;
  isTopSeller?: boolean; // ✅ Prop untuk menandai produk top 10
  topRank?: number; // ✅ Ranking (1-10) untuk ditampilkan
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onEditPress, 
  isAdmin = false,
  isTopSeller = false,
  topRank
}) => {
  const isLowStock = product.stock < 10;

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onEditPress(product)}
      activeOpacity={0.8}
    >
      {/* IMAGE CONTAINER - 75x75 */}
      <View style={styles.imageContainer}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Package size={24} color="#CBD5E1" />
          </View>
        )}
        
        {/* ✅ LABEL TOP SELLER (Menimpa image di kiri atas) */}
        {isTopSeller && (
          <View style={styles.topSellerBadge}>
            <Text style={styles.topSellerText}>
              {topRank ? `#${topRank}` : 'TOP'}
            </Text>
          </View>
        )}
      </View>

      {/* CONTENT AREA - SPLIT KIRI & KANAN */}
      <View style={styles.contentWrapper}>
        
        {/* KIRI: Nama, Barcode, Harga */}
        <View style={styles.leftContent}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>
          
          <Text style={styles.barcodeText} numberOfLines={1}>
            {product.barcode}
          </Text>
          
          <Text style={styles.priceText}>
            Rp {product.price.toLocaleString('id-ID')}
          </Text>
        </View>

        {/* KANAN: Badge Stok, Terjual, Edit */}
        <View style={styles.rightContent}>
          
          {/* BADGE STOK + WARNING */}
          <View style={[
            styles.stockBadge, 
            { backgroundColor: isLowStock ? '#FEE2E2' : '#ECFDF5' }
          ]}>
            <Package size={10} color={isLowStock ? '#EF4444' : '#10B981'} />
            <Text style={[styles.stockText, { color: isLowStock ? '#EF4444' : '#10B981' }]}>
              {product.stock}
            </Text>
            {isLowStock && <AlertTriangle size={8} color="#EF4444" />}
          </View>

          {/* BADGE TERJUAL */}
          <View style={styles.soldBadge}>
            <TrendingUp size={10} color="#64748B" />
            <Text style={styles.soldText}>{product.sold || 0}</Text>
          </View>

          {/* TOMBOL EDIT (Icon Only) */}
          {isAdmin && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={(e) => {
                e.stopPropagation();
                onEditPress(product);
              }}
              activeOpacity={0.7}
            >
              <Edit2 size={14} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
 card: {
  backgroundColor: '#FFF',
  padding: 16,               // Ubah dari 12 ke 16 agar sama
  borderRadius: 20,
  marginBottom: 12,
  flexDirection: 'row',
  alignItems: 'center',
  // height: 99,             // HAPUS INI agar tinggi dinamis
  borderWidth: 1,
  borderColor: '#F1F5F9',
  // HAPUS SHADOW/ELEVATION agar tidak berbeda kedalamannya
},
  imageContainer: {
    width: 75,
    height: 75,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative', // ✅ Untuk absolute positioning badge
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // WRAPPER: SPLIT KIRI & KANAN
  contentWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    height: 75, // Sama dengan tinggi image
  },
  
  // KONTEN KIRI
  leftContent: {
    flex: 1,
    justifyContent: 'space-between',
    height: '100%',
    marginRight: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 18,
  },
  barcodeText: {
    fontSize: 10,
    color: '#94A3B8',
    lineHeight: 14,
    marginTop: 2,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
    marginTop: 'auto', // Push ke bawah
  },
  
  // KONTEN KANAN
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    gap: 4,
  },
  
  // BADGE STOK
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 9,
    fontWeight: '600',
  },
  
  // BADGE TERJUAL
  soldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  soldText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
  },
  
  // TOMBOL EDIT (Icon Only)
  editButton: {
    width: 28,
    height: 28,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto', // Push ke bawah
  },
  
  // ✅ BADGE TOP SELLER (Menimpa image kiri atas)
  topSellerBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#F59E0B', // Gold/Orange
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  topSellerText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },
});

export default ProductCard;