/**
 * TransactionListWeb.tsx
 * Tabel transaksi dengan server-side pagination support.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  Receipt, ChevronLeft, ChevronRight,
  CreditCard, Banknote, RotateCcw, PackageSearch, Eye,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Transaction } from '../../types/transaction.type';

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

const TransactionListWeb = ({
  data, refreshing, onRefresh, isAdmin, onViewPress,
  usePagination = false,
  currentPage: serverPage = 1,
  totalPages:  serverTotalPages = 1,
  totalCount,
  pageSize = PAGE_SIZE_DEFAULT,
  onPageChange,
}: Props) => {
  const [localPage, setLocalPage] = useState(1);
  useEffect(() => { setLocalPage(1); }, [data]);

  if (refreshing) return <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 60 }} />;
  if (data.length === 0) return <EmptyState />;

  // Aktif page & total bergantung mode
  const pg         = usePagination ? serverPage       : localPage;
  const pgTotal    = usePagination ? serverTotalPages : Math.ceil(data.length / pageSize);
  const sliceStart = usePagination ? 0               : (localPage - 1) * pageSize;
  const sliceEnd   = usePagination ? data.length     : sliceStart + pageSize;
  const rows       = data.slice(sliceStart, sliceEnd);

  // Info footer
  const dispFrom   = usePagination ? (serverPage - 1) * pageSize + 1 : sliceStart + 1;
  const dispTotal  = usePagination ? (totalCount ?? data.length)     : data.length;
  const dispTo     = Math.min(dispFrom + rows.length - 1, dispTotal);

  const goTo = (page: number) => {
    if (usePagination) onPageChange?.(page);
    else setLocalPage(page);
  };

  const pageRevenue = rows.reduce((s, t) => s + (t.total || 0), 0);

  // Nomor halaman max 5 tombol
  const pageNums = (() => {
    const arr: number[] = [];
    let s = Math.max(1, pg - 2);
    let e = Math.min(pgTotal, s + 4);
    if (e - s < 4) s = Math.max(1, e - 4);
    for (let i = s; i <= e; i++) arr.push(i);
    return arr;
  })();

  return (
    <View style={styles.container}>

      {/* TABLE HEADER */}
      <View style={styles.tableHead}>
        <Text style={[styles.th, styles.cNo]}>#</Text>
        <Text style={[styles.th, styles.cTrxNo]}>No. Transaksi</Text>
        {isAdmin && <Text style={[styles.th, styles.cCashier]}>Kasir</Text>}
        <Text style={[styles.th, styles.cMethod, { textAlign: 'center' }]}>Metode</Text>
        <Text style={[styles.th, styles.cItems,  { textAlign: 'center' }]}>Item</Text>
        <Text style={[styles.th, styles.cTotal,  { textAlign: 'right'  }]}>Total</Text>
        <Text style={[styles.th, styles.cTime]}>Waktu</Text>
        <Text style={[styles.th, styles.cAction, { textAlign: 'center' }]}>Aksi</Text>
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

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerInfo}>
          <Text style={styles.bold}>{dispFrom}–{dispTo}</Text>
          {' dari '}
          <Text style={styles.bold}>{dispTotal}</Text>
          {' transaksi · Total: '}
          <Text style={[styles.bold, { color: '#10B981' }]}>
            Rp {pageRevenue.toLocaleString('id-ID')}
          </Text>
        </Text>

        {pgTotal > 1 && (
          <View style={styles.pagination}>
            <PageBtn onPress={() => goTo(pg - 1)} disabled={pg === 1}>
              <ChevronLeft size={14} color={pg === 1 ? '#CBD5E1' : '#475569'} />
            </PageBtn>
            {pageNums.map(num => (
              <PageBtn key={num} onPress={() => goTo(num)} active={num === pg}>
                <Text style={[styles.pageTxt, num === pg && styles.pageTxtActive]}>{num}</Text>
              </PageBtn>
            ))}
            <PageBtn onPress={() => goTo(pg + 1)} disabled={pg === pgTotal}>
              <ChevronRight size={14} color={pg === pgTotal ? '#CBD5E1' : '#475569'} />
            </PageBtn>
          </View>
        )}

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <RotateCcw size={13} color="#475569" />
          <Text style={styles.refreshTxt}>Perbarui</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── ROW ──────────────────────────────────────────────────
const Row = ({ transaction: t, rowNumber, isEven, isAdmin, onViewPress }: {
  transaction: Transaction; rowNumber: number;
  isEven: boolean; isAdmin: boolean;
  onViewPress: (t: Transaction) => void;
}) => {
  const date      = t.date?.toDate?.() || null;
  const timeStr   = date ? date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—';
  const dateStr   = date ? date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '—';
  const itemCount = Array.isArray(t.items) ? t.items.reduce((s: number, i: any) => s + (i.qty || 1), 0) : 0;
  const isCash    = (t.paymentMethod || 'cash') === 'cash';

  return (
    <View style={[styles.row, !isEven && styles.rowAlt]}>
      <View style={[styles.cell, styles.cNo]}>
        <Text style={styles.rowNo}>{rowNumber}</Text>
      </View>
      <View style={[styles.cell, styles.cTrxNo, { gap: 8 }]}>
        <View style={styles.trxIcon}><Receipt size={14} color={COLORS.primary} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.trxNumber} numberOfLines={1}>{t.transactionNumber || t.id.slice(0, 12) + '...'}</Text>
          <Text style={styles.trxId} numberOfLines={1}>ID: {t.id.slice(0, 8)}...</Text>
        </View>
      </View>
      {isAdmin && (
        <View style={[styles.cell, styles.cCashier]}>
          <Text style={styles.cashierText} numberOfLines={1}>{t.cashierName || '—'}</Text>
        </View>
      )}
      <View style={[styles.cell, styles.cMethod, { justifyContent: 'center' }]}>
        <View style={[styles.methodBadge, { backgroundColor: isCash ? '#F0FDF4' : '#EFF6FF' }]}>
          {isCash ? <Banknote size={12} color="#10B981" /> : <CreditCard size={12} color="#3B82F6" />}
          <Text style={[styles.methodText, { color: isCash ? '#10B981' : '#3B82F6' }]}>
            {isCash ? 'Tunai' : 'QRIS'}
          </Text>
        </View>
      </View>
      <View style={[styles.cell, styles.cItems, { justifyContent: 'center' }]}>
        <View style={styles.itemBadge}>
          <Text style={styles.itemCount}>{itemCount}</Text>
          <Text style={styles.itemUnit}>item</Text>
        </View>
      </View>
      <View style={[styles.cell, styles.cTotal, { justifyContent: 'flex-end' }]}>
        <Text style={styles.totalText}>Rp {(t.total || 0).toLocaleString('id-ID')}</Text>
      </View>
      <View style={[styles.cell, styles.cTime]}>
        <Text style={styles.timeDate}>{dateStr}</Text>
        <Text style={styles.timeHour}>{timeStr}</Text>
      </View>
      <View style={[styles.cell, styles.cAction, { justifyContent: 'center' }]}>
        <TouchableOpacity style={styles.viewBtn} onPress={() => onViewPress(t)}>
          <Eye size={13} color={COLORS.primary} />
          <Text style={styles.viewBtnText}>Detail</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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

const EmptyState = () => (
  <View style={styles.empty}>
    <View style={styles.emptyCircle}>
      <PackageSearch size={48} color="#94A3B8" strokeWidth={1.5} />
    </View>
    <Text style={styles.emptyText}>Belum ada transaksi</Text>
    <Text style={styles.emptyHint}>Transaksi akan muncul setelah kasir melakukan penjualan</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  tableHead: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4 },
  th:        { fontSize: 11, fontFamily: 'PoppinsBold', color: '#94A3B8', textTransform: 'uppercase' as any, letterSpacing: 0.5 },

  cNo:      { width: 36 },
  cTrxNo:   { flex: 2.5 },
  cCashier: { flex: 1.5 },
  cMethod:  { flex: 1.2 },
  cItems:   { flex: 1 },
  cTotal:   { flex: 1.5 },
  cTime:    { flex: 1.5 },
  cAction:  { flex: 1 },

  row:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 8, marginBottom: 3, borderWidth: 1, borderColor: '#F1F5F9' },
  rowAlt: { backgroundColor: '#FAFBFC' },
  cell:   { flexDirection: 'row', alignItems: 'center' },
  rowNo:  { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#CBD5E1', width: 36 },

  trxIcon:    { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(28,58,90,0.07)', alignItems: 'center', justifyContent: 'center' },
  trxNumber:  { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  trxId:      { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 1 },
  cashierText:{ fontSize: 12, fontFamily: 'PoppinsMedium', color: '#475569' },
  methodBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  methodText: { fontSize: 11, fontFamily: 'PoppinsBold' },
  itemBadge:  { backgroundColor: '#F0F9FF', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  itemCount:  { fontSize: 13, fontFamily: 'PoppinsBold', color: '#0EA5E9' },
  itemUnit:   { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  totalText:  { fontSize: 13, fontFamily: 'PoppinsBold', color: '#1E293B' },
  timeDate:   { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  timeHour:   { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginLeft: 4 },
  viewBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(28,58,90,0.07)', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6, cursor: 'pointer' as any },
  viewBtnText:{ fontSize: 12, fontFamily: 'PoppinsSemiBold', color: COLORS.primary },

  footer:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0', flexWrap: 'wrap' as any, gap: 10 },
  footerInfo: { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#64748B' },
  bold:       { fontFamily: 'PoppinsBold', color: '#1E293B' },

  pagination:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pageBtn:         { minWidth: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, cursor: 'pointer' as any },
  pageBtnActive:   { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  pageBtnDisabled: { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' },
  pageTxt:         { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#475569' },
  pageTxtActive:   { color: '#FFF', fontFamily: 'PoppinsBold' },

  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 7, borderWidth: 1, borderColor: '#E2E8F0', cursor: 'pointer' as any },
  refreshTxt: { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#475569' },

  empty:       { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText:   { fontSize: 15, fontFamily: 'PoppinsBold', color: '#94A3B8', marginBottom: 6 },
  emptyHint:   { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#CBD5E1', textAlign: 'center', maxWidth: 280 },
});

export default TransactionListWeb;