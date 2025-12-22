import React from 'react';
import { FlatList, Text, StyleSheet, View } from 'react-native';
import ProductCard from './ProductCard';
import { Product } from '../../types/product.types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Import Icon yang sesuai
import { PackageSearch, Smile, Frown, CheckCircle2, AlertCircle } from 'lucide-react-native';

interface Props {
  data: Product[];
  refreshing: boolean;
  onRefresh: () => void;
  onEditPress: (product: Product) => void;
  isAdmin?: boolean;
  sortType?: string; 
}

const ProductList = ({ data, refreshing, onRefresh, onEditPress, isAdmin = false, sortType }: Props) => {
  const insets = useSafeAreaInsets();

  const renderEmptyComponent = () => {
    let message = "Belum ada produk. Tambah produk baru!";
    let Icon = PackageSearch;
    let iconColor = "#94A3B8";

    // KONDISI 1: Filter STOK AMAN diklik, tapi hasilnya kosong (Artinya semua kritis/habis)
    if (sortType === 'stock-safe' && data.length === 0) {
      message = "Semua stok Anda sedang kritis atau habis!";
      Icon = Frown; // Sad Emote
      iconColor = "#EF4444"; // Merah
    } 
    // KONDISI 2: Filter STOK KRITIS diklik, tapi kosong (Artinya aman)
    else if (sortType === 'stock-critical' && data.length === 0) {
      message = "Luar biasa! Tidak ada stok yang kritis.";
      Icon = Smile; // Happy Emote
      iconColor = "#22C55E"; // Hijau
    }
    // KONDISI 3: Filter STOK HABIS diklik, tapi kosong (Artinya aman tersedia)
    else if (sortType === 'stock-empty' && data.length === 0) {
      message = "Semua stok Anda aman tersedia!";
      Icon = Smile; // Happy Emote
      iconColor = "#22C55E"; // Hijau
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.iconCircle, { backgroundColor: iconColor + '15' }]}>
          <Icon size={50} color={iconColor} strokeWidth={2} />
        </View>
        <Text style={[styles.emptyText, { color: iconColor }]}>
          {message}
        </Text>
      </View>
    );
  };

  return (
    <FlatList<Product>
      data={data}
      renderItem={({ item }) => (
        <ProductCard 
          product={item} 
          onEditPress={onEditPress}
          isAdmin={isAdmin}
          isTopSeller={(item as any).isTopSeller}
          topRank={(item as any).topRank}
        />
      )}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingBottom: insets.bottom + 100,
          paddingTop: 20,
        },
      ]}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={renderEmptyComponent}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100, // Menyesuaikan posisi ke tengah FlatList
    paddingHorizontal: 50,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: 'PoppinsBold',
    fontSize: 16,
    lineHeight: 24,
  },
});

export default ProductList;