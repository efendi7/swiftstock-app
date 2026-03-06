/**
 * CashierFilterWeb.tsx
 * Sidebar filter kasir — layout sama dengan FilterSectionWeb & TransactionFilterWeb.
 * Filter: Search | Shift | Status | Ringkasan
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import {
  Search, X, RotateCcw, ChevronDown, ChevronUp,
  Users, Clock, ShieldCheck, ShieldOff, ArrowDownUp,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Cashier, ShiftType, SHIFT_LABELS } from '../../services/cashierService';

type StatusFilter = 'all' | 'active' | 'inactive';
type ShiftFilter  = 'all' | ShiftType | 'unassigned';

interface Props {
  cashiers:       Cashier[];
  searchQuery:    string;
  onSearchChange: (text: string) => void;
  shiftFilter:    ShiftFilter;
  statusFilter:   StatusFilter;
  onFiltered:     (filtered: Cashier[]) => void;
  onShiftChange:  (shift: ShiftFilter) => void;
  onStatusChange: (status: StatusFilter) => void;
}

const CashierFilterWeb = ({
  cashiers, searchQuery, onSearchChange,
  shiftFilter, statusFilter,
  onFiltered, onShiftChange, onStatusChange,
}: Props) => {

  const [openShift,   setOpenShift]   = useState(true);
  const [openStatus,  setOpenStatus]  = useState(true);
  const [currentCount, setCurrentCount] = useState(cashiers.length);

  const handleReset = () => {
    onSearchChange('');
    onShiftChange('all');
    onStatusChange('all');
  };

  const applyFilters = useCallback(() => {
    let f = [...cashiers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter(c =>
        c.displayName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }

    if (shiftFilter !== 'all') {
      if (shiftFilter === 'unassigned') {
        f = f.filter(c => !c.shift);
      } else {
        f = f.filter(c => c.shift?.type === shiftFilter);
      }
    }

    if (statusFilter !== 'all') {
      f = f.filter(c => c.status === statusFilter);
    }

    setCurrentCount(f.length);
    onFiltered(f);
  }, [cashiers, searchQuery, shiftFilter, statusFilter]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  const hasActive = searchQuery !== '' || shiftFilter !== 'all' || statusFilter !== 'all';

  const SHIFT_OPTIONS: { key: ShiftFilter; label: string }[] = [
    { key: 'all',        label: 'Semua Shift' },
    { key: 'pagi',       label: 'Pagi' },
    { key: 'siang',      label: 'Siang' },
    { key: 'malam',      label: 'Malam' },
    { key: 'full',       label: 'Full Day' },
    { key: 'unassigned', label: 'Belum Dijadwal' },
  ];

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Users size={15} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Filter Kasir</Text>
        </View>
        {hasActive && (
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <RotateCcw size={11} color="#EF4444" />
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Search size={13} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Nama / email kasir..."
          placeholderTextColor="#CBD5E1"
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <X size={13} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* RESULT BADGE */}
      <View style={styles.resultBadge}>
        <Text style={styles.resultText}>
          <Text style={styles.resultBold}>{currentCount}</Text>
          {' / '}
          <Text style={styles.resultBold}>{cashiers.length}</Text>
          {' kasir'}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* SECTION: SHIFT */}
      <TouchableOpacity style={styles.sectionHeader} onPress={() => setOpenShift(!openShift)}>
        <View style={styles.sectionLeft}>
          <Clock size={12} color={COLORS.secondary} />
          <Text style={styles.sectionTitle}>Shift</Text>
        </View>
        {openShift ? <ChevronUp size={13} color="#94A3B8" /> : <ChevronDown size={13} color="#94A3B8" />}
      </TouchableOpacity>

      {openShift && (
        <View style={styles.sectionBody}>
          {SHIFT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.filterBtn, shiftFilter === opt.key && styles.filterBtnActive]}
              onPress={() => onShiftChange(opt.key)}
            >
              <Clock size={11} color={shiftFilter === opt.key ? '#FFF' : '#64748B'} />
              <Text style={[styles.filterBtnText, shiftFilter === opt.key && styles.filterBtnTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.divider} />

      {/* SECTION: STATUS */}
      <TouchableOpacity style={styles.sectionHeader} onPress={() => setOpenStatus(!openStatus)}>
        <View style={styles.sectionLeft}>
          <ShieldCheck size={12} color={COLORS.secondary} />
          <Text style={styles.sectionTitle}>Status</Text>
        </View>
        {openStatus ? <ChevronUp size={13} color="#94A3B8" /> : <ChevronDown size={13} color="#94A3B8" />}
      </TouchableOpacity>

      {openStatus && (
        <View style={styles.sectionBody}>
          {([
            { key: 'all',      label: 'Semua',    icon: <ArrowDownUp size={11} color={statusFilter === 'all'      ? '#FFF' : '#64748B'} /> },
            { key: 'active',   label: 'Aktif',    icon: <ShieldCheck size={11} color={statusFilter === 'active'   ? '#FFF' : '#64748B'} /> },
            { key: 'inactive', label: 'Nonaktif', icon: <ShieldOff   size={11} color={statusFilter === 'inactive' ? '#FFF' : '#64748B'} /> },
          ] as { key: StatusFilter; label: string; icon: any }[]).map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.filterBtn, statusFilter === opt.key && styles.filterBtnActive]}
              onPress={() => onStatusChange(opt.key)}
            >
              {opt.icon}
              <Text style={[styles.filterBtnText, statusFilter === opt.key && styles.filterBtnTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, overflow: 'hidden' as any },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerTitle: { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  resetBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  resetText:   { fontSize: 10, fontFamily: 'PoppinsMedium', color: '#EF4444' },

  searchBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 10, height: 34, gap: 7, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 12, fontFamily: 'PoppinsRegular', color: '#1E293B', padding: 0 },

  resultBadge: { backgroundColor: '#F1F5F9', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 10 },
  resultText:  { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#64748B' },
  resultBold:  { fontFamily: 'PoppinsBold', color: '#1E293B' },

  divider:      { height: 1, backgroundColor: '#F1F5F9', marginVertical: 8 },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  sectionLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 11, fontFamily: 'PoppinsSemiBold', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 },
  sectionBody:  { gap: 5, paddingBottom: 4 },

  filterBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  filterBtnActive:    { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  filterBtnText:      { fontSize: 11, fontFamily: 'PoppinsMedium', color: '#64748B' },
  filterBtnTextActive:{ color: '#FFF', fontFamily: 'PoppinsBold' },

  metrikCard:  { backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8, marginBottom: 4 },
  metrikLabel: { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginBottom: 2 },
  metrikValue: { fontSize: 14, fontFamily: 'PoppinsBold', color: '#1E293B' },
});

export default CashierFilterWeb;