
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  ScrollView, Platform,
} from 'react-native';
import {
  Search, X, Clock, Calendar, RotateCcw,
  ArrowDownUp, TrendingDown, TrendingUp,
} from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import SidebarSection from '@components/common/web/SidebarSection';
import FilterChip     from '@components/common/web/FilterChip';
import { Transaction, FilterMode, SortType } from '@/types/transaction.type';

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
  const [selectedDate, setSelectedDate] = useState('');   // format YYYY-MM-DD
  const [openWaktu,   setOpenWaktu]     = useState(true);
  const [openUrutan,  setOpenUrutan]    = useState(true);
  const dateInputRef = useRef<any>(null);

  const handleReset = () => {
    onSearchChange('');
    onFilterChange('all');
    onSortChange('latest');
    setSelectedDate('');
  };

  const applyFilters = useCallback(() => {
    let f = [...transactions];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter(t =>
        (t.transactionNumber || '').toLowerCase().includes(q) ||
        (t.cashierName       || '').toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q),
      );
    }

    const toDateStr = (ts: any) => {
      if (!ts) return null;
      if (ts.toDate)          return ts.toDate().toDateString();
      if (ts instanceof Date) return ts.toDateString();
      return new Date(ts).toDateString();
    };

    if (filterMode === 'today') {
      const today = new Date().toDateString();
      f = f.filter(t => toDateStr(t.date) === today);
    } else if (filterMode === 'specificMonth' && selectedDate) {
      const target = new Date(selectedDate).toDateString();
      f = f.filter(t => toDateStr(t.date) === target);
    }

    f.sort((a, b) => {
      const ta = a.date?.toDate?.()?.getTime() || 0;
      const tb = b.date?.toDate?.()?.getTime() || 0;
      return sortType === 'latest' ? tb - ta : ta - tb;
    });

    onFiltered(f);
  }, [transactions, searchQuery, filterMode, sortType, selectedDate, onFiltered]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  // Format label tanggal terpilih untuk chip
  const dateLabel = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Pilih Tanggal';

  const hasActive = searchQuery !== '' || filterMode !== 'all' || sortType !== 'latest';

  return (
    <View style={s.wrap}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >

        {/* SEARCH + RESET */}
        <View style={s.topRow}>
          <View style={s.searchRow}>
            <Search size={13} color="#94A3B8" />
            <TextInput
              style={[s.searchInput, { outlineStyle: 'none' } as any]}
              placeholder="No. transaksi / kasir..."
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
          onReset={() => { onFilterChange('all'); setSelectedDate(''); }}
        >
          <FilterChip
            label="Semua"
            active={filterMode === 'all'}
            icon={<ArrowDownUp size={12} color={filterMode === 'all' ? '#FFF' : COLORS.secondary} />}
            onPress={() => { onFilterChange('all'); setSelectedDate(''); }}
          />
          <FilterChip
            label="Hari Ini"
            active={filterMode === 'today'}
            icon={<Clock size={12} color={filterMode === 'today' ? '#FFF' : COLORS.secondary} />}
            onPress={() => onFilterChange(filterMode === 'today' ? 'all' : 'today')}
          />

          {/* Pilih Tanggal — HTML native date input (web only) */}
          <View style={s.dateChipWrap}>
            <FilterChip
              label={filterMode === 'specificMonth' && selectedDate ? dateLabel : 'Pilih Tanggal'}
              active={filterMode === 'specificMonth' && !!selectedDate}
              icon={<Calendar size={12} color={filterMode === 'specificMonth' && selectedDate ? '#FFF' : COLORS.secondary} />}
              onPress={() => {
                // Trigger click pada input hidden
                dateInputRef.current?.click?.();
              }}
            />
            {/* Input date native HTML — invisible, di-trigger lewat ref */}
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e: any) => {
                const val = e.target.value;  // YYYY-MM-DD
                if (val) {
                  setSelectedDate(val);
                  onFilterChange('specificMonth');
                } else {
                  setSelectedDate('');
                  onFilterChange('all');
                }
              }}
              style={{
                position: 'absolute',
                opacity: 0,
                width: 1,
                height: 1,
                pointerEvents: 'none',
              } as any}
            />
          </View>
        </SidebarSection>

        <View style={s.divider} />

        {/* URUTAN */}
        <SidebarSection
          title="Urutan"
          isOpen={openUrutan}
          onToggle={() => setOpenUrutan(v => !v)}
          hasActive={sortType !== 'latest'}
          onReset={() => onSortChange('latest')}
        >
          <FilterChip
            label="Terbaru"
            active={sortType === 'latest'}
            icon={<TrendingDown size={12} color={sortType === 'latest' ? '#FFF' : COLORS.secondary} />}
            onPress={() => onSortChange('latest')}
          />
          <FilterChip
            label="Terlama"
            active={sortType === 'oldest'}
            icon={<TrendingUp size={12} color={sortType === 'oldest' ? '#FFF' : COLORS.secondary} />}
            onPress={() => onSortChange(sortType === 'oldest' ? 'latest' : 'oldest')}
          />
        </SidebarSection>

      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  wrap:    { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 20 },

  topRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  searchRow: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 9, height: 34, gap: 6 },
  searchInput:{ flex: 1, fontSize: 12, fontFamily: 'PoppinsRegular', color: '#1E293B' },
  resetBtn:  { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: '#FEE2E2', backgroundColor: '#FFF5F5', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' as any },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 10 },

  dateChipWrap: { position: 'relative' as any },
});

export default TransactionFilterWeb;