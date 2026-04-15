/**
 * components/transactions/TransactionListWeb.tsx
 * Tabel transaksi dengan server-side pagination support.
 * Pakai Pagination + EmptyState dari common/web.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import {
  CreditCard, Banknote, PackageSearch, Eye,
} from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import Pagination      from '@components/common/web/Pagination';
import EmptyState      from '@components/common/web/EmptyState';
import SkeletonLoading from '@components/common/web/SkeletonLoading';
import { Transaction } from '@/types/transaction.type';

interface Props {
  data:           Transaction[];
  refreshing:     boolean;
  onRefresh:      () => void;
  isAdmin:        boolean;
  onViewPress:    (transaction: Transaction) => void;
  usePagination?: boolean;
  currentPage?:   number;
  totalPages?:    number;
  totalCount?:    number;
  pageSize?:      number;
  onPageChange?:  (page: number) => void;
}

const PAGE_SIZE_DEFAULT = 20;

const formatRp = (n: number) => {
  if (n >= 1_000_000) return 'Rp ' + (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + ' jt';
  return 'Rp ' + n.toLocaleString('id-ID');
};

const TransactionListWeb = ({
  data, refreshing, onRefresh, isAdmin, onViewPress,
  usePagination  = false,
  currentPage:  serverPage      = 1,
  totalPages:   serverTotalPages = 1,
  totalCount,
  pageSize = PAGE_SIZE_DEFAULT,
  onPageChange,
}: Props) => {
  const [localPage, setLocalPage] = useState(1);
  useEffect(() => { setLocalPage(1); }, [data]);

  if (refreshing) return <SkeletonLoading type="table" rows={8} style={{ padding: 4 }} />;

  if (data.length === 0) return (
    <EmptyState
      icon={<PackageSearch size={48} color="#94A3B8" strokeWidth={1.5} />}
      message="Belum ada transaksi"
      subtext="Transaksi akan muncul setelah kasir melakukan penjualan"
    />
  );

  const pg      = usePagination ? serverPage        : localPage;
  const pgTotal = usePagination ? serverTotalPages  : Math.ceil(data.length / pageSize);
  const slice0  = usePagination ? 0                 : (localPage - 1) * pageSize;
  const slice1  = usePagination ? data.length       : slice0 + pageSize;
  const rows    = data.slice(slice0, slice1);

  const dispFrom  = usePagination ? (serverPage - 1) * pageSize + 1 : slice0 + 1;
  const dispTotal = usePagination ? (totalCount ?? data.length)     : data.length;

  const goTo = (page: number) => {
    if (usePagination) onPageChange?.(page);
    else setLocalPage(page);
  };

  const pageRevenue = rows.reduce((s, t) => s + (t.total || 0), 0);

  return (
    <View style={s.container}>

      {/* TABLE HEADER */}
      <View style={s.tableHead}>
        <Text style={[s.th, s.cNo]}>#</Text>
        <Text style={[s.th, s.cTrxNo]}>No. Transaksi</Text>
        {isAdmin && <Text style={[s.th, s.cCashier]}>Kasir</Text>}
        <Text style={[s.th, s.cMethod, { textAlign: 'center' as any }]}>Metode</Text>
        <Text style={[s.th, s.cItems,  { textAlign: 'center' as any }]}>Item</Text>
        <Text style={[s.th, s.cTotal,  { textAlign: 'right'  as any }]}>Total</Text>
        <Text style={[s.th, s.cTime]}>Waktu</Text>
        <Text style={[s.th, s.cAction, { textAlign: 'center' as any }]}>Aksi</Text>
      </View>

      {/* ROWS */}
      {rows.map((item, i) => (
        <Row
          key={item.id}
          transaction={item}
          rowNumber={dispFrom + i}
          isEven={i % 2 === 0}
          isAdmin={isAdmin}
          onViewPress={onViewPress}
        />
      ))}

      {/* FOOTER — revenue summary + Pagination reusable */}
      <View style={s.footer}>
        <Text style={s.revenue}>
          Halaman ini:{' '}
          <Text style={s.revVal}>Rp {pageRevenue.toLocaleString('id-ID')}</Text>
        </Text>

        <Pagination
          currentPage={pg}
          totalPages={pgTotal}
          totalCount={dispTotal}
          pageSize={pageSize}
          onPageChange={goTo}
          entityLabel="transaksi"
          onRefresh={onRefresh}
          showInfo={true}
        />
      </View>

    </View>
  );
};

// ── ROW ───────────────────────────────────────────────────
const Row = ({ transaction: t, rowNumber, isEven, isAdmin, onViewPress }: {
  transaction: Transaction; rowNumber: number;
  isEven: boolean; isAdmin: boolean;
  onViewPress: (t: Transaction) => void;
}) => {
  const date      = t.date?.toDate?.() || null;
  const timeStr   = date ? date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—';
  const dateStr   = date ? date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '—';
  const itemCount = Array.isArray(t.items) ? t.items.reduce((sum: number, i: any) => sum + (i.qty || 1), 0) : 0;
  const isCash    = (t.paymentMethod || 'cash') === 'cash';

  return (
    <View style={[s.row, !isEven && s.rowAlt]}>
      <Text style={[s.cell, s.cNo, s.rowNo]}>{rowNumber}</Text>
      <Text style={[s.cell, s.cTrxNo, s.trxNo]} numberOfLines={1}>{t.transactionNumber || '—'}</Text>
      {isAdmin && (
        <Text style={[s.cell, s.cCashier, s.cashier]} numberOfLines={1}>{t.cashierName || '—'}</Text>
      )}
      <View style={[s.cellRow, s.cMethod, { justifyContent: 'center' }]}>
        <View style={[s.badge, { backgroundColor: isCash ? '#F0FDF4' : '#FEF3C7' }]}>
          {isCash ? <Banknote size={12} color="#10B981" /> : <CreditCard size={12} color="#D97706" />}
          <Text style={[s.badgeTxt, { color: isCash ? '#10B981' : '#D97706' }]}>
            {isCash ? 'Tunai' : 'QRIS'}
          </Text>
        </View>
      </View>
      <View style={[s.cellRow, s.cItems, { justifyContent: 'center' }]}>
        <View style={s.itemBadge}>
          <Text style={s.itemCount}>{itemCount}</Text>
          <Text style={s.itemUnit}>item</Text>
        </View>
      </View>
      <Text style={[s.cell, s.cTotal, s.total]}>{formatRp(t.total || 0)}</Text>
      <View style={[s.cellRow, s.cTime, { flexDirection: 'column', alignItems: 'flex-start' }]}>
        <Text style={s.timeDate}>{dateStr}</Text>
        <Text style={s.timeHour}>{timeStr}</Text>
      </View>
      <View style={[s.cellRow, s.cAction, { justifyContent: 'center' }]}>
        <TouchableOpacity style={s.viewBtn} onPress={() => onViewPress(t)}>
          <Eye size={13} color={COLORS.primary} />
          <Text style={s.viewBtnTxt}>Detail</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container:  { flex: 1 },

  // Header
  tableHead: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4 },
  th:        { fontSize: 11, fontFamily: 'PoppinsBold', color: '#94A3B8', textTransform: 'uppercase' as any, letterSpacing: 0.5 },

  // Columns
  cNo:      { width: 36 },
  cTrxNo:   { flex: 2.5 },
  cCashier: { flex: 1.5 },
  cMethod:  { flex: 1.2 },
  cItems:   { flex: 1 },
  cTotal:   { width: 140, textAlign: 'right' as any },
  cTime:    { width: 100, paddingLeft: 20 },
  cAction:  { flex: 1 },

  // Row
  row:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 8, marginBottom: 3, borderWidth: 1, borderColor: '#F1F5F9' },
  rowAlt:  { backgroundColor: '#FAFBFC' },
  cell:    { },
  cellRow: { flexDirection: 'row', alignItems: 'center' },
  rowNo:   { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#CBD5E1' },
  trxNo:   { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  cashier: { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#475569' },
  total:   { fontSize: 14, fontFamily: 'PoppinsBold', color: '#1C3A5A' },

  badge:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  badgeTxt: { fontSize: 11, fontFamily: 'PoppinsBold' },
  itemBadge:{ backgroundColor: '#F0F9FF', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  itemCount:{ fontSize: 13, fontFamily: 'PoppinsBold', color: '#0EA5E9' },
  itemUnit: { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  timeDate: { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#334155' },
  timeHour: { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 1 },

  viewBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(28,58,90,0.07)', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6, cursor: 'pointer' as any },
  viewBtnTxt: { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: COLORS.primary },

  // Footer
  footer:  { marginTop: 16 },
  revenue: { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#64748B', marginBottom: 4 },
  revVal:  { fontFamily: 'PoppinsBold', color: '#10B981' },
});

export default TransactionListWeb;