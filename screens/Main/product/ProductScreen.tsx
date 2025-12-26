import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, StatusBar, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../services/firebaseConfig';
import { COLORS } from '../../../constants/colors';
import { Package } from 'lucide-react-native'; 

import { ScreenHeader } from '../../../components/common/ScreenHeader';
import FilterSection from '../../../components/products/FilterSection'; 
import ProductList from '../../../components/products/ProductList';
import EditProductModal from './modal/EditProductModal';
import { Product } from '../../../types/product.types';

type SortType = 
  | 'sold-desc' 
  | 'date-desc' 
  | 'date-asc' 
  | 'stock-safe' 
  | 'stock-critical' 
  | 'stock-empty'
  | 'newest';

type FilterMode = 'all' | 'today' | 'range';

const ProductScreen = ({ navigation, route }: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'kasir'>('kasir');

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortType, setSortType] = useState<SortType>('date-desc');

  const fetchUserRole = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role as 'admin' | 'kasir');
        }
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  }, []);

  // SEKARANG JAUH LEBIH RINGAN
  const loadProducts = useCallback(async () => {
    try {
      setRefreshing(true);
      const snapshot = await getDocs(collection(db, 'products'));
      
      const productsList: Product[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ambil sold langsung dari field soldCount yang kita update di transactionService
          sold: data.soldCount || 0, 
        } as Product;
      });

      setProducts(productsList);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserRole();
      loadProducts();

      if (route.params?.filterType) {
        setSortType(route.params.filterType as SortType);
        navigation.setParams({ filterType: undefined });
      }
    }, [fetchUserRole, loadProducts, route.params])
  );

  const handleEditPress = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const filterProps = {
    products,
    searchQuery,
    onSearchChange: setSearchQuery,
    filterMode,
    sortType,
    userRole,
    onFiltered: setFilteredProducts,
    onFilterModeChange: (newMode: FilterMode) => setFilterMode(newMode),
    onSortChange: (newSort: string) => setSortType(newSort as SortType),
  };

  if (loading && products.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.loaderText}>Memuat produk...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScreenHeader 
        title="Daftar Produk" 
        subtitle="Manajemen Stok & Harga" 
        icon={<Package size={24} color="#FFF" />}
      />
      <View style={styles.contentWrapper}>
        <View style={styles.filterSearchContainer}>
          <FilterSection {...filterProps} />
        </View>
        <ProductList 
          data={filteredProducts} 
          refreshing={refreshing} 
          onRefresh={loadProducts}
          onEditPress={handleEditPress}
          isAdmin={userRole === 'admin'} 
          sortType={sortType}
        />
      </View>
      <EditProductModal
        visible={showEditModal}
        product={selectedProduct}
        userRole={userRole}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
        }}
        onSuccess={loadProducts}
      />
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.primary 
  },
  loaderContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC' 
  },
  loaderText: { 
    marginTop: 10, 
    color: COLORS.textLight, 
    fontFamily: 'PoppinsRegular' 
  },
  contentWrapper: { 
    flex: 1, 
    backgroundColor: '#F8FAFC', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    marginTop: -20, 
    overflow: 'hidden' 
  },
  filterSearchContainer: { 
    paddingTop: 12,
    backgroundColor: '#F8FAFC',
  }
});

export default ProductScreen;