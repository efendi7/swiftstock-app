/**
 * TransactionFilterWeb.tsx
 * Sidebar filter transaksi — layout sama persis dengan FilterSectionWeb (products).
 * Fixed, tidak scroll, collapsible sections.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
} from 'react-native';
import {
  Search, X, Clock, Calendar, RotateCcw,
  ArrowDownUp, ArrowUpDown, ChevronDown, ChevronUp,
  Receipt, User, TrendingDown, TrendingUp,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Transaction, FilterMode, SortType } from '../../types/transaction.type';

interface Props {
  transactions:    Transaction[];
  searchQuery:     string;
  onSearchChange:  (text: string) => void;
  filterMode:      FilterMode;
  sortType:        SortType;
  isAdmin:         boolean;
  onFiltered:      (filtered: Transaction[]) => void;
  onFilterChange:  (mode: FilterMode) => void;
  onSortChange:    (sort: SortType) => void;
}

const TransactionFilterWeb = ({
  transactions, searchQuery, onSearchChange,
  filterMode, sortType, isAdmin,
  onFiltered, onFilterChange, onSortChange,
}: Props) => {
  const [selectedDate,        setSelectedDate]        = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility]= useState(false);
  const [currentCount,        setCurrentCount]        = useState(transactions.length);

  const [openWaktu,   setOpenWaktu]   = useState(true);
  const [openUrutan,  setOpenUrutan]  = useState(true);

  const handleReset = () => {
    onSearchChange('');
    onFilterChange('all');
    onSortChange('latest');
  };

  const applyFilters = useCallback(() => {
    let f = [...transactions];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter(t =>
        (t.transactionNumber || '').toLowerCase().includes(q) ||
        (t.cashierName       || '').toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }

    // Filter waktu
    const toDateStr = (ts: any) => {
      if (!ts) return null;
      if (ts.toDate)          return ts.toDate().toDateString();
      if (ts instanceof Date) return ts.toDateString();
      return new Date(ts).toDateString();
    };

    if (filterMode === 'today') {
      const today = new Date().toDateString();
      f = f.filter(t => toDateStr(t.date) === today);
    } else if (filterMode === 'specificMonth') {
      const target = selectedDate.toDateString();
      f = f.filter(t => toDateStr(t.date) === target);
    }

    // Sort
    f.sort((a, b) => {
      const ta = a.date?.toDate?.()?.getTime() || 0;
      const tb = b.date?.toDate?.()?.getTime() || 0;
      return sortType === 'latest' ? tb - ta : ta - tb;
    });

    setCurrentCount(f.length);
    onFiltered(f);
  }, [transactions, searchQuery, filterMode, sortType, selectedDate]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  const hasActive = searchQuery !== '' || filterMode !== 'all' || sortType !== 'latest';

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Receipt size={15} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Filter Transaksi</Text>
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
          placeholder="No. transaksi / kasir..."
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
          <Text style={styles.resultBold}>{transactions.length}</Text>
          {' transaksi'}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* SECTION: WAKTU */}
      <TouchableOpacity style={styles.sectionHeader} onPress={() => setOpenWaktu(!openWaktu)}>
        <View style={styles.sectionLeft}>
          <Clock size={12} color={COLORS.secondary} />
          <Text style={styles.sectionTitle}>Waktu</Text>
        </View>
        {openWaktu ? <ChevronUp size={13} color="#94A3B8" /> : <ChevronDown size={13} color="#94A3B8" />}
      </TouchableOpacity>

      {openWaktu && (
        <View style={styles.sectionBody}>
          {([
            { key: 'all',           label: 'Semua',        icon: <ArrowDownUp size={11} color={filterMode === 'all'           ? '#FFF' : '#64748B'} /> },
            { key: 'today',         label: 'Hari Ini',     icon: <Clock       size={11} color={filterMode === 'today'         ? '#FFF' : '#64748B'} /> },
            { key: 'specificMonth', label: 'Tanggal',      icon: <Calendar    size={11} color={filterMode === 'specificMonth' ? '#FFF' : '#64748B'} /> },
          ] as { key: FilterMode; label: string; icon: any }[]).map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.filterBtn, filterMode === opt.key && styles.filterBtnActive]}
              onPress={() => {
                onFilterChange(opt.key);
                if (opt.key === 'specificMonth') setDatePickerVisibility(true);
              }}
            >
              {opt.icon}
              <Text style={[styles.filterBtnText, filterMode === opt.key && styles.filterBtnTextActive]}>
                {opt.key === 'specificMonth' && filterMode === 'specificMonth'
                  ? selectedDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
                  : opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.divider} />

      {/* SECTION: URUTAN */}
      <TouchableOpacity style={styles.sectionHeader} onPress={() => setOpenUrutan(!openUrutan)}>
        <View style={styles.sectionLeft}>
          <ArrowUpDown size={12} color={COLORS.secondary} />
          <Text style={styles.sectionTitle}>Urutan</Text>
        </View>
        {openUrutan ? <ChevronUp size={13} color="#94A3B8" /> : <ChevronDown size={13} color="#94A3B8" />}
      </TouchableOpacity>

      {openUrutan && (
        <View style={styles.sectionBody}>
          {([
            { key: 'latest',  label: 'Terbaru',  icon: <TrendingDown size={11} color={sortType === 'latest'  ? '#FFF' : '#64748B'} /> },
            { key: 'oldest',  label: 'Terlama',  icon: <TrendingUp   size={11} color={sortType === 'oldest'  ? '#FFF' : '#64748B'} /> },
          ] as { key: SortType; label: string; icon: any }[]).map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.filterBtn, sortType === opt.key && styles.filterBtnActive]}
              onPress={() => onSortChange(opt.key)}
            >
              {opt.icon}
              <Text style={[styles.filterBtnText, sortType === opt.key && styles.filterBtnTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={(date) => { setSelectedDate(date); setDatePickerVisibility(false); }}
        onCancel={() => setDatePickerVisibility(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    overflow: 'hidden' as any,
  },

  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerTitle:{ fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  resetBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  resetText:  { fontSize: 10, fontFamily: 'PoppinsMedium', color: '#EF4444' },

  searchBox:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 10, height: 34, gap: 7, marginBottom: 8 },
  searchInput:{ flex: 1, fontSize: 12, fontFamily: 'PoppinsRegular', color: '#1E293B', padding: 0 },

  resultBadge:{ backgroundColor: '#F1F5F9', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 10 },
  resultText: { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#64748B' },
  resultBold: { fontFamily: 'PoppinsBold', color: '#1E293B' },

  divider:    { height: 1, backgroundColor: '#F1F5F9', marginVertical: 8 },

  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  sectionLeft:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 11, fontFamily: 'PoppinsSemiBold', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 },
  sectionBody:  { gap: 5, paddingBottom: 4 },

  filterBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  filterBtnActive:{ backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  filterBtnText:  { fontSize: 11, fontFamily: 'PoppinsMedium', color: '#64748B' },
  filterBtnTextActive: { color: '#FFF', fontFamily: 'PoppinsBold' },

  metrikCard:   { backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8, marginBottom: 4 },
  metrikLabel:  { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginBottom: 2 },
  metrikValue:  { fontSize: 14, fontFamily: 'PoppinsBold', color: '#1E293B' },
});

export default TransactionFilterWeb;