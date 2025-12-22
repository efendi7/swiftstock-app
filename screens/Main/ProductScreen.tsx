import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, StatusBar, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { COLORS } from '../../constants/colors';
import { Package } from 'lucide-react-native'; 

import { ScreenHeader } from '../../components/common/ScreenHeader';
import SearchBar from '../../components/products/SearchBar';
import FilterSection from '../../components/products/FilterSection';
import ProductList from '../../components/products/ProductList';
import FloatingAddButton from '../../components/products/FloatingAddButton';
import EditProductModal from '../Main/modal/EditProductModal';
import { Product } from '../../types/product.types';
import { Transaction } from '../../types/transaction.type';

type SortType = 
  | 'sold-desc' 
  | 'date-desc' 
  | 'date-asc' 
  | 'stock-safe' 
  | 'stock-critical' 
  | 'stock-empty'
  | 'newest'; // default awal

type FilterMode = 'all' | 'today' | 'range'; // Hapus 'specificMonth' karena sudah jadi 'range'
const ProductScreen = ({ navigation }: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'kasir'>('kasir');

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
const [filterMode, setFilterMode] = useState<FilterMode>('all');
const [sortType, setSortType] = useState<SortType>('date-desc'); // Ganti 'newest' ke 'date-desc' agar sinkron
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchUserRole = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);
        }
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  }, []);

  // ✅ FUNGSI BARU: Hitung jumlah terjual dari transaksi
  const calculateSoldProducts = useCallback(async (productsList: Product[]) => {
    try {
      // Ambil semua transaksi
      const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
      const transactions: Transaction[] = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Transaction));

      // Hitung total sold untuk setiap produk
      const soldMap: Record<string, number> = {};
      
      transactions.forEach(transaction => {
        transaction.items.forEach(item => {
          if (item.productId) {
            // ✅ Gunakan field 'qty' sesuai interface TransactionItem
            soldMap[item.productId] = (soldMap[item.productId] || 0) + item.qty;
          }
        });
      });

      // ✅ Buat array untuk ranking (untuk menentukan top 10)
      const soldRanking = Object.entries(soldMap)
        .sort(([, a], [, b]) => b - a) // Sort descending
        .slice(0, 10); // Ambil top 10
      
      // ✅ Buat Map untuk cek apakah produk masuk top 10 dan rankingnya
      const topSellerMap = new Map<string, number>();
      soldRanking.forEach(([productId], index) => {
        topSellerMap.set(productId, index + 1); // Rank 1-10
      });

      // Tambahkan data sold dan top seller ke setiap produk
      return productsList.map(product => ({
        ...product,
        sold: soldMap[product.id] || 0,
        isTopSeller: topSellerMap.has(product.id), // ✅ Boolean
        topRank: topSellerMap.get(product.id), // ✅ Ranking 1-10
      }));
    } catch (error) {
      console.error('Error calculating sold products:', error);
      // Jika gagal, return produk dengan sold = 0
      return productsList.map(product => ({ ...product, sold: 0, isTopSeller: false }));
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // 1. Load products dari Firestore
      const snapshot = await getDocs(collection(db, 'products'));
      const productsList: Product[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Product));

      // 2. Hitung jumlah terjual dan gabungkan ke products
      const productsWithSold = await calculateSoldProducts(productsList);
      
      setProducts(productsWithSold);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [calculateSoldProducts]);

  useEffect(() => {
    fetchUserRole();
    loadProducts();
  }, [fetchUserRole, loadProducts]);

  useFocusEffect(
    useCallback(() => {
      fetchUserRole();
      loadProducts();
    }, [fetchUserRole, loadProducts])
  );

  const handleEditPress = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

 const filterProps = {
  products,
  searchQuery,
  filterMode,
  sortType,
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
        icon={<Package size={24} color="#FFFF"  />}
      />

      <View style={styles.contentWrapper}>
        <View style={styles.filterSearchContainer}>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
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

      {userRole === 'admin' && (
        <FloatingAddButton onPress={() => navigation?.navigate('AddProduct')} />
      )}

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
    paddingTop: 24, 
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 16, 
  }
});

export default ProductScreen;