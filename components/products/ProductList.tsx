// components/products/ProductList.tsx
import React from 'react';
import { FlatList, Text, StyleSheet, View } from 'react-native';
import ProductCard from './ProductCard';
import { Product } from '../../types/product.types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  data: Product[];
  refreshing: boolean;
  onRefresh: () => void;
}

const ProductList = ({ data, refreshing, onRefresh }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <FlatList<Product>
      data={data}
      renderItem={({ item }) => <ProductCard item={item} />}
      keyExtractor={item => item.id}
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingBottom: insets.bottom + 100, // ruang untuk bottom tab + FAB
          paddingTop: 20,     // ← Tambah jarak atas dari FilterSection
        },
      ]}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>Belum ada produk. Tambah produk baru!</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 16,     // ganti padding: 16 jadi hanya horizontal
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,           // agar empty state terlihat bagus
  },
  empty: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 16,
  },
});

export default ProductList;