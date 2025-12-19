// screens/Main/ProductScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, StatusBar, View, ActivityIndicator, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { COLORS } from '../../constants/colors';

import { ScreenHeader } from '../../components/common/ScreenHeader';
import { RoundedContentScreen } from '../../components/common/RoundedContentScreen';

import SearchBar from '../../components/products/SearchBar';
import FilterSection from '../../components/products/FilterSection';
import ProductList from '../../components/products/ProductList';
import FloatingAddButton from '../../components/products/FloatingAddButton';
import { Product } from '../../types/product.types';

type SortType = 'newest' | 'oldest' | 'stock-high' | 'stock-low';
type FilterMode = 'all' | 'specificMonth';

const ProductScreen = ({ navigation }: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortType, setSortType] = useState<SortType>('newest');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadProducts = useCallback(async () => {
    try {
      setRefreshing(true);
      const snapshot = await getDocs(collection(db, 'products'));
      const productsList: Product[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Product));
      setProducts(productsList);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const filterProps = {
    products,
    searchQuery,
    filterMode,
    sortType,
    selectedMonth,
    selectedYear,
    onFiltered: setFilteredProducts,
    onSearchChange: setSearchQuery,
    onFilterModeChange: setFilterMode,
    onSortChange: setSortType,
    onMonthChange: setSelectedMonth,
    onYearChange: setSelectedYear,
  };

  if (loading && products.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={{ marginTop: 10, color: COLORS.textLight }}>Memuat produk...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <ScreenHeader title="Daftar Produk" subtitle="Manajemen Produk" />

      <RoundedContentScreen>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <FilterSection {...filterProps} />
        <ProductList data={filteredProducts} refreshing={refreshing} onRefresh={loadProducts} />
      </RoundedContentScreen>

      <FloatingAddButton onPress={() => navigation?.navigate('AddProduct')} />
    </SafeAreaView>
  );
};

export default ProductScreen;