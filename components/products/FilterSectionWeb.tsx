/**
 * FilterSectionWeb.tsx
 * Sidebar filter web — compact, collapsible, TIDAK PERNAH scroll.
 * Teks diperkecil agar semua konten muat dalam tinggi layar.
 * Mobile FilterSection.tsx tidak diubah.
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
} from 'react-native';
import {
  Search, X, Clock, Calendar, TrendingUp,
  Package, AlertTriangle, PackageX,
  RotateCcw, ArrowDownUp, ArrowUpDown,
  ChevronDown, ChevronUp,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

interface FilterProps {
  products: any[];
  searchQuery: string;
  onSearchChange: (text: string) => void;
  filterMode: 'all' | 'today' | 'range';
  sortType: string;
  userRole?: 'admin' | 'kasir';
  onFiltered: (filtered: any[]) => void;
  onFilterModeChange: (mode: any) => void;
  onSortChange: (sort: string) => void;
}

const FilterSectionWeb = ({
  products, searchQuery, onSearchChange,
  filterMode, sortType, userRole,
  onFiltered, onFilterModeChange, onSortChange,
}: FilterProps) => {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentCount, setCurrentCount] = useState(products.length);

  // Semua seksi default terbuka
  const [openWaktu,   setOpenWaktu]   = useState(true);
  const [openStok,    setOpenStok]    = useState(true);
  const [openUrutan,  setOpenUrutan]  = useState(true);

  const handleReset = () => {
    onSearchChange('');
    onFilterModeChange('all');
    onSortChange('default');
  };

  const applyFilters = useCallback(() => {
    let f = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q),
      );
    }

    const toDateStr = (ts: any) => {
      if (!ts) return null;
      if (ts.toDate)         return ts.toDate().toDateString();
      if (ts instanceof Date)return ts.toDateString();
      return new Date(ts).toDateString();
    };

    if (filterMode === 'today') {
      const today = new Date().toDateString();
      f = f.filter(p => toDateStr(p.createdAt) === today);
    } else if (filterMode === 'range') {
      const target = selectedDate.toDateString();
      f = f.filter(p => toDateStr(p.createdAt) === target);
    }

    if (sortType === 'stock-safe')     f = f.filter(p => (p.stock || 0) > 10);
    if (sortType === 'stock-critical') f = f.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10);
    if (sortType === 'stock-empty')    f = f.filter(p => (p.stock || 0) <= 0);

    f.sort((a, b) => {
      const dA = a.createdAt?.toDate?.()?.getTime() || 0;
      const dB = b.createdAt?.toDate?.()?.getTime() || 0;
      if (sortType === 'sold-desc') return (b.soldCount || 0) - (a.soldCount || 0);
      if (sortType === 'date-desc') return dB - dA;
      if (sortType === 'date-asc')  return dA - dB;
      return 0;
    });

    setCurrentCount(f.length);
    onFiltered(f);
  }, [products, searchQuery, filterMode, sortType, selectedDate, onFiltered]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  const hasActive = searchQuery !== '' || filterMode !== 'all' || sortType !== 'default';

  return (
    // PENTING: overflow hidden + tidak ada ScrollView
    // Konten yang tidak muat terpotong di batas bawah sidebar
    <View style={styles.wrap}>

      {/* ── SEARCH ─────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <Search size={13} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder={userRole === 'admin' ? 'Nama, barcode, kategori...' : 'Cari produk...'}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholderTextColor="#94A3B8"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <X size={12} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── RESULT + RESET ─────────────────────────────── */}
      <View style={styles.resultRow}>
        <Text style={styles.resultTxt}>
          <Text style={styles.resultNum}>{currentCount}</Text>
          <Text style={styles.resultOf}> / {products.length}</Text>
        </Text>
        {hasActive && (
          <TouchableOpacity style={styles.resetAll} onPress={handleReset}>
            <RotateCcw size={10} color="#EF4444" />
            <Text style={styles.resetAllTxt}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.divider} />

      {/* ── WAKTU ──────────────────────────────────────── */}
      <Section
        title="Waktu"
        isOpen={openWaktu}
        onToggle={() => setOpenWaktu(v => !v)}
        hasActive={filterMode !== 'all'}
        onReset={() => onFilterModeChange('all')}
      >
        <Chip
          label="Hari Ini"
          active={filterMode === 'today'}
          icon={<Clock size={12} color={filterMode === 'today' ? '#FFF' : COLORS.secondary} />}
          onPress={() => onFilterModeChange(filterMode === 'today' ? 'all' : 'today')}
        />
        <Chip
          label={filterMode === 'range'
            ? selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
            : 'Pilih Tanggal'}
          active={filterMode === 'range'}
          icon={<Calendar size={12} color={filterMode === 'range' ? '#FFF' : COLORS.secondary} />}
          onPress={() => setDatePickerVisibility(true)}
        />
      </Section>

      <View style={styles.divider} />

      {/* ── STATUS STOK ────────────────────────────────── */}
      <Section
        title="Stok"
        isOpen={openStok}
        onToggle={() => setOpenStok(v => !v)}
        hasActive={['stock-safe','stock-critical','stock-empty'].includes(sortType)}
        onReset={() => onSortChange('default')}
      >
        <Chip label="Aman"   sublabel=">10"  active={sortType==='stock-safe'}     activeColor="#22C55E" icon={<Package      size={12} color={sortType==='stock-safe'     ? '#FFF' : '#22C55E'} />} onPress={() => onSortChange(sortType==='stock-safe'     ? 'default' : 'stock-safe')} />
        <Chip label="Kritis" sublabel="1-10" active={sortType==='stock-critical'} activeColor="#F59E0B" icon={<AlertTriangle size={12} color={sortType==='stock-critical' ? '#FFF' : '#F59E0B'} />} onPress={() => onSortChange(sortType==='stock-critical' ? 'default' : 'stock-critical')} />
        <Chip label="Habis"  sublabel="0"    active={sortType==='stock-empty'}    activeColor="#EF4444" icon={<PackageX     size={12} color={sortType==='stock-empty'    ? '#FFF' : '#EF4444'} />} onPress={() => onSortChange(sortType==='stock-empty'    ? 'default' : 'stock-empty')} />
      </Section>

      <View style={styles.divider} />

      {/* ── URUTAN ─────────────────────────────────────── */}
      <Section
        title="Urutan"
        isOpen={openUrutan}
        onToggle={() => setOpenUrutan(v => !v)}
        hasActive={['sold-desc','date-desc','date-asc'].includes(sortType)}
        onReset={() => onSortChange('default')}
      >
        <Chip label="Terlaris" active={sortType==='sold-desc'} icon={<TrendingUp  size={12} color={sortType==='sold-desc'  ? '#FFF' : '#F59E0B'}        />} onPress={() => onSortChange(sortType==='sold-desc'  ? 'default' : 'sold-desc')} />
        <Chip label="Terbaru"  active={sortType==='date-desc'} icon={<ArrowDownUp size={12} color={sortType==='date-desc' ? '#FFF' : COLORS.secondary} />} onPress={() => onSortChange(sortType==='date-desc'  ? 'default' : 'date-desc')} />
        <Chip label="Terlama"  active={sortType==='date-asc'}  icon={<ArrowUpDown size={12} color={sortType==='date-asc'  ? '#FFF' : COLORS.secondary} />} onPress={() => onSortChange(sortType==='date-asc'   ? 'default' : 'date-asc')} />
      </Section>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={(date: Date) => {
          setSelectedDate(date);
          onFilterModeChange('range');
          setDatePickerVisibility(false);
        }}
        onCancel={() => setDatePickerVisibility(false)}
      />
    </View>
  );
};

// ── COLLAPSIBLE SECTION ───────────────────────────────────
const Section = ({ title, isOpen, onToggle, hasActive, onReset, children }: {
  title: string; isOpen: boolean; onToggle: () => void;
  hasActive: boolean; onReset: () => void; children: React.ReactNode;
}) => (
  <View style={styles.section}>
    <TouchableOpacity style={styles.sectionHead} onPress={onToggle} activeOpacity={0.7}>
      <View style={styles.sectionLeft}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {hasActive && <View style={styles.dot} />}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {hasActive && (
          <TouchableOpacity onPress={onReset}>
            <Text style={styles.resetSm}>Reset</Text>
          </TouchableOpacity>
        )}
        {isOpen
          ? <ChevronUp   size={12} color="#94A3B8" />
          : <ChevronDown size={12} color="#94A3B8" />
        }
      </View>
    </TouchableOpacity>

    {isOpen && <View style={styles.chipGroup}>{children}</View>}
  </View>
);

// ── CHIP ──────────────────────────────────────────────────
const Chip = ({ label, sublabel, active, activeColor, icon, onPress }: {
  label: string; sublabel?: string; active: boolean;
  activeColor?: string; icon?: React.ReactNode; onPress: () => void;
}) => {
  const bg     = active ? (activeColor || COLORS.secondary) : '#F8FAFC';
  const border = active ? (activeColor || COLORS.secondary) : '#E2E8F0';

  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: bg, borderColor: border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {icon && <View style={styles.chipIcon}>{icon}</View>}
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]} numberOfLines={1}>
        {label}
        {sublabel ? <Text style={[styles.chipSub, active && styles.chipSubActive]}> {sublabel}</Text> : null}
      </Text>
      {active && <Text style={styles.check}>✓</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Tidak scroll, overflow hidden → konten terpotong di batas bawah sidebar
  wrap: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    // @ts-ignore
    overflow: 'hidden',
  },

  // SEARCH — compact
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    height: 34,
    gap: 6,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: '#1E293B',
  },

  // RESULT ROW
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultTxt: { fontSize: 11, fontFamily: 'PoppinsRegular' },
  resultNum: { fontFamily: 'PoppinsBold', color: COLORS.primary, fontSize: 12 },
  resultOf:  { color: '#94A3B8' },
  resetAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    // @ts-ignore
    cursor: 'pointer',
  },
  resetAllTxt: { fontSize: 10, fontFamily: 'PoppinsSemiBold', color: '#EF4444' },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 10 },

  // SECTION
  section: { marginBottom: 10 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    // @ts-ignore
    cursor: 'pointer',
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'PoppinsBold',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.secondary },
  resetSm: { fontSize: 9, fontFamily: 'PoppinsMedium', color: '#EF4444' },

  // CHIPS
  chipGroup: { gap: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 6,
    gap: 6,
    // @ts-ignore
    cursor: 'pointer',
  },
  chipIcon: { width: 16, alignItems: 'center' },
  chipLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'PoppinsMedium',
    color: '#374151',
  },
  chipLabelActive: { color: '#FFF', fontFamily: 'PoppinsSemiBold' },
  chipSub:         { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  chipSubActive:   { color: 'rgba(255,255,255,0.7)' },
  check: { fontSize: 11, color: '#FFF', fontFamily: 'PoppinsBold' },
});

export default FilterSectionWeb;