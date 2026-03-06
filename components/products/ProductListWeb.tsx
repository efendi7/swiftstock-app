/**
 * ProductListWeb.tsx
 * Menerima pagination props dari ProductScreenWeb.
 * Jika usePagination=false (ada filter aktif) → tampil semua data tanpa pagination UI.
 */

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Product } from '../../types/product.types';
import {
  PackageSearch, Smile, Frown, Pencil,
  TrendingUp, AlertTriangle, PackageX, Package,
  ChevronLeft, ChevronRight,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

interface Props {
  data: Product[];
  refreshing: boolean;
  onRefresh: () => void;
  onEditPress: (product: Product) => void;
  isAdmin?: boolean;
  sortType?: string;
  // Pagination (server-side dari ProductScreenWeb)
  usePagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

const ProductListWeb = ({
  data, refreshing, onRefresh, onEditPress,
  isAdmin = false, sortType,
  usePagination = false,
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  pageSize = 20,
  onPageChange,
}: Props) => {

  if (refreshing) {
    return <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 60 }} />;
  }

  if (data.length === 0) return <EmptyState sortType={sortType} />;

  const startIdx = usePagination ? (currentPage - 1) * pageSize : 0;

  // Nomor halaman yang ditampilkan (max 5)
  const pageNumbers = (() => {
    if (!usePagination || totalPages <= 1) return [];
    const pages: number[] = [];
    let start = Math.max(1, currentPage - 2);
    let end   = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  })();

  return (
    <View style={styles.container}>

      {/* TABLE HEADER */}
      <View style={styles.tableHead}>
        <Text style={[styles.th, styles.cNo]}>#</Text>
        <Text style={[styles.th, styles.cProduct]}>Produk</Text>
        <Text style={[styles.th, styles.cCategory]}>Kategori</Text>
        <Text style={[styles.th, styles.cPrice,  { textAlign: 'right' }]}>Harga Jual</Text>
        <Text style={[styles.th, styles.cCost,   { textAlign: 'right' }]}>Harga Beli</Text>
        <Text style={[styles.th, styles.cStock,  { textAlign: 'center' }]}>Stok</Text>
        <Text style={[styles.th, styles.cSold,   { textAlign: 'center' }]}>Terjual</Text>
        {isAdmin && <Text style={[styles.th, styles.cAction, { textAlign: 'center' }]}>Aksi</Text>}
      </View>

      {/* ROWS */}
      {data.map((item, i) => (
        <Row
          key={item.id}
          product={item}
          onEditPress={onEditPress}
          isAdmin={isAdmin}
          isEven={i % 2 === 0}
          rowNumber={startIdx + i + 1}
        />
      ))}

      {/* FOOTER */}
      <View style={styles.footer}>

        {/* Info */}
        <Text style={styles.footerInfo}>
          {usePagination ? (
            <>
              Hal. <Text style={styles.bold}>{currentPage}</Text>
              {' · '}
              <Text style={styles.bold}>{startIdx + 1}–{Math.min(startIdx + pageSize, totalCount)}</Text>
              {' dari '}
              <Text style={styles.bold}>{totalCount}</Text> produk
            </>
          ) : (
            <><Text style={styles.bold}>{data.length}</Text> produk ditampilkan (filter aktif)</>
          )}
        </Text>

        {/* Pagination controls */}
        {usePagination && totalPages > 1 && (
          <View style={styles.pagination}>
            <PageBtn
              onPress={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={14} color={currentPage === 1 ? '#CBD5E1' : '#475569'} />
            </PageBtn>

            {pageNumbers.map(num => (
              <PageBtn
                key={num}
                onPress={() => onPageChange?.(num)}
                active={num === currentPage}
              >
                <Text style={[styles.pageTxt, num === currentPage && styles.pageTxtActive]}>
                  {num}
                </Text>
              </PageBtn>
            ))}

            <PageBtn
              onPress={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={14} color={currentPage === totalPages ? '#CBD5E1' : '#475569'} />
            </PageBtn>
          </View>
        )}

        {/* Refresh */}
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Text style={styles.refreshTxt}>↻  Perbarui</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── PAGE BUTTON ───────────────────────────────────────────
const PageBtn = ({ children, onPress, disabled, active }: {
  children: React.ReactNode; onPress: () => void; disabled?: boolean; active?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.pageBtn, active && styles.pageBtnActive, disabled && styles.pageBtnDisabled]}
    onPress={onPress}
    disabled={disabled}
  >
    {children}
  </TouchableOpacity>
);

// ── ROW ──────────────────────────────────────────────────
const Row = ({ product, onEditPress, isAdmin, isEven, rowNumber }: {
  product: Product; onEditPress: (p: Product) => void;
  isAdmin: boolean; isEven: boolean; rowNumber: number;
}) => {
  const stock  = product.stock || 0;
  const status = stock <= 0 ? 'empty' : stock <= 10 ? 'critical' : 'safe';
  const stockColor = { safe: '#22C55E', critical: '#F59E0B', empty: '#EF4444' }[status];
  const stockBg    = { safe: '#F0FDF4', critical: '#FFFBEB', empty: '#FEF2F2' }[status];

  return (
    <View style={[styles.row, !isEven && styles.rowAlt]}>

      {/* NO */}
      <View style={[styles.cell, styles.cNo]}>
        <Text style={styles.rowNo}>{rowNumber}</Text>
      </View>

      {/* PRODUK */}
      <View style={[styles.cell, styles.cProduct]}>
        <View style={styles.thumb}>
          <Package size={15} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
          {product.barcode ? <Text style={styles.barcode}>{product.barcode}</Text> : null}
        </View>
      </View>

      {/* KATEGORI */}
      <View style={[styles.cell, styles.cCategory]}>
        <View style={styles.catPill}>
          <Text style={styles.catText} numberOfLines={1}>{product.category || '—'}</Text>
        </View>
      </View>

      {/* HARGA JUAL */}
      <View style={[styles.cell, styles.cPrice, { justifyContent: 'flex-end' }]}>
        <Text style={styles.priceText}>{fmt(product.price)}</Text>
      </View>

      {/* HARGA BELI */}
      <View style={[styles.cell, styles.cCost, { justifyContent: 'flex-end' }]}>
        <Text style={styles.costText}>{product.purchasePrice ? fmt(product.purchasePrice) : '—'}</Text>
      </View>

      {/* STOK */}
      <View style={[styles.cell, styles.cStock, { justifyContent: 'center' }]}>
        <View style={[styles.stockBadge, { backgroundColor: stockBg }]}>
          {status === 'empty'    && <PackageX      size={12} color={stockColor} />}
          {status === 'critical' && <AlertTriangle size={12} color={stockColor} />}
          {status === 'safe'     && <Package       size={12} color={stockColor} />}
          <Text style={[styles.stockVal,  { color: stockColor }]}>{stock}</Text>
          <Text style={[styles.stockUnit, { color: stockColor }]}>unit</Text>
        </View>
      </View>

      {/* TERJUAL */}
      <View style={[styles.cell, styles.cSold, { justifyContent: 'center' }]}>
        <View style={styles.soldBadge}>
          <TrendingUp size={12} color={COLORS.secondary} />
          <Text style={styles.soldVal}>{(product as any).soldCount || 0}</Text>
          <Text style={styles.soldUnit}>terjual</Text>
        </View>
      </View>

      {/* AKSI */}
      {isAdmin && (
        <View style={[styles.cell, styles.cAction, { justifyContent: 'center' }]}>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEditPress(product)}>
            <Pencil size={13} color={COLORS.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ── EMPTY ─────────────────────────────────────────────────
const EmptyState = ({ sortType }: { sortType?: string }) => {
  let msg = 'Belum ada produk. Tambah produk baru!';
  let Icon = PackageSearch;
  let color = '#94A3B8';
  if (sortType === 'stock-safe')     { msg = 'Semua stok sedang kritis atau habis!'; Icon = Frown; color = '#EF4444'; }
  if (sortType === 'stock-critical') { msg = 'Tidak ada stok yang kritis. Bagus!';   Icon = Smile; color = '#22C55E'; }
  if (sortType === 'stock-empty')    { msg = 'Semua stok aman tersedia!';             Icon = Smile; color = '#22C55E'; }
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyCircle, { backgroundColor: color + '18' }]}>
        <Icon size={48} color={color} strokeWidth={1.5} />
      </View>
      <Text style={[styles.emptyText, { color }]}>{msg}</Text>
    </View>
  );
};

const fmt = (v: number) => 'Rp ' + (v || 0).toLocaleString('id-ID');

const styles = StyleSheet.create({
  container: { flex: 1 },

  tableHead: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F1F5F9', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4,
  },
  th: { fontSize: 11, fontFamily: 'PoppinsBold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },

  cNo:       { width: 36 },
  cProduct:  { flex: 3 },
  cCategory: { flex: 1.5 },
  cPrice:    { flex: 1.5 },
  cCost:     { flex: 1.5 },
  cStock:    { flex: 1.5 },
  cSold:     { flex: 1.5 },
  cAction:   { flex: 1 },

  row:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 8, marginBottom: 3, borderWidth: 1, borderColor: '#F1F5F9' },
  rowAlt: { backgroundColor: '#FAFBFC' },
  cell:   { flexDirection: 'row', alignItems: 'center' },

  rowNo:       { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#CBD5E1', textAlign: 'center', width: 36 },
  thumb:       { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(28,58,90,0.07)', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  productName: { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  barcode:     { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 1 },

  catPill: { backgroundColor: '#EFF6FF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, maxWidth: 110 },
  catText: { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#3B82F6' },

  priceText: { fontSize: 13, fontFamily: 'PoppinsBold', color: '#1E293B' },
  costText:  { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#64748B' },

  stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  stockVal:   { fontSize: 13, fontFamily: 'PoppinsBold' },
  stockUnit:  { fontSize: 11, fontFamily: 'PoppinsRegular' },

  soldBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FDF4', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  soldVal:   { fontSize: 13, fontFamily: 'PoppinsBold', color: COLORS.secondary },
  soldUnit:  { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#64748B' },

  editBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(28,58,90,0.07)', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6, cursor: 'pointer' as any },
  editBtnText: { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: COLORS.primary },

  // FOOTER
  footer:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0', flexWrap: 'wrap' as any, gap: 10 },
  footerInfo: { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#64748B' },
  bold:       { fontFamily: 'PoppinsBold', color: '#1E293B' },

  pagination: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pageBtn:         { minWidth: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, cursor: 'pointer' as any },
  pageBtnActive:   { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pageBtnDisabled: { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' },
  pageTxt:         { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#475569' },
  pageTxtActive:   { color: '#FFF', fontFamily: 'PoppinsBold' },

  refreshBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 7, borderWidth: 1, borderColor: '#E2E8F0', cursor: 'pointer' as any },
  refreshTxt: { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#475569' },

  empty:       { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyText:   { fontSize: 15, fontFamily: 'PoppinsBold', textAlign: 'center', maxWidth: 280 },
});

export default ProductListWeb;