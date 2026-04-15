/**
 * components/products/FilterSectionWeb.tsx
 * Sidebar filter produk — collapsible, scrollable.
 * Pakai komponen reusable: SidebarSection, FilterChip dari common/web.
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  Search,
  X,
  Clock,
  Calendar,
  TrendingUp,
  Package,
  AlertTriangle,
  PackageX,
  RotateCcw,
  ArrowDownUp,
  ArrowUpDown,
} from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import SidebarSection from '@components/common/web/SidebarSection';
import FilterChip from '@components/common/web/FilterChip';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

interface Props {
  products: any[];
  searchQuery: string;
  onSearchChange: (text: string) => void;
  filterMode: 'all' | 'today' | 'range';
  sortType: string;
  userRole?: 'admin' | 'kasir';
  onFiltered: (filtered: any[]) => void;
  onFilterModeChange: (mode: 'all' | 'today' | 'range') => void;
  onSortChange: (sort: string) => void;
}

const FilterSectionWeb = ({
  products,
  searchQuery,
  onSearchChange,
  filterMode,
  sortType,
  userRole,
  onFiltered,
  onFilterModeChange,
  onSortChange,
}: Props) => {
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentCount, setCurrentCount] = useState(products.length);
  const [openWaktu, setOpenWaktu] = useState(true);
  const [openStok, setOpenStok] = useState(true);
  const [openUrutan, setOpenUrutan] = useState(true);

  const handleReset = () => {
    onSearchChange('');
    onFilterModeChange('all');
    onSortChange('date-desc');
  };

  const applyFilters = useCallback(() => {
    let f = [...products];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter(
        p =>
          p.name?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q),
      );
    }
    const toDateStr = (ts: any) => {
      if (!ts) return null;
      if (ts.toDate) return ts.toDate().toDateString();
      if (ts instanceof Date) return ts.toDateString();
      return new Date(ts).toDateString();
    };
    if (filterMode === 'today') {
      const today = new Date().toDateString();
      f = f.filter(p => toDateStr(p.createdAt) === today);
    } else if (filterMode === 'range') {
      const target = selectedDate.toDateString();
      f = f.filter(p => toDateStr(p.createdAt) === target);
    }
    if (sortType === 'stock-safe') f = f.filter(p => (p.stock || 0) > 10);
    if (sortType === 'stock-critical')
      f = f.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10);
    if (sortType === 'stock-empty') f = f.filter(p => (p.stock || 0) <= 0);
    f.sort((a, b) => {
      const dA = a.createdAt?.toDate?.()?.getTime() || 0;
      const dB = b.createdAt?.toDate?.()?.getTime() || 0;
      if (sortType === 'sold-desc')
        return (b.soldCount || 0) - (a.soldCount || 0);
      if (sortType === 'date-desc') return dB - dA;
      if (sortType === 'date-asc') return dA - dB;
      return 0;
    });
    setCurrentCount(f.length);
    onFiltered(f);
  }, [products, searchQuery, filterMode, sortType, selectedDate, onFiltered]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const hasActive =
    searchQuery !== '' || filterMode !== 'all' || sortType !== 'date-desc';

  return (
    <View style={s.wrap}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled">
        
        {/* SEARCH + RESET (Sekarang Full Width & Konsisten dengan Transaksi) */}
<View style={s.topRow}>
  <View style={s.searchRow}>
    <Search size={13} color="#94A3B8" />
    <TextInput
      style={[s.searchInput, { outlineStyle: 'none' } as any]}
      placeholder={userRole === 'admin' ? 'Nama, barcode, kategori...' : 'Cari produk...'}
      value={searchQuery}
      onChangeText={onSearchChange}
      placeholderTextColor="#94A3B8"
    />
    {searchQuery.length > 0 && (
      <TouchableOpacity onPress={() => onSearchChange('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <X size={12} color="#94A3B8" />
      </TouchableOpacity>
    )}
  </View>
  
  {hasActive && (
    <TouchableOpacity style={s.resetBtn} onPress={handleReset}>
      <RotateCcw size={10} color="#EF4444" />
    </TouchableOpacity>
  )}
</View>

<View style={s.divider} />

       {/* WAKTU */}
<SidebarSection
  title="Waktu"
  isOpen={openWaktu}
  onToggle={() => setOpenWaktu(v => !v)}
  hasActive={filterMode !== 'all'}
  onReset={() => onFilterModeChange('all')}
>
  {/* Tambahkan Chip Semua di sini */}
  <FilterChip
    label="Semua"
    active={filterMode === 'all'}
    icon={<ArrowDownUp size={12} color={filterMode === 'all' ? '#FFF' : COLORS.secondary} />}
    onPress={() => onFilterModeChange('all')}
  />

  <FilterChip
    label="Hari Ini"
    active={filterMode === 'today'}
    icon={<Clock size={12} color={filterMode === 'today' ? '#FFF' : COLORS.secondary} />}
    onPress={() => onFilterModeChange(filterMode === 'today' ? 'all' : 'today')}
  />

  <FilterChip
    label={filterMode === 'range'
      ? selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      : 'Pilih Tanggal'}
    active={filterMode === 'range'}
    icon={<Calendar size={12} color={filterMode === 'range' ? '#FFF' : COLORS.secondary} />}
    onPress={() => setDatePickerVisible(true)}
  />
</SidebarSection>
        <View style={s.divider} />

        {/* STOK */}
        <SidebarSection
          title="Stok"
          isOpen={openStok}
          onToggle={() => setOpenStok(v => !v)}
          hasActive={['stock-safe', 'stock-critical', 'stock-empty'].includes(
            sortType,
          )}
          onReset={() => onSortChange('date-desc')}>
          <FilterChip
            label="Aman"
            sublabel=">10"
            active={sortType === 'stock-safe'}
            activeColor="#22C55E"
            icon={
              <Package
                size={12}
                color={sortType === 'stock-safe' ? '#FFF' : '#22C55E'}
              />
            }
            onPress={() =>
              onSortChange(
                sortType === 'stock-safe' ? 'date-desc' : 'stock-safe',
              )
            }
          />
          <FilterChip
            label="Kritis"
            sublabel="1-10"
            active={sortType === 'stock-critical'}
            activeColor="#F59E0B"
            icon={
              <AlertTriangle
                size={12}
                color={sortType === 'stock-critical' ? '#FFF' : '#F59E0B'}
              />
            }
            onPress={() =>
              onSortChange(
                sortType === 'stock-critical' ? 'date-desc' : 'stock-critical',
              )
            }
          />
          <FilterChip
            label="Habis"
            sublabel="0"
            active={sortType === 'stock-empty'}
            activeColor="#EF4444"
            icon={
              <PackageX
                size={12}
                color={sortType === 'stock-empty' ? '#FFF' : '#EF4444'}
              />
            }
            onPress={() =>
              onSortChange(
                sortType === 'stock-empty' ? 'date-desc' : 'stock-empty',
              )
            }
          />
        </SidebarSection>

        <View style={s.divider} />

        {/* URUTAN */}
        <SidebarSection
          title="Urutan"
          isOpen={openUrutan}
          onToggle={() => setOpenUrutan(v => !v)}
          hasActive={['sold-desc', 'date-desc', 'date-asc'].includes(sortType)}
          onReset={() => onSortChange('date-desc')}>
          <FilterChip
            label="Terlaris"
            active={sortType === 'sold-desc'}
            icon={
              <TrendingUp
                size={12}
                color={sortType === 'sold-desc' ? '#FFF' : '#F59E0B'}
              />
            }
            onPress={() =>
              onSortChange(sortType === 'sold-desc' ? 'date-desc' : 'sold-desc')
            }
          />
          <FilterChip
            label="Terbaru"
            active={sortType === 'date-desc'}
            icon={
              <ArrowDownUp
                size={12}
                color={sortType === 'date-desc' ? '#FFF' : COLORS.secondary}
              />
            }
            onPress={() => onSortChange('date-desc')}
          />
          <FilterChip
            label="Terlama"
            active={sortType === 'date-asc'}
            icon={
              <ArrowUpDown
                size={12}
                color={sortType === 'date-asc' ? '#FFF' : COLORS.secondary}
              />
            }
            onPress={() =>
              onSortChange(sortType === 'date-asc' ? 'date-desc' : 'date-asc')
            }
          />
        </SidebarSection>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={(date: Date) => {
            setSelectedDate(date);
            onFilterModeChange('range');
            setDatePickerVisible(false);
          }}
          onCancel={() => setDatePickerVisible(false)}
        />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  wrap:    { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 20 },

  // Ini yang bikin Full Width dan sejajar horizontal
  topRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginBottom: 8 // Jarak ke divider
  },
  
  searchRow: { 
    flex: 1, // Memaksa search mengisi sisa ruang (Full Width)
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    borderRadius: 8, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    paddingHorizontal: 9, 
    height: 34, 
    gap: 6 
  },
  
  searchInput: { 
    flex: 1, 
    fontSize: 12, 
    fontFamily: 'PoppinsRegular', 
    color: '#1E293B' 
  },

  // Tombol reset kotak seperti di Transaksi
  resetBtn: { 
    width: 32, 
    height: 32, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#FEE2E2', 
    backgroundColor: '#FFF5F5', 
    alignItems: 'center', 
    justifyContent: 'center', 
    cursor: 'pointer' as any 
  },

  divider: { 
    height: 1, 
    backgroundColor: '#F1F5F9', 
    marginBottom: 10 // Jarak konsisten ke section "Waktu"
  },
});

export default FilterSectionWeb;
