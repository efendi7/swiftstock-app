import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Collapsible from 'react-native-collapsible';
import { ChevronDown, ChevronUp, Filter, Calendar, TrendingUp, Clock } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import DateTimePickerModal from "react-native-modal-datetime-picker";

interface FilterProps {
  products: any[];
  searchQuery: string;
  filterMode: 'all' | 'today' | 'range';
  sortType: string;
  onFiltered: (filtered: any[]) => void;
  onFilterModeChange: (mode: any) => void;
  onSortChange: (sort: string) => void;
}

export const FilterSection = ({
  products,
  searchQuery,
  filterMode,
  sortType,
  onFiltered,
  onFilterModeChange,
  onSortChange,
}: FilterProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentCount, setCurrentCount] = useState(products.length);

  const applyFilters = useCallback(() => {
    let filtered = [...products];

    // 1. Filter Pencarian
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.barcode.includes(q)
      );
    }

    // 2. Filter Waktu (Berdasarkan Tanggal Dibuat)
    if (filterMode === 'today') {
      const today = new Date().toDateString();
      filtered = filtered.filter(p => p.createdAt?.toDate?.().toDateString() === today);
    } else if (filterMode === 'range') {
      const targetDate = selectedDate.toDateString();
      filtered = filtered.filter(p => p.createdAt?.toDate?.().toDateString() === targetDate);
    }

    // 3. Filter Status Stok (Filter Data)
    if (sortType === 'stock-safe') {
      filtered = filtered.filter(p => p.stock > 10);
    } else if (sortType === 'stock-critical') {
      filtered = filtered.filter(p => p.stock > 0 && p.stock <= 10);
    } else if (sortType === 'stock-empty') {
      filtered = filtered.filter(p => p.stock <= 0);
    }

    // 4. Pengurutan (Sorting Logic)
    filtered.sort((a, b) => {
      switch (sortType) {
        case 'sold-desc': return (b.sold || 0) - (a.sold || 0);
        case 'date-desc': return (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0);
        case 'date-asc': return (a.createdAt?.toDate?.() || 0) - (b.createdAt?.toDate?.() || 0);
        case 'stock-safe': return b.stock - a.stock;
        case 'stock-critical': return a.stock - b.stock;
        default: return 0;
      }
    });

    setCurrentCount(filtered.length);
    onFiltered(filtered);
  }, [products, searchQuery, filterMode, sortType, selectedDate, onFiltered]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

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
          <Text style={styles.countText}>{currentCount} Produk</Text>
          {isExpanded ? <ChevronUp size={20} color="#94A3B8" /> : <ChevronDown size={20} color="#94A3B8" />}
        </View>
      </TouchableOpacity>

      <Collapsible collapsed={!isExpanded}>
        <View style={styles.filterBox}>
          
          {/* BAGIAN WAKTU */}
          <Text style={styles.sectionLabel}>Waktu Produk:</Text>
          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.btn, filterMode === 'today' && styles.btnActive]}
              onPress={() => onFilterModeChange('today')}
            >
              <Clock size={14} color={filterMode === 'today' ? '#FFF' : COLORS.secondary} style={{marginRight: 6}}/>
              <Text style={[styles.btnText, filterMode === 'today' && styles.btnTextActive]}>Hari Ini</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, filterMode === 'range' && styles.btnActive]}
              onPress={() => setDatePickerVisibility(true)}
            >
              <Calendar size={14} color={filterMode === 'range' ? '#FFF' : COLORS.secondary} style={{marginRight: 6}}/>
              <Text style={[styles.btnText, filterMode === 'range' && styles.btnTextActive]}>
                {filterMode === 'range' ? selectedDate.toLocaleDateString('id-ID') : 'Pilih Tanggal'}
              </Text>
            </TouchableOpacity>
            
            {filterMode !== 'all' && (
               <TouchableOpacity onPress={() => onFilterModeChange('all')} style={styles.resetBtn}>
                 <Text style={styles.resetText}>Reset</Text>
               </TouchableOpacity>
            )}
          </View>

          {/* BAGIAN URUTAN & STOK */}
          <Text style={styles.sectionLabel}>Urutkan & Status Stok:</Text>
          <View style={styles.grid}>
            {/* Baris 1 */}
            <SortBtn 
              label="Terlaris" 
              type="sold-desc" 
              current={sortType} 
              onSelect={onSortChange} 
              icon={<TrendingUp size={12} color={sortType === 'sold-desc' ? '#FFF' : '#F59E0B'} />} 
            />
            <SortBtn label="Tgl Terbaru" type="date-desc" current={sortType} onSelect={onSortChange} />
            <SortBtn label="Tgl Terlama" type="date-asc" current={sortType} onSelect={onSortChange} />

            {/* Baris 2 */}
            <SortBtn label="Stok Aman" type="stock-safe" current={sortType} onSelect={onSortChange} activeColor="#22C55E" />
            <SortBtn label="Stok Kritis" type="stock-critical" current={sortType} onSelect={onSortChange} activeColor="#F59E0B" />
            <SortBtn label="Stok Habis" type="stock-empty" current={sortType} onSelect={onSortChange} activeColor="#EF4444" />
          </View>
        </View>
      </Collapsible>

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

// Komponen Tombol Internal
const SortBtn = ({ label, type, current, onSelect, icon, activeColor }: any) => {
  const isActive = current === type;
  const backgroundColor = isActive ? (activeColor || COLORS.secondary) : '#F8FAFC';
  const borderColor = isActive ? (activeColor || COLORS.secondary) : '#E2E8F0';

  return (
    <TouchableOpacity 
      style={[styles.gridItem, { backgroundColor, borderColor }]}
      onPress={() => onSelect(type)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {icon}
        <Text style={[styles.gridText, isActive && { color: '#FFF', fontFamily: 'PoppinsBold' }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#F1F5F9' },
  toggle: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center' },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleText: { fontFamily: 'PoppinsSemiBold', fontSize: 14, color: '#1E293B' },
  countText: { color: '#64748B', fontSize: 12, fontFamily: 'PoppinsMedium' },
  filterBox: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 5 },
  sectionLabel: { fontSize: 11, fontFamily: 'PoppinsMedium', color: '#94A3B8', marginBottom: 8, marginTop: 12, marginLeft: 4 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 5, alignItems: 'center' },
  btn: { flex: 1, flexDirection: 'row', paddingVertical: 10, backgroundColor: '#F8FAFC', borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  btnActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  btnText: { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#64748B' },
  btnTextActive: { color: '#FFF' },
  resetBtn: { paddingHorizontal: 8 },
  resetText: { color: '#EF4444', fontSize: 12, fontFamily: 'PoppinsBold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { width: '31.5%', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  gridText: { fontSize: 10, fontFamily: 'PoppinsMedium', color: '#64748B', textAlign: 'center' }
});

export default FilterSection;