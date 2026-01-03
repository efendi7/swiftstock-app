import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import Collapsible from 'react-native-collapsible';
import { ChevronDown, ChevronUp, Filter, Calendar, TrendingUp, Clock, Search, X, RotateCcw } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import DateTimePickerModal from "react-native-modal-datetime-picker";

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

export const FilterSection = ({
  products,
  searchQuery,
  onSearchChange,
  filterMode,
  sortType,
  userRole,
  onFiltered,
  onFilterModeChange,
  onSortChange,
}: FilterProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentCount, setCurrentCount] = useState(products.length);

  // Fungsi Reset Semua Filter
  const handleReset = () => {
    onSearchChange('');
    onFilterModeChange('all');
    onSortChange('default');
  };

  const applyFilters = useCallback(() => {
    let filtered = [...products];

    // 1. Logika Pencarian & Kategori (Otomatis)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(q) || 
        p.barcode?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) // Filter kategori otomatis di sini
      );
    }

    // 2. Filter Waktu (Firebase Timestamp Safety)
    const getSafeDateString = (timestamp: any) => {
        if (!timestamp) return null;
        if (timestamp.toDate) return timestamp.toDate().toDateString(); // Firebase Doc
        if (timestamp instanceof Date) return timestamp.toDateString(); // JS Date
        return new Date(timestamp).toDateString(); // Fallback
    };

    if (filterMode === 'today') {
      const today = new Date().toDateString();
      filtered = filtered.filter(p => getSafeDateString(p.createdAt) === today);
    } else if (filterMode === 'range') {
      const targetDate = selectedDate.toDateString();
      filtered = filtered.filter(p => getSafeDateString(p.createdAt) === targetDate);
    }

    // 3. Filter Status Stok
    if (sortType === 'stock-safe') {
      filtered = filtered.filter(p => (p.stock || 0) > 10);
    } else if (sortType === 'stock-critical') {
      filtered = filtered.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 10);
    } else if (sortType === 'stock-empty') {
      filtered = filtered.filter(p => (p.stock || 0) <= 0);
    }

    // 4. Sort Logic
    filtered.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
      const dateB = b.createdAt?.toDate?.()?.getTime() || 0;

      switch (sortType) {
        case 'sold-desc': return (b.soldCount || 0) - (a.soldCount || 0);
        case 'date-desc': return dateB - dateA;
        case 'date-asc': return dateA - dateB;
        default: return 0;
      }
    });

    setCurrentCount(filtered.length);
    onFiltered(filtered);
  }, [products, searchQuery, filterMode, sortType, selectedDate, onFiltered]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const hasActiveFilters = searchQuery !== '' || filterMode !== 'all' || sortType !== 'default';

  return (
    <View style={styles.outerContainer}>
      <View style={styles.mainCard}>
        {/* SEARCH BAR UTAMA */}
        <View style={styles.searchContainer}>
          <Search size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder={userRole === 'admin' ? "Cari nama, barcode, atau kategori..." : "Cari produk..."}
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholderTextColor="#94A3B8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider} />

        {/* TOGGLE FILTER */}
        <TouchableOpacity 
          style={styles.toggle} 
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.toggleLeft}>
            <Filter size={18} color={hasActiveFilters ? COLORS.primary : COLORS.secondary} />
            <Text style={[styles.toggleText, hasActiveFilters && {color: COLORS.primary}]}>
                {hasActiveFilters ? "Filter Aktif" : "Filter Lanjutan"}
            </Text>
          </View>
          <View style={styles.toggleRight}>
            <Text style={styles.countText}>{currentCount} Item</Text>
            {isExpanded ? <ChevronUp size={18} color="#94A3B8" /> : <ChevronDown size={18} color="#94A3B8" />}
          </View>
        </TouchableOpacity>

        <Collapsible collapsed={!isExpanded}>
          <View style={styles.filterBox}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>Waktu</Text>
                {filterMode !== 'all' && (
                    <TouchableOpacity onPress={() => onFilterModeChange('all')}>
                        <Text style={styles.resetItemText}>Reset Waktu</Text>
                    </TouchableOpacity>
                )}
            </View>
            
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
                    {filterMode === 'range' ? selectedDate.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : "Pilih Tanggal"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>Stok & Urutan</Text>
            <View style={styles.gridContainer}>
              <View style={styles.gridRow}>
                <SortBtn label="Terlaris" type="sold-desc" current={sortType} onSelect={onSortChange} icon={<TrendingUp size={12} color={sortType === 'sold-desc' ? '#FFF' : '#F59E0B'} />} />
                <SortBtn label="Terbaru" type="date-desc" current={sortType} onSelect={onSortChange} />
              </View>
              <View style={styles.gridRow}>
                <SortBtn label="Aman" type="stock-safe" current={sortType} onSelect={onSortChange} activeColor="#22C55E" />
                <SortBtn label="Kritis" type="stock-critical" current={sortType} onSelect={onSortChange} activeColor="#F59E0B" />
                <SortBtn label="Habis" type="stock-empty" current={sortType} onSelect={onSortChange} activeColor="#EF4444" />
              </View>
            </View>

            {/* Tombol Reset Global */}
            <TouchableOpacity style={styles.resetAllBtn} onPress={handleReset}>
                <RotateCcw size={14} color="#EF4444" />
                <Text style={styles.resetAllText}>Reset Semua Filter</Text>
            </TouchableOpacity>
          </View>
        </Collapsible>
      </View>

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

const SortBtn = ({ label, type, current, onSelect, icon, activeColor }: any) => {
  const isActive = current === type;
  const backgroundColor = isActive ? (activeColor || COLORS.secondary) : '#F8FAFC';
  const borderColor = isActive ? (activeColor || COLORS.secondary) : '#E2E8F0';

  return (
    <TouchableOpacity 
      style={[styles.gridItem, { backgroundColor, borderColor }]}
      onPress={() => onSelect(isActive ? 'default' : type)} // Toggle off if clicked again
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {icon}
        <Text numberOfLines={1} style={[styles.gridText, isActive && { color: '#FFF', fontFamily: 'PoppinsBold' }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  outerContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  mainCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2, // Tambahkan sedikit shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 54,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'PoppinsRegular',
    fontSize: 14,
    color: '#1E293B',
  },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  toggle: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, alignItems: 'center' },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleText: { fontFamily: 'PoppinsSemiBold', fontSize: 13, color: '#475569' },
  countText: { color: COLORS.secondary, fontSize: 11, fontFamily: 'PoppinsBold' },
  filterBox: { paddingHorizontal: 16, paddingBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  sectionLabel: { fontSize: 10, fontFamily: 'PoppinsBold', color: '#94A3B8', textTransform: 'uppercase' },
  resetItemText: { fontSize: 10, color: '#EF4444', fontFamily: 'PoppinsMedium' },
  row: { flexDirection: 'row', gap: 6, marginTop: 6 },
  btn: { flex: 1, flexDirection: 'row', paddingVertical: 10, backgroundColor: '#F8FAFC', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  btnActive: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  btnText: { fontSize: 11, fontFamily: 'PoppinsSemiBold', color: '#64748B' },
  btnTextActive: { color: '#FFF' },
  gridContainer: { gap: 6, marginTop: 6 },
  gridRow: { flexDirection: 'row', gap: 6 },
  gridItem: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  gridText: { fontSize: 10, fontFamily: 'PoppinsMedium', color: '#64748B' },
  resetAllBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    marginTop: 16, 
    paddingVertical: 8, 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9' 
  },
  resetAllText: { fontSize: 11, fontFamily: 'PoppinsSemiBold', color: '#EF4444' }
});

export default FilterSection;