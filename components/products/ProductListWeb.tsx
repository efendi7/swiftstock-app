/**
 * ProductListWeb.tsx — tabel horizontal dengan gambar produk
 * + prop compact untuk tablet (sembunyikan kolom opsional)
 */

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Product } from '../../types/product.types';
import {
  PackageSearch, Pencil,
  TrendingUp, AlertTriangle, PackageX, Package,
} from 'lucide-react-native';
import Pagination from '@components/common/web/Pagination';
import EmptyState from '@components/common/web/EmptyState';
import { COLORS } from '../../constants/colors';

interface Props {
  data:           Product[];
  refreshing:     boolean;
  onEditPress:    (product: Product) => void;
  isAdmin?:       boolean;
  sortType?:      string;
  compact?:       boolean; // tablet: sembunyikan kolom opsional
  usePagination?: boolean;
  currentPage?:   number;
  totalPages?:    number;
  totalCount?:    number;
  pageSize?:      number;
  onPageChange?:  (page: number) => void;
}

const ProductListWeb = ({
  data, refreshing, onEditPress,
  isAdmin   = false,
  sortType,
  compact   = false,
  usePagination = false,
  currentPage   = 1,
  totalPages    = 1,
  totalCount    = 0,
  pageSize      = 20,
  onPageChange,
}: Props) => {

  if (refreshing) {
    return <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 60 }} />;
  }

  if (data.length === 0) {
    const emptyMsg =
      sortType === 'stock-safe'     ? 'Semua stok sedang kritis atau habis!' :
      sortType === 'stock-critical' ? 'Tidak ada stok yang kritis. Bagus!'   :
      sortType === 'stock-empty'    ? 'Semua stok aman tersedia!'             :
      'Belum ada produk. Tambah produk baru!';
    const emptyColor =
      ['stock-critical', 'stock-empty'].includes(sortType ?? '') ? '#22C55E' :
      sortType === 'stock-safe' ? '#EF4444' : '#94A3B8';
    return (
      <EmptyState
        icon={<PackageSearch size={48} color={emptyColor} strokeWidth={1.5} />}
        message={emptyMsg}
        color={emptyColor}
      />
    );
  }

  const startIdx = usePagination ? (currentPage - 1) * pageSize : 0;

  return (
    <View style={styles.container}>

      {/* ── TABLE HEADER ── */}
      <View style={styles.tableHead}>
        <Text style={[styles.th, styles.cNo]}>#</Text>
        <Text style={[styles.th, styles.cProduct]}>Produk</Text>
        <Text style={[styles.th, styles.cCategory]}>Kategori</Text>
        <Text style={[styles.th, styles.cPrice, { textAlign: 'right' as any }]}>Harga Jual</Text>
        {!compact && (
          <Text style={[styles.th, styles.cCost, { textAlign: 'right' as any }]}>Harga Beli</Text>
        )}
        <Text style={[styles.th, styles.cStock, { textAlign: 'center' as any }]}>Stok</Text>
        {!compact && (
          <Text style={[styles.th, styles.cSold, { textAlign: 'center' as any }]}>Terjual</Text>
        )}
        {isAdmin && (
          <Text style={[styles.th, styles.cAction, { textAlign: 'center' as any }]}>Aksi</Text>
        )}
      </View>

      {/* ── ROWS ── */}
      {data.map((item, i) => (
        <Row
          key={item.id}
          product={item}
          onEditPress={onEditPress}
          isAdmin={isAdmin}
          isEven={i % 2 === 0}
          rowNumber={startIdx + i + 1}
          compact={compact}
        />
      ))}

      {/* ── FOOTER / PAGINATION ── */}
      {usePagination ? (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={p => onPageChange?.(p)}
          entityLabel="produk"
        />
      ) : (
        <Pagination
          currentPage={1}
          totalPages={1}
          totalCount={data.length}
          pageSize={data.length}
          onPageChange={() => {}}
          entityLabel="produk ditampilkan (filter aktif)"
        />
      )}
    </View>
  );
};

// ── ROW ──────────────────────────────────────────────────────
const Row = ({
  product, onEditPress, isAdmin, isEven, rowNumber, compact,
}: {
  product:     Product;
  onEditPress: (p: Product) => void;
  isAdmin:     boolean;
  isEven:      boolean;
  rowNumber:   number;
  compact:     boolean;
}) => {
  const stock      = product.stock || 0;
  const status     = stock <= 0 ? 'empty' : stock <= 10 ? 'critical' : 'safe';
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
          {product.imageUrl
            ? <img
                src={product.imageUrl}
                style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' } as any}
                alt=""
              />
            : <Package size={15} color={COLORS.primary} />
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
          {product.barcode
            ? <Text style={styles.barcode}>{product.barcode}</Text>
            : null
          }
        </View>
      </View>

      {/* KATEGORI */}
      <View style={[styles.cell, styles.cCategory]}>
        <View style={styles.catPill}>
          <Text style={styles.catText} numberOfLines={1}>{product.category || '—'}</Text>
        </View>
      </View>

      {/* HARGA JUAL */}
      <View style={[styles.cell, styles.cPrice, { justifyContent: 'flex-end' as any }]}>
        <Text style={styles.priceText}>{fmt(product.price)}</Text>
      </View>

      {/* HARGA BELI — disembunyikan di compact/tablet */}
      {!compact && (
        <View style={[styles.cell, styles.cCost, { justifyContent: 'flex-end' as any }]}>
          <Text style={styles.costText}>
            {product.purchasePrice ? fmt(product.purchasePrice) : '—'}
          </Text>
        </View>
      )}

      {/* STOK */}
      <View style={[styles.cell, styles.cStock, { justifyContent: 'center' as any }]}>
        <View style={[styles.stockBadge, { backgroundColor: stockBg }]}>
          {status === 'empty'    && <PackageX      size={12} color={stockColor} />}
          {status === 'critical' && <AlertTriangle size={12} color={stockColor} />}
          {status === 'safe'     && <Package       size={12} color={stockColor} />}
          <Text style={[styles.stockVal,  { color: stockColor }]}>{stock}</Text>
          <Text style={[styles.stockUnit, { color: stockColor }]}>stok</Text>
        </View>
      </View>

      {/* TERJUAL — disembunyikan di compact/tablet */}
      {!compact && (
        <View style={[styles.cell, styles.cSold, { justifyContent: 'center' as any }]}>
          <View style={styles.soldBadge}>
            <TrendingUp size={12} color={COLORS.secondary} />
            <Text style={styles.soldVal}>{(product as any).soldCount || 0}</Text>
            <Text style={styles.soldUnit}>terjual</Text>
          </View>
        </View>
      )}

      {/* AKSI */}
      {isAdmin && (
        <View style={[styles.cell, styles.cAction, { justifyContent: 'center' as any }]}>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEditPress(product)}>
            <Pencil size={13} color={COLORS.primary} />
            {!compact && <Text style={styles.editBtnText}>Edit</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ── Helpers ───────────────────────────────────────────────────
const fmt = (v: number) => 'Rp ' + (v || 0).toLocaleString('id-ID');

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 4,
  },
  th: {
    fontSize: 11,
    fontFamily: 'PoppinsBold',
    color: '#94A3B8',
    textTransform: 'uppercase' as any,
    letterSpacing: 0.5,
  },

  // Lebar kolom
  cNo:       { width: 36 },
  cProduct:  { flex: 3 },
  cCategory: { flex: 1.5 },
  cPrice:    { flex: 1.5 },
  cCost:     { flex: 1.5 },
  cStock:    { flex: 1.5 },
  cSold:     { flex: 1.5 },
  cAction:   { flex: 1 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 8,
    marginBottom: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  rowAlt: { backgroundColor: '#FAFBFC' },
  cell:   { flexDirection: 'row', alignItems: 'center' },

  rowNo: {
    fontSize: 11,
    fontFamily: 'PoppinsRegular',
    color: '#CBD5E1',
    textAlign: 'center' as any,
    width: 36,
  },
  thumb: {
    width: 32, height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(28,58,90,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden' as any,
  },
  productName: { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  barcode:     { fontSize: 11, fontFamily: 'PoppinsRegular',  color: '#94A3B8', marginTop: 1 },

  catPill: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: 110,
  },
  catText: { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#3B82F6' },

  priceText: { fontSize: 13, fontFamily: 'PoppinsBold',    color: '#1E293B' },
  costText:  { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#64748B' },

  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stockVal:  { fontSize: 13, fontFamily: 'PoppinsBold' },
  stockUnit: { fontSize: 11, fontFamily: 'PoppinsRegular' },

  soldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  soldVal:  { fontSize: 13, fontFamily: 'PoppinsBold',    color: COLORS.secondary },
  soldUnit: { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#64748B' },

  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(28,58,90,0.07)',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    cursor: 'pointer' as any,
  },
  editBtnText: { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: COLORS.primary },
});

export default ProductListWeb;