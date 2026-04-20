/**
 * CashierFilterWeb.tsx
 * Sidebar filter kasir — selaras dengan FilterSectionWeb produk.
 * Pakai: ScrollView, SidebarSection, FilterChip dari common/web.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView,
} from 'react-native';
import {
  Search, X, RotateCcw,
  Clock, ShieldCheck, ShieldOff, ArrowDownUp,
} from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import SidebarSection from '@components/common/web/SidebarSection';
import FilterChip from '@components/common/web/FilterChip';
import { Cashier, ShiftType } from '@services/cashierService';

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

const SHIFT_OPTIONS: { key: ShiftFilter; label: string }[] = [
  { key: 'all',        label: 'Semua' },
  { key: 'pagi',       label: 'Pagi' },
  { key: 'siang',      label: 'Siang' },
  { key: 'malam',      label: 'Malam' },
  { key: 'full',       label: 'Full Day' },
  { key: 'unassigned', label: 'Belum Dijadwal' },
];

const CashierFilterWeb = ({
  cashiers, searchQuery, onSearchChange,
  shiftFilter, statusFilter,
  onFiltered, onShiftChange, onStatusChange,
}: Props) => {
  const [openShift,  setOpenShift]  = useState(true);
  const [openStatus, setOpenStatus] = useState(true);

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
        c.email.toLowerCase().includes(q),
      );
    }
    if (shiftFilter !== 'all') {
      if (shiftFilter === 'unassigned') f = f.filter(c => !c.shift);
      else f = f.filter(c => c.shift?.type === shiftFilter);
    }
    if (statusFilter !== 'all') {
      f = f.filter(c => c.status === statusFilter);
    }
    onFiltered(f);
  }, [cashiers, searchQuery, shiftFilter, statusFilter]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  const hasActive = searchQuery !== '' || shiftFilter !== 'all' || statusFilter !== 'all';

  return (
    <ScrollView
      style={s.wrap}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* SEARCH + RESET — paling atas */}
      <View style={s.topRow}>
        <View style={s.searchRow}>
          <Search size={13} color="#94A3B8" />
          <TextInput
            style={[s.searchInput, { outlineStyle: 'none' } as any]}
            placeholder="Nama / email kasir..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={onSearchChange}
          />
          {searchQuery !== '' && (
            <TouchableOpacity
              onPress={() => onSearchChange('')}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
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

      {/* SECTION: SHIFT */}
      <SidebarSection
        title="Shift"
        isOpen={openShift}
        onToggle={() => setOpenShift(v => !v)}
        hasActive={shiftFilter !== 'all'}
        onReset={() => onShiftChange('all')}
      >
        {SHIFT_OPTIONS.map(opt => (
          <FilterChip
            key={opt.key}
            label={opt.label}
            active={shiftFilter === opt.key}
            icon={
              <Clock
                size={12}
                color={shiftFilter === opt.key ? '#FFF' : COLORS.secondary}
              />
            }
            onPress={() => onShiftChange(opt.key)}
          />
        ))}
      </SidebarSection>

      <View style={s.divider} />

      {/* SECTION: STATUS */}
      <SidebarSection
        title="Status"
        isOpen={openStatus}
        onToggle={() => setOpenStatus(v => !v)}
        hasActive={statusFilter !== 'all'}
        onReset={() => onStatusChange('all')}
      >
        <FilterChip
          label="Semua"
          active={statusFilter === 'all'}
          icon={
            <ArrowDownUp
              size={12}
              color={statusFilter === 'all' ? '#FFF' : COLORS.secondary}
            />
          }
          onPress={() => onStatusChange('all')}
        />
        <FilterChip
          label="Aktif"
          active={statusFilter === 'active'}
          activeColor="#10B981"
          icon={
            <ShieldCheck
              size={12}
              color={statusFilter === 'active' ? '#FFF' : '#10B981'}
            />
          }
          onPress={() =>
            onStatusChange(statusFilter === 'active' ? 'all' : 'active')
          }
        />
        <FilterChip
          label="Nonaktif"
          active={statusFilter === 'inactive'}
          activeColor="#EF4444"
          icon={
            <ShieldOff
              size={12}
              color={statusFilter === 'inactive' ? '#FFF' : '#EF4444'}
            />
          }
          onPress={() =>
            onStatusChange(statusFilter === 'inactive' ? 'all' : 'inactive')
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
});

export default CashierFilterWeb;