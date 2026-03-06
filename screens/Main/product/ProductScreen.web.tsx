/**
 * ProductScreenWeb.tsx
 * 
 * Pagination via ProductService (server-side Firestore cursor).
 * Filter tetap client-side dari data halaman aktif.
 * Jika ada filter aktif → paginasi disembunyikan, tampil semua data halaman.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, ActivityIndicator, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { COLORS } from '@constants/colors';
import { Plus, Package, ShoppingBag, AlertTriangle, PackageX } from 'lucide-react-native';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

import { useAuth } from '@hooks/auth/useAuth';
import FilterSectionWeb from '@components/products/FilterSectionWeb';
import ProductListWeb from '@components/products/ProductListWeb';
import EditProductModal from './modal/EditProductModal';
import { AddProductModal } from './modal/AddProductModal';
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
  // Cache halaman agar tidak re-fetch saat back
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

  // Jika ada filter aktif, gunakan client-side filtering dari data halaman ini
  const hasActiveFilter = searchQuery !== '' || filterMode !== 'all' || sortType !== 'date-desc';

  // ── LOAD ─────────────────────────────────────────────────

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

    // Ambil dari cache jika sudah ada
    if (pageCache[page]) {
      const cached = pageCache[page];
      setProducts(cached.data);
      setFilteredProducts(cached.data);
      setLastDoc(cached.lastDoc);
      setCurrentPage(page);
      return;
    }

    // Ambil lastDoc halaman sebelumnya sebagai cursor
    const prevCache = pageCache[page - 1];
    if (!prevCache?.lastDoc) return;

    try {
      setPageLoading(true);
      const result: PaginatedProducts = await ProductService.getProductsNextPage(
        tenantId,
        prevCache.lastDoc,
        PAGE_SIZE
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

        {/* SIDEBAR — fixed */}
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

          {/* TOOLBAR — sticky */}
          <View style={styles.toolbar}>
            <View style={styles.stats}>
              <StatChip icon={<Package size={14} color={COLORS.primary} />}      value={totalCount}              label="Total"  bg="rgba(28,58,90,0.07)" color={COLORS.primary} />
              <StatChip icon={<ShoppingBag size={14} color="#3B82F6" />}          value={filteredProducts.length} label="Tampil" bg="#EFF6FF"              color="#3B82F6" />
              {criticalCount > 0 && <StatChip icon={<AlertTriangle size={14} color="#F59E0B" />} value={criticalCount} label="Kritis" bg="#FFFBEB" color="#F59E0B" />}
              {emptyCount    > 0 && <StatChip icon={<PackageX size={14} color="#EF4444" />}      value={emptyCount}    label="Habis"  bg="#FEF2F2" color="#EF4444" />}

              {!hasActiveFilter && totalPages > 1 && (
                <Text style={styles.pageInfo}>Hal. {currentPage} / {totalPages}</Text>
              )}
            </View>

            {userRole === 'admin' && (
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                <Plus size={16} color="#FFF" />
                <Text style={styles.addBtnText}>Tambah Produk</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* LIST — satu-satunya yang scroll */}
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {loading || pageLoading ? (
              <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 80 }} />
            ) : (
              <ProductListWeb
                data={filteredProducts}
                onEditPress={(p) => { setSelectedProduct(p); setShowEditModal(true); }}
                isAdmin={userRole === 'admin'}
                onRefresh={handleRefresh}
                refreshing={refreshing}
                sortType={sortType}
                // Server-side pagination props
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

      <AddProductModal
        visible={showAddModal}
        onClose={() => { setShowAddModal(false); loadCategories(); }}
        onSuccess={async () => { await loadFirstPage(); await loadCategories(); }}
        categories={categories}
        tenantId={tenantId}
      />
      <EditProductModal
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

const StatChip = ({ icon, value, label, bg, color }: {
  icon: React.ReactNode; value: number; label: string; bg: string; color: string;
}) => (
  <View style={[styles.statChip, { backgroundColor: bg }]}>
    {icon}
    <Text style={[styles.statVal,   { color }]}>{value}</Text>
    <Text style={[styles.statLabel, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  root:      { flex: 1, overflow: 'hidden' as any },
  body:      { flex: 1, flexDirection: 'row', overflow: 'hidden' as any },
  sidebar:   { width: 268, backgroundColor: '#FFF', borderRightWidth: 1, borderRightColor: '#E2E8F0', overflow: 'hidden' as any },
  rightCol:  { flex: 1, flexDirection: 'column', overflow: 'hidden' as any },
  toolbar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 12 },
  stats:     { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' as any },
  statChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statVal:   { fontSize: 13, fontFamily: 'PoppinsBold' },
  statLabel: { fontSize: 11, fontFamily: 'PoppinsRegular' },
  pageInfo:  { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginLeft: 4 },
  addBtn:    { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, gap: 6, cursor: 'pointer' as any },
  addBtnText:{ color: '#FFF', fontFamily: 'PoppinsBold', fontSize: 13 },
  listScroll:  { flex: 1 },
  listContent: { padding: 18, paddingBottom: 40 },
});

export default ProductScreenWeb;