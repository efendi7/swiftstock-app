import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Collapsible from 'react-native-collapsible';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import MonthPicker from './MonthPicker';

// Definisi Tipe Filter Baru
type SortType = 'newest' | 'oldest' | 'stock-high' | 'stock-low' | 'low-stock-warn' | 'safe-stock';
type FilterMode = 'all' | 'specificMonth' | 'today';

interface Props {
  products: any[];
  searchQuery: string;
  filterMode: FilterMode;
  sortType: SortType;
  selectedMonth: number;
  selectedYear: number;
  onFiltered: (filtered: any[]) => void;
  onFilterModeChange: (mode: FilterMode) => void;
  onSortChange: (sort: SortType) => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

const FilterSection = ({
  products,
  searchQuery,
  filterMode,
  sortType,
  selectedMonth,
  selectedYear,
  onFiltered,
  onFilterModeChange,
  onSortChange,
  onMonthChange,
  onYearChange,
}: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const applyFilters = useCallback(() => {
    let filtered = [...products];

    // 1. Filter Berdasarkan Pencarian
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.supplier?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    // 2. Filter Berdasarkan Waktu (Bulan/Hari Ini)
    if (filterMode === 'specificMonth') {
      filtered = filtered.filter(p => {
        if (!p.createdAt) return false;
        const date = p.createdAt.toDate();
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      });
    }

    if (filterMode === 'today') {
      const today = new Date();
      filtered = filtered.filter(p => {
        if (!p.createdAt) return false;
        const date = p.createdAt.toDate();
        return date.toDateString() === today.toDateString();
      });
    }

    // 3. Filter Berdasarkan Kondisi Stok
    if (sortType === 'low-stock-warn') {
      filtered = filtered.filter(p => p.stock < 10);
    } else if (sortType === 'safe-stock') {
      filtered = filtered.filter(p => p.stock >= 10);
    }

    // 4. Pengurutan (Sorting)
    filtered.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
      const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
      
      switch (sortType) {
        case 'newest': return dateB - dateA;
        case 'oldest': return dateA - dateB;
        case 'stock-high': return b.stock - a.stock;
        case 'stock-low': return a.stock - b.stock;
        default: return 0;
      }
    });

    onFiltered(filtered);
  }, [products, searchQuery, filterMode, sortType, selectedMonth, selectedYear, onFiltered]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Helper untuk time filter buttons (Hari Ini & Pilih Bulan)
  const TimeFilterBtn = ({ label, mode, active }: any) => (
    <TouchableOpacity
      style={[styles.timeFilterItem, active && { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary }]}
      onPress={() => onFilterModeChange(mode)}
    >
      <Text style={[styles.timeFilterText, active && styles.gridTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  // Helper untuk sorting/stock filter buttons
  const FilterBtn = ({ label, type, active, color = COLORS.secondary }: any) => (
    <TouchableOpacity
      style={[styles.gridItem, active && { backgroundColor: color, borderColor: color }]}
      onPress={() => onSortChange(type)}
    >
      <Text style={[styles.gridText, active && styles.gridTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.toggle} 
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.toggleLeft}>
          <Filter size={18} color={COLORS.secondary} />
          <Text style={styles.toggleText}>Filter & Urutkan</Text>
        </View>
        <View style={styles.toggleRight}>
          <Text style={styles.countText}>{products.length} Produk</Text>
          {isExpanded ? <ChevronUp size={20} color="#94A3B8" /> : <ChevronDown size={20} color="#94A3B8" />}
        </View>
      </TouchableOpacity>

      <Collapsible collapsed={!isExpanded} duration={300}>
        <View style={styles.filterBox}>
          {/* BARIS PERTAMA: TIME FILTERS (2 KOLOM) */}
          <View style={styles.timeFilterRow}>
            <TimeFilterBtn label="Hari Ini" mode="today" active={filterMode === 'today'} />
            <TimeFilterBtn label="Pilih Bulan" mode="specificMonth" active={filterMode === 'specificMonth'} />
          </View>

          {/* MONTH PICKER - Muncul smooth dengan Collapsible */}
          <Collapsible collapsed={filterMode !== 'specificMonth'} duration={300}>
            <View style={styles.monthPickerWrapper}>
              <MonthPicker
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onMonthChange={onMonthChange}
                onYearChange={onYearChange}
              />
            </View>
          </Collapsible>

          {/* BARIS KEDUA & KETIGA: SORTING & STOCK FILTERS (3 KOLOM) */}
          <View style={styles.gridContainer}>
            <FilterBtn label="Terbaru" type="newest" active={sortType === 'newest'} />
            <FilterBtn label="Tertinggi" type="stock-high" active={sortType === 'stock-high'} />
            <FilterBtn label="Terendah" type="stock-low" active={sortType === 'stock-low'} />
            
            <FilterBtn label="Terlama" type="oldest" active={sortType === 'oldest'} />
            <FilterBtn label="Stok < 10" type="low-stock-warn" active={sortType === 'low-stock-warn'} color={COLORS.danger} />
            <FilterBtn label="Stok Aman" type="safe-stock" active={sortType === 'safe-stock'} color={COLORS.success} />
          </View>
        </View>
      </Collapsible>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  toggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleText: { 
    color: '#1E293B', 
    fontFamily: 'PoppinsSemiBold', 
    fontSize: 14 
  },
  countText: { 
    color: '#64748B', 
    fontFamily: 'PoppinsMedium', 
    fontSize: 12 
  },
  filterBox: { 
    paddingHorizontal: 16, 
    paddingBottom: 20,
    paddingTop: 5,
  },
  
  // TIME FILTER SECTION (Hari Ini & Pilih Bulan)
  timeFilterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  timeFilterItem: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeFilterText: { 
    color: '#64748B', 
    fontSize: 13, 
    fontFamily: 'PoppinsSemiBold',
  },
  
  // MONTH PICKER
  monthPickerWrapper: {
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  
  // SORTING & STOCK FILTERS GRID (3 KOLOM)
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: '31.5%', // Grid 3 kolom
    paddingVertical: 10,
    paddingHorizontal: 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gridText: { 
    color: '#64748B', 
    fontSize: 11, 
    fontFamily: 'PoppinsMedium',
    textAlign: 'center'
  },
  gridTextActive: { 
    color: '#FFF', 
    fontFamily: 'PoppinsBold' 
  },
});

export default FilterSection;