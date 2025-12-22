import React from 'react';
import { FlatList, Text, StyleSheet, View } from 'react-native';
import ProductCard from './ProductCard';
import { Product } from '../../types/product.types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  data: Product[];
  refreshing: boolean;
  onRefresh: () => void;
  onEditPress: (product: Product) => void;
  isAdmin?: boolean; // ✅ Tambahkan prop isAdmin
}

const ProductList = ({ data, refreshing, onRefresh, onEditPress, isAdmin = false }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <FlatList<Product>
      data={data}
      renderItem={({ item }) => (
        <ProductCard 
          product={item} 
          onEditPress={onEditPress}
          isAdmin={isAdmin}
          isTopSeller={(item as any).isTopSeller} // ✅ Pass isTopSeller
          topRank={(item as any).topRank} // ✅ Pass topRank
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
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  empty: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 16,
  },
});

export default ProductList;