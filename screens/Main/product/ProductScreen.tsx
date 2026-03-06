import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  SafeAreaView, StatusBar, View,
  ActivityIndicator, Text, StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { Package } from 'lucide-react-native';

import { COLORS } from '../../../constants/colors';
import { useAuth } from '../../../hooks/auth/useAuth';
import { ScreenHeader } from '../../../components/common/ScreenHeader';
import FilterSection from '../../../components/products/FilterSection';
import ProductList from '../../../components/products/ProductList';
import EditProductModal from './modal/EditProductModal';
import { Product } from '../../../types/product.types';
import { ProductService } from '../../../services/productService';

type SortType = 'sold-desc' | 'date-desc' | 'date-asc' | 'stock-safe' | 'stock-critical' | 'stock-empty' | 'newest';
type FilterMode = 'all' | 'today' | 'range';

const PAGE_SIZE = 20;

const ProductScreen = ({ navigation, route }: any) => {
  const { tenantId, user, loading: authLoading } = useAuth();

  const [products,         setProducts]         = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [refreshing,       setRefreshing]       = useState(false);
  const [loadingMore,      setLoadingMore]      = useState(false);
  const [hasMore,          setHasMore]          = useState(true);
  const [totalCount,       setTotalCount]       = useState(0);
  const [userRole,         setUserRole]         = useState<'admin' | 'kasir'>('kasir');

  const lastDocRef   = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const hasLoadedRef = useRef(false);

  const [showEditModal,   setShowEditModal]   = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode,  setFilterMode]  = useState<FilterMode>('all');
  const [sortType,    setSortType]    = useState<SortType>('date-desc');

  const hasActiveFilter = searchQuery !== '' || filterMode !== 'all' || sortType !== 'date-desc';

  // ── LOAD PERTAMA / REFRESH ────────────────────────────────
  const loadFirstPage = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      setLoading(true);
      lastDocRef.current = null;

      const result = await ProductService.getProductsFirstPage(tenantId, PAGE_SIZE);
      const list = result.products.map(p => ({
        ...p, soldCount: p.soldCount || 0, sold: p.soldCount || 0,
      })) as Product[];

      setProducts(list);
      setFilteredProducts(list);
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
      lastDocRef.current = result.lastDoc;
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Gagal memuat data produk.');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // ── LOAD MORE ─────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || hasActiveFilter || !lastDocRef.current || !tenantId) return;
    try {
      setLoadingMore(true);
      const result = await ProductService.getProductsNextPage(tenantId, lastDocRef.current, PAGE_SIZE);
      const newItems = result.products.map(p => ({
        ...p, soldCount: p.soldCount || 0, sold: p.soldCount || 0,
      })) as Product[];

      setProducts(prev => {
        const merged = [...prev, ...newItems];
        setFilteredProducts(merged);
        return merged;
      });
      setHasMore(result.hasMore);
      lastDocRef.current = result.lastDoc;
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }, [tenantId, loadingMore, hasMore, hasActiveFilter]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  }, [loadFirstPage]);

  useEffect(() => {
    if (user?.role) setUserRole(user.role as 'admin' | 'kasir');
  }, [user?.role]);

  useEffect(() => {
    if (tenantId && !authLoading) {
      loadFirstPage();
      hasLoadedRef.current = true;
    }
  }, [tenantId, authLoading]);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.filterType) {
        setSortType(route.params.filterType as SortType);
        navigation.setParams({ filterType: undefined });
      }
      if (hasLoadedRef.current && tenantId) loadFirstPage();
    }, [route.params?.filterType, tenantId])
  );

  const renderFooter = () => {
    if (hasActiveFilter) return null;
    if (loadingMore) return (
      <View style={styles.footerRow}>
        <ActivityIndicator size="small" color={COLORS.secondary} />
        <Text style={styles.loadMoreText}>Memuat lebih banyak...</Text>
      </View>
    );
    if (!hasMore && products.length > 0) return (
      <View style={styles.footerRow}>
        <Text style={styles.endText}>Semua {totalCount} produk ditampilkan</Text>
      </View>
    );
    return null;
  };

  if ((loading || authLoading) && products.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.loaderText}>Menghubungkan ke Toko...</Text>
      </View>
    );
  }

  if (!authLoading && !tenantId) {
    return (
      <View style={styles.loaderContainer}>
        <Package size={48} color={COLORS.textLight} />
        <Text style={styles.emptyText}>Tidak dapat memuat data toko</Text>
        <Text style={styles.emptySubtext}>Silakan logout dan login kembali</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <ScreenHeader
        title="Daftar Produk"
        subtitle={user?.storeName || 'Manajemen Stok'}
        icon={<Package size={24} color="#FFF" />}
      />

      <View style={styles.contentWrapper}>
        <View style={styles.filterSearchContainer}>
          <FilterSection
            products={products}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterMode={filterMode}
            sortType={sortType}
            userRole={userRole}
            onFiltered={setFilteredProducts}
            onFilterModeChange={(mode: FilterMode) => setFilterMode(mode)}
            onSortChange={(sort: string) => setSortType(sort as SortType)}
          />
        </View>

        <ProductList
          data={filteredProducts}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEditPress={(p) => { setSelectedProduct(p); setShowEditModal(true); }}
          isAdmin={userRole === 'admin'}
          sortType={sortType}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter()}
        />
      </View>

      <EditProductModal
        visible={showEditModal}
        product={selectedProduct}
        tenantId={tenantId}
        userRole={userRole}
        onClose={() => { setShowEditModal(false); setSelectedProduct(null); }}
        onSuccess={loadFirstPage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:             { flex: 1, backgroundColor: COLORS.primary },
  loaderContainer:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loaderText:            { marginTop: 10, color: COLORS.textLight, fontFamily: 'PoppinsRegular', fontSize: 14 },
  emptyText:             { marginTop: 16, fontSize: 16, color: COLORS.textDark, fontFamily: 'PoppinsSemiBold' },
  emptySubtext:          { marginTop: 8, fontSize: 14, color: COLORS.textLight, fontFamily: 'PoppinsRegular', textAlign: 'center' },
  contentWrapper:        { flex: 1, backgroundColor: '#F8FAFC', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -20, overflow: 'hidden' },
  filterSearchContainer: { paddingTop: 12, backgroundColor: '#F8FAFC' },
  footerRow:             { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 8 },
  loadMoreText:          { fontSize: 12, fontFamily: 'PoppinsMedium', color: COLORS.secondary },
  endText:               { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
});

export default ProductScreen;