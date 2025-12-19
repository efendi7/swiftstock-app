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

// UPDATE: Sesuaikan dengan FilterSection yang baru
type SortType = 'newest' | 'oldest' | 'stock-high' | 'stock-low' | 'low-stock-warn' | 'safe-stock';
type FilterMode = 'all' | 'specificMonth' | 'today';

const ProductScreen = ({ navigation }: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortType, setSortType] = useState<SortType>('newest'); // Default terbaru
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

  const handleSortChange = (newSort: SortType) => {
    setSortType(newSort);
  };

  const handleFilterModeChange = (newMode: FilterMode) => {
    setFilterMode(newMode);
  };

  const filterProps = {
    products,
    searchQuery,
    filterMode,
    sortType,
    selectedMonth,
    selectedYear,
    onFiltered: setFilteredProducts,
    onFilterModeChange: handleFilterModeChange,
    onSortChange: handleSortChange,
    onMonthChange: setSelectedMonth,
    onYearChange: setSelectedYear,
  };

  if (loading && products.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={{ marginTop: 10, color: COLORS.textLight, fontFamily: 'PoppinsRegular' }}>Memuat produk...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <ScreenHeader title="Daftar Produk" subtitle="Manajemen Stok & Harga" />

      <RoundedContentScreen>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        
        <FilterSection {...filterProps} />
        
        <ProductList 
          data={filteredProducts} 
          refreshing={refreshing} 
          onRefresh={loadProducts} 
        />
      </RoundedContentScreen>

      <FloatingAddButton onPress={() => navigation?.navigate('AddProduct')} />
    </SafeAreaView>
  );
};

export default ProductScreen;