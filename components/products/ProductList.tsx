import React from 'react';
import { FlatList, Text, StyleSheet, View } from 'react-native';
import ProductCard from './ProductCard';
import { Product } from '../../types/product.types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PackageSearch, Smile, Frown } from 'lucide-react-native';

interface Props {
  data:                   Product[];
  refreshing:             boolean;
  onRefresh:              () => void;
  onEditPress:            (product: Product) => void;
  isAdmin?:               boolean;
  sortType?:              string;
  // ✅ Load more props baru
  onEndReached?:          () => void;
  onEndReachedThreshold?: number;
  ListFooterComponent?:   React.ReactElement | null;
}

const ProductList = ({
  data, refreshing, onRefresh, onEditPress,
  isAdmin = false, sortType,
  onEndReached, onEndReachedThreshold = 0.3, ListFooterComponent,
}: Props) => {
  const insets = useSafeAreaInsets();

  const renderEmptyComponent = () => {
    let message = "Belum ada produk. Tambah produk baru!";
    let Icon    = PackageSearch;
    let iconColor = "#94A3B8";

    if (sortType === 'stock-safe' && data.length === 0) {
      message = "Semua stok Anda sedang kritis atau habis!";
      Icon = Frown; iconColor = "#EF4444";
    } else if (sortType === 'stock-critical' && data.length === 0) {
      message = "Luar biasa! Tidak ada stok yang kritis.";
      Icon = Smile; iconColor = "#22C55E";
    } else if (sortType === 'stock-empty' && data.length === 0) {
      message = "Semua stok Anda aman tersedia!";
      Icon = Smile; iconColor = "#22C55E";
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.iconCircle, { backgroundColor: iconColor + '15' }]}>
          <Icon size={50} color={iconColor} strokeWidth={2} />
        </View>
        <Text style={[styles.emptyText, { color: iconColor }]}>{message}</Text>
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
      contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100, paddingTop: 20 }]}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={renderEmptyComponent}
      // ✅ Load more
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListFooterComponent={ListFooterComponent}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: { paddingHorizontal: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, paddingHorizontal: 50 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyText: { textAlign: 'center', fontFamily: 'PoppinsBold', fontSize: 16, lineHeight: 24 },
});

export default ProductList;