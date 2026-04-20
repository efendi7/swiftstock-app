/**
 * ProductScreenWeb.tsx — Responsive
 * Desktop ≥1024 : sidebar 268px fixed
 * Tablet  768–  : sidebar 200px
 * Mobile  <768  : sidebar jadi bottom drawer
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Modal, Platform,
} from 'react-native';
import { COLORS } from '@constants/colors';
import { Plus, Package, ShoppingBag, AlertTriangle, PackageX, SlidersHorizontal, X } from 'lucide-react-native';
import StatsToolbar, { StatItem } from '@components/common/web/StatsToolbar';
import SkeletonLoading from '@components/common/web/SkeletonLoading';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

import { useAuth } from '@hooks/auth/useAuth';
import FilterSectionWeb from '@components/products/FilterSectionWeb';
import ProductListWeb from '@components/products/ProductListWeb';
import ProductCardMobile from '@components/products/ProductCardMobile'; // ← baru (lihat file 3)
import EditProductModalWeb from '@components/products/EditProductModal.web';
import { AddProductModalWeb } from '@components/products/AddProductModal.web';
import { ProductService, PaginatedProducts } from '@services/productService';
import { Product } from '@/types/product.types';

// ── hook window width ──────────────────────────────────────
const BP_MOBILE = 768;
const BP_TABLET = 1024;
type LayoutMode = 'desktop' | 'tablet' | 'mobile';

function useWindowWidth(): number {
  const [w, setW] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280,
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

function getMode(w: number): LayoutMode {
  if (w < BP_MOBILE) return 'mobile';
  if (w < BP_TABLET) return 'tablet';
  return 'desktop';
}

// ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

const ProductScreenWeb = () => {
  const { tenantId, user, loading: authLoading } = useAuth();
  const windowWidth = useWindowWidth();
  const mode        = getMode(windowWidth);

  // ── data state ──
  const [products,         setProducts]         = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [totalCount,       setTotalCount]       = useState(0);
  const [currentPage,      setCurrentPage]      = useState(1);
  const [totalPages,       setTotalPages]       = useState(1);
  const [lastDoc,          setLastDoc]          = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [pageCache,        setPageCache]        = useState<Record<number, { data: Product[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }>>({});

  const [loading,      setLoading]      = useState(true);
  const [pageLoading,  setPageLoading]  = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [userRole,     setUserRole]     = useState<'admin' | 'kasir'>('kasir');
  const [categories,   setCategories]   = useState<{ label: string; value: string }[]>([]);

  // ── modal state ──
  const [showEditModal,    setShowEditModal]    = useState(false);
  const [showAddModal,     setShowAddModal]     = useState(false);
  const [selectedProduct,  setSelectedProduct]  = useState<Product | null>(null);

  // ── filter state ──
  const [searchQuery,  setSearchQuery]  = useState('');
  const [filterMode,   setFilterMode]   = useState<'all' | 'today' | 'range'>('all');
  const [sortType,     setSortType]     = useState('date-desc');

  // ── mobile drawer ──
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(drawerAnim, {
      toValue: drawerOpen ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [drawerOpen]);

  const hasActiveFilter = searchQuery !== '' || filterMode !== 'all' || sortType !== 'date-desc';

  // ── data loaders ──
  const loadCategories = useCallback(async () => {
    if (!tenantId) return;
    try { setCategories(await ProductService.getCategories(tenantId)); }
    catch { setCategories([]); }
  }, [tenantId]);

  const loadFirstPage = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      setLoading(true); setCurrentPage(1); setPageCache({});
      const result: PaginatedProducts = await ProductService.getProductsFirstPage(tenantId, PAGE_SIZE);
      const list = result.products as Product[];
      setProducts(list); setFilteredProducts(list);
      setTotalCount(result.totalCount);
      setTotalPages(Math.ceil(result.totalCount / PAGE_SIZE));
      setLastDoc(result.lastDoc);
      setPageCache({ 1: { data: list, lastDoc: result.lastDoc } });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [tenantId]);

  const handlePageChange = useCallback(async (page: number) => {
    if (!tenantId) return;
    if (pageCache[page]) {
      const c = pageCache[page];
      setProducts(c.data); setFilteredProducts(c.data);
      setLastDoc(c.lastDoc); setCurrentPage(page);
      return;
    }
    const prev = pageCache[page - 1];
    if (!prev?.lastDoc) return;
    try {
      setPageLoading(true);
      const result = await ProductService.getProductsNextPage(tenantId, prev.lastDoc, PAGE_SIZE);
      const list = result.products as Product[];
      setProducts(list); setFilteredProducts(list);
      setLastDoc(result.lastDoc); setCurrentPage(page);
      setPageCache(p => ({ ...p, [page]: { data: list, lastDoc: result.lastDoc } }));
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); }
  }, [tenantId, pageCache]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFirstPage(); await loadCategories();
    setRefreshing(false);
  }, [loadFirstPage, loadCategories]);

  useEffect(() => {
    if (user?.role) setUserRole(user.role as 'admin' | 'kasir');
  }, [user?.role]);

  useEffect(() => {
    if (tenantId && !authLoading) { loadCategories(); loadFirstPage(); }
  }, [tenantId, authLoading]);

  const criticalCount = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;
  const emptyCount    = products.filter(p => (p.stock || 0) <= 0).length;

  // ── sidebar width ──
  const sidebarWidth = mode === 'desktop' ? 268 : 200;

  // ── shared FilterSection props ──
  const filterProps = {
    products, searchQuery, onSearchChange: setSearchQuery,
    onFiltered: setFilteredProducts, userRole,
    filterMode, sortType,
    onFilterModeChange: (m: any) => setFilterMode(m),
    onSortChange: (s: string) => setSortType(s),
  };

  // ── drawer translate (bottom sheet) ──
  const drawerTranslateY = drawerAnim.interpolate({
    inputRange: [0, 1], outputRange: [600, 0],
  });
  const backdropOpacity = drawerAnim;

  return (
    <View style={styles.root}>
      <View style={styles.body}>

        {/* ── SIDEBAR desktop/tablet ── */}
        {mode !== 'mobile' && (
          <View style={[styles.sidebar, { width: sidebarWidth }]}>
            <FilterSectionWeb {...filterProps} />
          </View>
        )}

        {/* ── KOLOM KANAN ── */}
        <View style={styles.rightCol}>

          <StatsToolbar
            stats={[
              { icon: <Package size={14} color={COLORS.primary} />,     value: totalCount,              label: 'Total',  bg: 'rgba(28,58,90,0.07)', color: COLORS.primary },
              { icon: <ShoppingBag size={14} color="#3B82F6" />,         value: filteredProducts.length, label: 'Tampil', bg: '#EFF6FF',              color: '#3B82F6'      },
              ...(criticalCount > 0 ? [{ icon: <AlertTriangle size={14} color="#F59E0B" />, value: criticalCount, label: 'Kritis', bg: '#FFFBEB', color: '#F59E0B' }] : []),
              ...(emptyCount    > 0 ? [{ icon: <PackageX      size={14} color="#EF4444" />, value: emptyCount,    label: 'Habis',  bg: '#FEF2F2', color: '#EF4444' }] : []),
            ] as StatItem[]}
            right={
              <View style={styles.toolbarRight}>
                {/* Tombol Filter — hanya di mobile */}
                {mode === 'mobile' && (
                  <TouchableOpacity
                    style={[styles.filterBtn, hasActiveFilter && styles.filterBtnActive]}
                    onPress={() => setDrawerOpen(true)}
                  >
                    <SlidersHorizontal size={15} color={hasActiveFilter ? '#FFF' : COLORS.primary} />
                    <Text style={[styles.filterBtnText, hasActiveFilter && { color: '#FFF' }]}>
                      Filter{hasActiveFilter ? ' ●' : ''}
                    </Text>
                  </TouchableOpacity>
                )}
                {userRole === 'admin' && (
                  <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                    <Plus size={16} color="#FFF" />
                    {mode !== 'mobile' && <Text style={styles.addBtnText}>Tambah Produk</Text>}
                  </TouchableOpacity>
                )}
              </View>
            }
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
            ) : mode === 'mobile' ? (
              // ── MOBILE: card list ──
              <ProductCardMobile
                data={filteredProducts}
                onEditPress={(p) => { setSelectedProduct(p); setShowEditModal(true); }}
                isAdmin={userRole === 'admin'}
                refreshing={refreshing}
                sortType={sortType}
              />
            ) : (
              // ── DESKTOP/TABLET: tabel ──
              <ProductListWeb
                compact={mode === 'tablet'}
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

      {/* ── MOBILE FILTER DRAWER ── */}
      {mode === 'mobile' && (
        <Modal transparent visible={drawerOpen} animationType="none" onRequestClose={() => setDrawerOpen(false)}>
          {/* Backdrop */}
          <Animated.View style={[styles.drawerBackdrop, { opacity: backdropOpacity }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setDrawerOpen(false)} activeOpacity={1} />
          </Animated.View>

          {/* Sheet */}
          <Animated.View style={[styles.drawerSheet, { transform: [{ translateY: drawerTranslateY }] }]}>
            {/* Handle + header */}
            <View style={styles.drawerHandle} />
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Filter Produk</Text>
              <TouchableOpacity onPress={() => setDrawerOpen(false)} style={styles.drawerClose}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Filter content */}
            <FilterSectionWeb {...filterProps} />
          </Animated.View>
        </Modal>
      )}

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
  root:    { flex: 1, overflow: 'hidden' as any },
  body:    { flex: 1, flexDirection: 'row', overflow: 'hidden' as any },
  sidebar: { backgroundColor: '#FFF', borderRightWidth: 1, borderRightColor: '#E2E8F0', overflow: 'hidden' as any },

  rightCol:    { flex: 1, flexDirection: 'column', overflow: 'hidden' as any, minWidth: 0 },
  listScroll:  { flex: 1 },
  listContent: { padding: 14, paddingBottom: 40 },

  toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9,
    borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF',
    cursor: 'pointer' as any,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterBtnText:   { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: COLORS.primary },

  addBtn:     { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, gap: 6, cursor: 'pointer' as any },
  addBtnText: { color: '#FFF', fontFamily: 'PoppinsBold', fontSize: 13 },

  // Drawer
  drawerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 98 },
  drawerSheet: {
    position: 'absolute' as any,
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    zIndex: 99,
    maxHeight: '80%' as any,
    overflow: 'hidden' as any,
    ...Platform.select({ web: { boxShadow: '0 -4px 20px rgba(0,0,0,0.12)' } as any }),
  },
  drawerHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 10 },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  drawerTitle:  { fontSize: 15, fontFamily: 'PoppinsBold', color: '#1E293B' },
  drawerClose:  { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
});

export default ProductScreenWeb;