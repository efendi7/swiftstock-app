/**
 * CashierListWeb.tsx
 * Tabel kasir dengan server-side pagination support.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  Users, ChevronLeft, ChevronRight, RotateCcw,
  Clock, Sun, Sunset, Moon, CalendarDays,
  CheckCircle2, XCircle, ShieldOff, ShieldCheck,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Cashier, ShiftType, DAY_LABELS } from '../../services/cashierService';

interface Props {
  data:           Cashier[];
  refreshing:     boolean;
  onRefresh:      () => void;
  isAdmin:        boolean;
  onEditShift:    (cashier: Cashier) => void;
  onToggleStatus: (cashier: Cashier) => void;
  usePagination?: boolean;
  currentPage?:   number;
  totalPages?:    number;
  totalCount?:    number;
  pageSize?:      number;
  onPageChange?:  (page: number) => void;
}

const PAGE_SIZE_DEFAULT = 20;

const CashierListWeb = ({
  data, refreshing, onRefresh, isAdmin,
  onEditShift, onToggleStatus,
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

  const pg         = usePagination ? serverPage       : localPage;
  const pgTotal    = usePagination ? serverTotalPages : Math.ceil(data.length / pageSize);
  const sliceStart = usePagination ? 0               : (localPage - 1) * pageSize;
  const rows       = usePagination ? data             : data.slice(sliceStart, sliceStart + pageSize);

  const dispFrom  = usePagination ? (serverPage - 1) * pageSize + 1 : sliceStart + 1;
  const dispTotal = usePagination ? (totalCount ?? data.length)     : data.length;
  const dispTo    = Math.min(dispFrom + rows.length - 1, dispTotal);

  const goTo = (page: number) => {
    if (usePagination) onPageChange?.(page);
    else setLocalPage(page);
  };

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
        <Text style={[styles.th, styles.cName]}>Kasir</Text>
        <Text style={[styles.th, styles.cEmail]}>Email</Text>
        <Text style={[styles.th, styles.cShift, { textAlign: 'center' }]}>Shift</Text>
        <Text style={[styles.th, styles.cDays]}>Hari Aktif</Text>
        <Text style={[styles.th, styles.cStatus, { textAlign: 'center' }]}>Status</Text>
        {isAdmin && <Text style={[styles.th, styles.cAction, { textAlign: 'center' }]}>Aksi</Text>}
      </View>

      {/* ROWS */}
      {rows.map((item, i) => (
        <Row
          key={item.id}
          cashier={item}
          rowNumber={dispFrom + i}
          isEven={i % 2 === 0}
          isAdmin={isAdmin}
          onEditShift={onEditShift}
          onToggleStatus={onToggleStatus}
        />
      ))}

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerInfo}>
          <Text style={styles.bold}>{dispFrom}–{dispTo}</Text>
          {' dari '}
          <Text style={styles.bold}>{dispTotal}</Text>
          {' kasir'}
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
const Row = ({ cashier: c, rowNumber, isEven, isAdmin, onEditShift, onToggleStatus }: {
  cashier: Cashier; rowNumber: number; isEven: boolean; isAdmin: boolean;
  onEditShift: (c: Cashier) => void;
  onToggleStatus: (c: Cashier) => void;
}) => {
  const isActive = c.status === 'active';
  return (
    <View style={[styles.row, !isEven && styles.rowAlt]}>
      <View style={[styles.cell, styles.cNo]}>
        <Text style={styles.rowNo}>{rowNumber}</Text>
      </View>
      <View style={[styles.cell, styles.cName, { gap: 10 }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{c.displayName?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <View>
          <Text style={styles.nameText} numberOfLines={1}>{c.displayName}</Text>
          <Text style={styles.roleText}>Kasir</Text>
        </View>
      </View>
      <View style={[styles.cell, styles.cEmail]}>
        <Text style={styles.emailText} numberOfLines={1}>{c.email}</Text>
      </View>
      <View style={[styles.cell, styles.cShift, { justifyContent: 'center' }]}>
        <ShiftBadge shift={c.shift?.type ?? null} />
      </View>
      <View style={[styles.cell, styles.cDays, { gap: 3 }]}>
        {c.shift?.days && c.shift.days.length > 0
          ? c.shift.days.map(d => (
              <View key={d} style={styles.dayChip}>
                <Text style={styles.dayChipText}>{DAY_LABELS[d]}</Text>
              </View>
            ))
          : <Text style={styles.noDays}>—</Text>
        }
      </View>
      <View style={[styles.cell, styles.cStatus, { justifyContent: 'center' }]}>
        <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
          {isActive ? <CheckCircle2 size={11} color="#10B981" /> : <XCircle size={11} color="#EF4444" />}
          <Text style={[styles.statusText, { color: isActive ? '#10B981' : '#EF4444' }]}>
            {isActive ? 'Aktif' : 'Nonaktif'}
          </Text>
        </View>
      </View>
      {isAdmin && (
        <View style={[styles.cell, styles.cAction, { gap: 6, justifyContent: 'center' }]}>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEditShift(c)}>
            <Clock size={12} color={COLORS.primary} />
            <Text style={styles.editBtnText}>Shift</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, isActive ? styles.toggleBtnOff : styles.toggleBtnOn]}
            onPress={() => onToggleStatus(c)}
          >
            {isActive ? <ShieldOff size={12} color="#EF4444" /> : <ShieldCheck size={12} color="#10B981" />}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ── SHIFT BADGE ───────────────────────────────────────────
const SHIFT_CONFIG: Record<ShiftType, { label: string; bg: string; color: string; Icon: any }> = {
  pagi:  { label: 'Pagi',  bg: '#FEF3C7', color: '#D97706', Icon: Sun         },
  siang: { label: 'Siang', bg: '#FFF7ED', color: '#EA580C', Icon: Sunset      },
  malam: { label: 'Malam', bg: '#EFF6FF', color: '#3B82F6', Icon: Moon        },
  full:  { label: 'Full',  bg: '#F0FDF4', color: '#10B981', Icon: CalendarDays},
};

const ShiftBadge = ({ shift }: { shift: ShiftType | null }) => {
  if (!shift) return (
    <View style={[styles.shiftBadge, { backgroundColor: '#F1F5F9' }]}>
      <Text style={[styles.shiftText, { color: '#94A3B8' }]}>Belum</Text>
    </View>
  );
  const { label, bg, color, Icon } = SHIFT_CONFIG[shift];
  return (
    <View style={[styles.shiftBadge, { backgroundColor: bg }]}>
      <Icon size={11} color={color} />
      <Text style={[styles.shiftText, { color }]}>{label}</Text>
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
      <Users size={48} color="#94A3B8" strokeWidth={1.5} />
    </View>
    <Text style={styles.emptyText}>Belum ada kasir</Text>
    <Text style={styles.emptyHint}>Tambah kasir untuk membantu operasional toko</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  tableHead: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4 },
  th:        { fontSize: 11, fontFamily: 'PoppinsBold', color: '#94A3B8', textTransform: 'uppercase' as any, letterSpacing: 0.5 },

  cNo:     { width: 36 },
  cName:   { flex: 2 },
  cEmail:  { flex: 2 },
  cShift:  { flex: 1.2 },
  cDays:   { flex: 2, flexDirection: 'row', flexWrap: 'wrap' as any, gap: 3 },
  cStatus: { flex: 1.2 },
  cAction: { flex: 1.5 },

  row:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, marginBottom: 3, borderWidth: 1, borderColor: '#F1F5F9' },
  rowAlt: { backgroundColor: '#FAFBFC' },
  cell:   { flexDirection: 'row', alignItems: 'center' },
  rowNo:  { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#CBD5E1', width: 36 },

  avatar:     { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.primary + '18', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontFamily: 'PoppinsBold', color: COLORS.primary },
  nameText:   { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  roleText:   { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 1 },
  emailText:  { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#475569' },

  shiftBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  shiftText:  { fontSize: 11, fontFamily: 'PoppinsBold' },

  dayChip:     { backgroundColor: '#F1F5F9', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  dayChipText: { fontSize: 10, fontFamily: 'PoppinsBold', color: '#475569' },
  noDays:      { fontSize: 12, color: '#CBD5E1', fontFamily: 'PoppinsRegular' },

  statusBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  statusActive:   { backgroundColor: '#F0FDF4' },
  statusInactive: { backgroundColor: '#FEF2F2' },
  statusText:     { fontSize: 11, fontFamily: 'PoppinsBold' },

  editBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(28,58,90,0.07)', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 6, cursor: 'pointer' as any },
  editBtnText:  { fontSize: 11, fontFamily: 'PoppinsSemiBold', color: COLORS.primary },
  toggleBtn:    { width: 30, height: 30, borderRadius: 7, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' as any },
  toggleBtnOff: { backgroundColor: '#FEF2F2' },
  toggleBtnOn:  { backgroundColor: '#F0FDF4' },

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

export default CashierListWeb;