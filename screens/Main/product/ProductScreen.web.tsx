/**
 * ProductScreenWeb.tsx
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { COLORS } from '@constants/colors';
import { Plus, Package, ShoppingBag, AlertTriangle, PackageX } from 'lucide-react-native';
import StatsToolbar, { StatItem } from '@components/common/web/StatsToolbar';
import SkeletonLoading from '@components/common/web/SkeletonLoading';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

import { useAuth } from '@hooks/auth/useAuth';
import FilterSectionWeb from '@components/products/FilterSectionWeb';
import ProductListWeb from '@components/products/ProductListWeb';
import EditProductModalWeb from '@components/products/EditProductModal.web';
import { AddProductModalWeb } from '@components/products/AddProductModal.web';
import { ProductService, PaginatedProducts } from '@services/productService';
import { Product } from '@/types/product.types';

const PAGE_SIZE = 20;

const ProductScreenWeb = () => {
  const { tenantId, user, loading: authLoading } = useAuth();

  const [products, setProducts]               = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount]           = useState(0);
  const [currentPage, setCurrentPage]         = useState(1);
  const [totalPages, setTotalPages]           = useState(1);
  const [lastDoc, setLastDoc]                 = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [pageCache, setPageCache]             = useState<Record<number, { data: Product[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }>>({});

  const [loading, setLoading]                 = useState(true);
  const [pageLoading, setPageLoading]         = useState(false);
  const [refreshing, setRefreshing]           = useState(false);
  const [userRole, setUserRole]               = useState<'admin' | 'kasir'>('kasir');
  const [categories, setCategories]           = useState<{ label: string; value: string }[]>([]);

  const [showEditModal, setShowEditModal]     = useState(false);
  const [showAddModal, setShowAddModal]       = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [searchQuery, setSearchQuery]         = useState('');
  const [filterMode, setFilterMode]           = useState<'all' | 'today' | 'range'>('all');
  const [sortType, setSortType]               = useState('date-desc');

  const hasActiveFilter = searchQuery !== '' || filterMode !== 'all' || sortType !== 'date-desc';

  const loadCategories = useCallback(async () => {
    if (!tenantId) return;
    try { setCategories(await ProductService.getCategories(tenantId)); }
    catch { setCategories([]); }
  }, [tenantId]);

  const loadFirstPage = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      setLoading(true);
      setCurrentPage(1);
      setPageCache({});
      const result: PaginatedProducts = await ProductService.getProductsFirstPage(tenantId, PAGE_SIZE);
      const list = result.products as Product[];
      setProducts(list);
      setFilteredProducts(list);
      setTotalCount(result.totalCount);
      setTotalPages(Math.ceil(result.totalCount / PAGE_SIZE));
      setLastDoc(result.lastDoc);
      setPageCache({ 1: { data: list, lastDoc: result.lastDoc } });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const handlePageChange = useCallback(async (page: number) => {
    if (!tenantId) return;
    if (pageCache[page]) {
      const cached = pageCache[page];
      setProducts(cached.data);
      setFilteredProducts(cached.data);
      setLastDoc(cached.lastDoc);
      setCurrentPage(page);
      return;
    }
    const prevCache = pageCache[page - 1];
    if (!prevCache?.lastDoc) return;
    try {
      setPageLoading(true);
      const result: PaginatedProducts = await ProductService.getProductsNextPage(
        tenantId, prevCache.lastDoc, PAGE_SIZE
      );
      const list = result.products as Product[];
      setProducts(list);
      setFilteredProducts(list);
      setLastDoc(result.lastDoc);
      setCurrentPage(page);
      setPageCache(prev => ({ ...prev, [page]: { data: list, lastDoc: result.lastDoc } }));
    } catch (e) {
      console.error(e);
    } finally {
      setPageLoading(false);
    }
  }, [tenantId, pageCache]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFirstPage();
    await loadCategories();
    setRefreshing(false);
  }, [loadFirstPage, loadCategories]);

  useEffect(() => {
    if (user?.role) setUserRole(user.role as 'admin' | 'kasir');
  }, [user?.role]);

  useEffect(() => {
    if (tenantId && !authLoading) {
      loadCategories();
      loadFirstPage();
    }
  }, [tenantId, authLoading]);

  const criticalCount = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;
  const emptyCount    = products.filter(p => (p.stock || 0) <= 0).length;

  return (
    <View style={styles.root}>
      <View style={styles.body}>

        {/* SIDEBAR — scrollable */}
        <View style={styles.sidebar}>
          <FilterSectionWeb
            products={products}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onFiltered={setFilteredProducts}
            userRole={userRole}
            filterMode={filterMode}
            sortType={sortType as any}
            onFilterModeChange={(mode) => setFilterMode(mode as any)}
            onSortChange={(s) => setSortType(s)}
          />
        </View>

        {/* KOLOM KANAN */}
        <View style={styles.rightCol}>

          {/* TOOLBAR — StatsToolbar reusable */}
          <StatsToolbar
            stats={[
              { icon: <Package size={14} color={COLORS.primary} />,     value: totalCount,              label: 'Total',  bg: 'rgba(28,58,90,0.07)', color: COLORS.primary },
              { icon: <ShoppingBag size={14} color="#3B82F6" />,         value: filteredProducts.length, label: 'Tampil', bg: '#EFF6FF',              color: '#3B82F6'      },
              ...(criticalCount > 0 ? [{ icon: <AlertTriangle size={14} color="#F59E0B" />, value: criticalCount, label: 'Kritis', bg: '#FFFBEB', color: '#F59E0B' }] : []),
              ...(emptyCount    > 0 ? [{ icon: <PackageX      size={14} color="#EF4444" />, value: emptyCount,    label: 'Habis',  bg: '#FEF2F2', color: '#EF4444' }] : []),
            ] as StatItem[]}
            right={userRole === 'admin' ? (
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                <Plus size={16} color="#FFF" />
                <Text style={styles.addBtnText}>Tambah Produk</Text>
              </TouchableOpacity>
            ) : undefined}
          />

          {/* LIST */}
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <SkeletonLoading type="table" rows={PAGE_SIZE} style={{ padding: 18 }} />
            ) : pageLoading ? (
              <SkeletonLoading type="table" rows={6} style={{ padding: 18 }} />
            ) : (
              <ProductListWeb
                data={filteredProducts}
                onEditPress={(p) => { setSelectedProduct(p); setShowEditModal(true); }}
                isAdmin={userRole === 'admin'}
                refreshing={refreshing}
                sortType={sortType}
                usePagination={!hasActiveFilter}
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
              />
            )}
          </ScrollView>
        </View>
      </View>

      <AddProductModalWeb
        visible={showAddModal}
        onClose={() => { setShowAddModal(false); loadCategories(); }}
        onSuccess={async () => { await loadFirstPage(); await loadCategories(); }}
        categories={categories}
        tenantId={tenantId}
      />
      <EditProductModalWeb
        visible={showEditModal}
        product={selectedProduct}
        tenantId={tenantId}
        userRole={userRole}
        onClose={() => { setShowEditModal(false); setSelectedProduct(null); loadCategories(); }}
        onSuccess={() => { loadFirstPage(); loadCategories(); }}
      />
    </View>
  );
};


const styles = StyleSheet.create({
  root:     { flex: 1, overflow: 'hidden' as any },
  body:     { flex: 1, flexDirection: 'row', overflow: 'hidden' as any },

  // ✅ Hapus overflow hidden — sidebar sekarang scrollable via FilterSectionWeb
  sidebar:  { width: 268, backgroundColor: '#FFF', borderRightWidth: 1, borderRightColor: '#E2E8F0' },

  rightCol:    { flex: 1, flexDirection: 'column', overflow: 'hidden' as any },
  pageInfo:    { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginLeft: 4 },
  addBtn:      { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, gap: 6, cursor: 'pointer' as any },
  addBtnText:  { color: '#FFF', fontFamily: 'PoppinsBold', fontSize: 13 },
  listScroll:  { flex: 1 },
  listContent: { padding: 18, paddingBottom: 40 },
});

export default ProductScreenWeb;