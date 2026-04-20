/**
 * ProductCardMobile.tsx
 * Card list produk untuk tampilan mobile.
 *
 * Layout per card:
 * ┌─────────────────────────────────────────────┐
 * │ [thumb]  Nama Produk          [Kategori pill]│
 * │          Barcode                             │
 * ├─────────────────────────────────────────────┤
 * │ Harga Jual  Harga Beli  [📦12] [📈5]   [✏] │
 * └─────────────────────────────────────────────┘
 */

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Product } from '@/types/product.types';
import {
  Package, PackageSearch, Pencil,
  AlertTriangle, PackageX, TrendingUp,
} from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import EmptyState from '@components/common/web/EmptyState';

interface Props {
  data:        Product[];
  refreshing:  boolean;
  onEditPress: (p: Product) => void;
  isAdmin:     boolean;
  sortType?:   string;
}

const fmt = (v: number) => 'Rp ' + (v || 0).toLocaleString('id-ID');

const ProductCardMobile = ({ data, refreshing, onEditPress, isAdmin, sortType }: Props) => {
  if (refreshing) {
    return <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 60 }} />;
  }

  if (data.length === 0) {
    const msg   =
      sortType === 'stock-safe'     ? 'Semua stok kritis atau habis!' :
      sortType === 'stock-critical' ? 'Tidak ada stok kritis. Bagus!' :
      sortType === 'stock-empty'    ? 'Semua stok aman!'              :
      'Belum ada produk.';
    const color =
      ['stock-critical', 'stock-empty'].includes(sortType ?? '') ? '#22C55E' :
      sortType === 'stock-safe' ? '#EF4444' : '#94A3B8';
    return (
      <EmptyState
        icon={<PackageSearch size={48} color={color} strokeWidth={1.5} />}
        message={msg}
        color={color}
      />
    );
  }

  return (
    <View style={s.list}>
      {data.map(item => {
        const stock      = item.stock || 0;
        const status     = stock <= 0 ? 'empty' : stock <= 10 ? 'critical' : 'safe';
        const stockColor = { safe: '#22C55E', critical: '#F59E0B', empty: '#EF4444' }[status];
        const stockBg    = { safe: '#F0FDF4', critical: '#FFFBEB', empty: '#FEF2F2' }[status];
        const soldCount  = (item as any).soldCount || 0;

        return (
          <View key={item.id} style={s.card}>

            {/* ── BARIS ATAS: thumb + nama/barcode + kategori ── */}
            <View style={s.top}>
              {/* Thumbnail */}
              <View style={s.thumb}>
                {item.imageUrl
                  ? <img
                      src={item.imageUrl}
                      style={{ width: 40, height: 40, borderRadius: 9, objectFit: 'cover' } as any}
                      alt=""
                    />
                  : <Package size={18} color={COLORS.primary} />
                }
              </View>

              {/* Nama + barcode */}
              <View style={s.nameBlock}>
                <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                {item.barcode
                  ? <Text style={s.barcode}>{item.barcode}</Text>
                  : null
                }
              </View>

              {/* Kategori — pojok kanan atas */}
              {item.category ? (
                <View style={s.catPill}>
                  <Text style={s.catText} numberOfLines={1}>{item.category}</Text>
                </View>
              ) : null}
            </View>

            {/* ── DIVIDER ── */}
            <View style={s.divider} />

            {/* ── BARIS BAWAH: harga jual | harga beli | stok-ikon | terjual-ikon | edit ── */}
            <View style={s.bottom}>

              {/* Harga Jual */}
              <View style={s.priceBlock}>
                <Text style={s.priceLabel}>Jual</Text>
                <Text style={s.priceVal}>{fmt(item.price)}</Text>
              </View>

              {/* Harga Beli */}
              {item.purchasePrice ? (
                <View style={s.priceBlock}>
                  <Text style={s.priceLabel}>Beli</Text>
                  <Text style={s.costVal}>{fmt(item.purchasePrice)}</Text>
                </View>
              ) : null}

              {/* Spacer — dorong ikon ke kanan */}
              <View style={{ flex: 1 }} />

              {/* Stok — ikon + angka saja */}
              <View style={[s.iconBadge, { backgroundColor: stockBg }]}>
                {status === 'empty'    && <PackageX      size={13} color={stockColor} />}
                {status === 'critical' && <AlertTriangle size={13} color={stockColor} />}
                {status === 'safe'     && <Package       size={13} color={stockColor} />}
                <Text style={[s.iconBadgeVal, { color: stockColor }]}>{stock}</Text>
              </View>

              {/* Terjual — ikon + angka saja */}
              <View style={[s.iconBadge, { backgroundColor: '#F0FDF4' }]}>
                <TrendingUp size={13} color={COLORS.secondary} />
                <Text style={[s.iconBadgeVal, { color: COLORS.secondary }]}>{soldCount}</Text>
              </View>

              {/* Edit — hanya ikon, ada jarak kiri */}
              {isAdmin && (
                <TouchableOpacity style={s.editBtn} onPress={() => onEditPress(item)}>
                  <Pencil size={14} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>

          </View>
        );
      })}
    </View>
  );
};

const s = StyleSheet.create({
  list: { gap: 10 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 10,
  },

  // ── Baris atas ──
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thumb: {
    width: 40, height: 40,
    borderRadius: 9,
    backgroundColor: 'rgba(28,58,90,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden' as any,
    flexShrink: 0,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name:    { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  barcode: { fontSize: 11, fontFamily: 'PoppinsRegular',  color: '#94A3B8' },

  catPill: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
    maxWidth: 100,
  },
  catText: { fontSize: 11, fontFamily: 'PoppinsMedium', color: '#3B82F6' },

  divider: { height: 1, backgroundColor: '#F1F5F9' },

  // ── Baris bawah ──
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  priceBlock: { gap: 1 },
  priceLabel: { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  priceVal:   { fontSize: 13, fontFamily: 'PoppinsBold',    color: '#1E293B' },
  costVal:    { fontSize: 13, fontFamily: 'PoppinsRegular', color: '#64748B' },

  // Badge ikon (stok & terjual) — hanya ikon + angka
  iconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  iconBadgeVal: { fontSize: 13, fontFamily: 'PoppinsBold' },

  // Tombol edit — hanya ikon, jarak kiri lebih besar
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(28,58,90,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    cursor: 'pointer' as any,
  },
});

export default ProductCardMobile;