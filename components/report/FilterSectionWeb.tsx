/**
 * components/report/FilterSectionWeb.tsx
 * Sidebar filter laporan — mirip FilterSectionWeb produk.
 */

import React, { useState, createElement } from 'react';
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
  RotateCcw,
  TrendingUp,
  TrendingDown,
  ArrowDownUp,
} from 'lucide-react-native';

import { COLORS } from '@constants/colors';
import SidebarSection from '@components/common/web/SidebarSection';
import FilterChip from '@components/common/web/FilterChip';

export type FilterType = 'all' | 'IN' | 'OUT';

export interface ReportFilterState {
  searchQuery: string;
  filterType: FilterType;
  startDateStr: string;
  endDateStr: string;
}

interface Props {
  filter: ReportFilterState;
  onChange: (filter: ReportFilterState) => void;
  onApply: () => void;
}

const DateInput = ({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) => (
  <View style={s.dateGroup}>
    <Text style={s.dateLabel}>{label}</Text>
    <View style={s.dateInputWrap}>
      {createElement('input', {
        type: 'date',
        value,
        onChange: (e: any) => onChange(e.target.value),
        style: {
          padding: '6px 8px',
          borderRadius: '8px',
          border: '1.5px solid #E2E8F0',
          fontFamily: 'PoppinsRegular',
          fontSize: '11px',
          color: '#1E293B',
          outline: 'none',
          width: '100%',
          backgroundColor: '#F8FAFC',
        },
      })}
    </View>
  </View>
);

const FilterSectionWeb = ({ filter, onChange, onApply }: Props) => {
  const [openWaktu, setOpenWaktu] = useState(true);
  const [openTipe, setOpenTipe]   = useState(true);

  const { searchQuery, filterType, startDateStr, endDateStr } = filter;

  const hasActiveFilter =
    searchQuery !== '' ||
    filterType !== 'all' ||
    startDateStr !== '' ||
    endDateStr !== '';

  const update = (partial: Partial<ReportFilterState>) =>
    onChange({ ...filter, ...partial });

  const handleResetAll = () =>
    onChange({ searchQuery: '', filterType: 'all', startDateStr: '', endDateStr: '' });

  return (
    <ScrollView
      style={s.wrap}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* SEARCH + RESET — di atas garis horizontal */}
      <View style={s.topRow}>
        <View style={s.searchRow}>
          <Search size={13} color="#94A3B8" />
          <TextInput
            style={[s.searchInput, { outlineStyle: 'none' } as any]}
            placeholder="Nama produk, keterangan..."
            value={searchQuery}
            onChangeText={v => update({ searchQuery: v })}
            placeholderTextColor="#94A3B8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => update({ searchQuery: '' })}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <X size={12} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
        {hasActiveFilter && (
          <TouchableOpacity style={s.resetBtn} onPress={handleResetAll}>
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
        hasActive={startDateStr !== '' || endDateStr !== ''}
        onReset={() => update({ startDateStr: '', endDateStr: '' })}
      >
        {/* Tanggal side-by-side kiri-kanan */}
        <View style={s.dateRow}>
          <View style={s.dateHalf}>
            <DateInput
              label="Dari"
              value={startDateStr}
              onChange={v => update({ startDateStr: v })}
            />
          </View>
          <View style={s.dateSeparator} />
          <View style={s.dateHalf}>
            <DateInput
              label="Sampai"
              value={endDateStr}
              onChange={v => update({ endDateStr: v })}
            />
          </View>
        </View>

        <TouchableOpacity style={s.applyBtn} onPress={onApply}>
          <Search size={14} color="#FFF" />
          <Text style={s.applyBtnText}>Terapkan Filter</Text>
        </TouchableOpacity>
      </SidebarSection>

      <View style={s.divider} />

      {/* TIPE STOK */}
      <SidebarSection
        title="Tipe Stok"
        isOpen={openTipe}
        onToggle={() => setOpenTipe(v => !v)}
        hasActive={filterType !== 'all'}
        onReset={() => update({ filterType: 'all' })}
      >
        <FilterChip
          label="Semua"
          active={filterType === 'all'}
          icon={
            <ArrowDownUp
              size={12}
              color={filterType === 'all' ? '#FFF' : COLORS.secondary}
            />
          }
          onPress={() => update({ filterType: 'all' })}
        />
        <FilterChip
          label="Masuk"
          active={filterType === 'IN'}
          activeColor="#10B981"
          icon={
            <TrendingUp
              size={12}
              color={filterType === 'IN' ? '#FFF' : '#10B981'}
            />
          }
          onPress={() =>
            update({ filterType: filterType === 'IN' ? 'all' : 'IN' })
          }
        />
        <FilterChip
          label="Keluar"
          active={filterType === 'OUT'}
          activeColor="#EF4444"
          icon={
            <TrendingDown
              size={12}
              color={filterType === 'OUT' ? '#FFF' : '#EF4444'}
            />
          }
          onPress={() =>
            update({ filterType: filterType === 'OUT' ? 'all' : 'OUT' })
          }
        />
      </SidebarSection>

    </ScrollView>
  );
};

const s = StyleSheet.create({
  wrap:    { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 20 },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  searchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    height: 34,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: '#1E293B',
  },
  resetBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },

  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },

  // Tanggal side-by-side
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 8,
  },
  dateHalf: {
    flex: 1,
  },
  dateSeparator: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: 14,
  },
  dateGroup:     { gap: 4 },
  // Label tanggal lebih kecil dari subtitle section (subtitle ~13px, ini 10px)
  dateLabel:     { fontFamily: 'PoppinsSemiBold', fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.3 },
  dateInputWrap: { flexDirection: 'row' },

  applyBtn: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  applyBtnText: { color: '#FFF', fontFamily: 'PoppinsMedium', fontSize: 13 },
});

export default FilterSectionWeb;