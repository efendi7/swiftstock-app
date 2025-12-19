import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Collapsible from 'react-native-collapsible';
import { COLORS } from '../../constants/colors';
import MonthPicker from './MonthPicker';

type SortType = 'newest' | 'oldest' | 'stock-high' | 'stock-low';
type FilterMode = 'all' | 'specificMonth';

const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

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

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.supplier?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }

    if (filterMode === 'specificMonth') {
      filtered = filtered.filter(p => {
        if (!p.createdAt) return false;
        const date = p.createdAt.toDate();
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      });
    }

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

  return (
    <>
      <TouchableOpacity style={styles.toggle} onPress={() => setIsExpanded(!isExpanded)}>
        <Text style={styles.toggleText}>
          {isExpanded ? '↑ Tutup Filter' : '↓ Filter & Urutkan'}
        </Text>
        <Text style={styles.countText}>{products.length} Produk</Text>
      </TouchableOpacity>

      <Collapsible collapsed={!isExpanded}>
        <View style={styles.filterBox}>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.chip, filterMode === 'all' && styles.active]}
              onPress={() => onFilterModeChange('all')}
            >
              <Text style={[styles.chipText, filterMode === 'all' && styles.chipTextActive]}>Semua</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, filterMode === 'specificMonth' && styles.active]}
              onPress={() => onFilterModeChange('specificMonth')}
            >
              <Text style={[styles.chipText, filterMode === 'specificMonth' && styles.chipTextActive]}>Bulan</Text>
            </TouchableOpacity>
          </View>

          {filterMode === 'specificMonth' && (
            <MonthPicker
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={onMonthChange}
              onYearChange={onYearChange}
            />
          )}

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.chip, sortType === 'newest' && styles.active]}
              onPress={() => onSortChange('newest')}
            >
              <Text style={[styles.chipText, sortType === 'newest' && styles.chipTextActive]}>Terbaru</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, sortType === 'stock-high' && styles.active]}
              onPress={() => onSortChange('stock-high')}
            >
              <Text style={[styles.chipText, sortType === 'stock-high' && styles.chipTextActive]}>Stok Tinggi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Collapsible>
    </>
  );
};

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  toggleText: { color: COLORS.secondary, fontWeight: 'bold' },
  countText: { color: COLORS.textLight },
  filterBox: { backgroundColor: '#FFF', padding: 15, borderBottomWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { flex: 1, padding: 10, backgroundColor: COLORS.background, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  active: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  chipText: { color: COLORS.textDark, fontSize: 13 },
  chipTextActive: { color: '#FFF', fontWeight: 'bold' },
});

export default FilterSection;