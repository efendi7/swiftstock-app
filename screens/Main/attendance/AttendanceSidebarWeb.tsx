/**
 * AttendanceSidebarWeb.tsx
 * Sidebar filter kasir untuk AttendanceManagementWeb.
 * Layout selaras dengan FilterSectionWeb produk:
 *   - topRow (search + resetBtn) paling atas sebelum divider
 *   - SidebarSection + FilterChip
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView,
} from 'react-native';
import {
  Search, X, RotateCcw,
  CheckCircle2, AlertCircle, XCircle, Clock, Users, ArrowDownUp,
} from 'lucide-react-native';
import SidebarSection from '@components/common/web/SidebarSection';
import FilterChip from '@components/common/web/FilterChip';
import { COLORS } from '@constants/colors';
import { Cashier } from '@services/cashierService';
import { DayAnalysis } from '@services/attendanceService';

type ShiftFilter  = 'all' | 'pagi' | 'siang' | 'malam' | 'noshift';
type StatusFilter = 'all' | 'hadir' | 'izin' | 'alpha';

interface Props {
  cashiers:  Cashier[];
  dayMap:    Record<string, DayAnalysis[]>;
  onFilter?: (filtered: Cashier[]) => void;
}

const AttendanceSidebarWeb: React.FC<Props> = ({ cashiers, dayMap, onFilter }) => {
  const [search,       setSearch]       = useState('');
  const [shiftFilter,  setShiftFilter]  = useState<ShiftFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [openShift,    setOpenShift]    = useState(true);
  const [openStatus,   setOpenStatus]   = useState(true);

  const hasActive = search !== '' || shiftFilter !== 'all' || statusFilter !== 'all';

  const handleReset = () => {
    setSearch('');
    setShiftFilter('all');
    setStatusFilter('all');
  };

  // Hitung stat per kasir
  const stats = cashiers.map(c => {
    const days = dayMap[c.id] ?? [];
    return {
      cashier: c,
      hadir:   days.filter(d => d.record?.status === 'hadir').length,
      izin:    days.filter(d => d.record?.status === 'izin').length,
      alpha:   days.filter(d => d.record?.status === 'alpha').length,
    };
  });

  const filtered = stats.filter(({ cashier: c, hadir, izin, alpha }) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!c.displayName.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q))
        return false;
    }
    if (shiftFilter === 'noshift' && c.shift) return false;
    if (shiftFilter !== 'all' && shiftFilter !== 'noshift' && c.shift?.type !== shiftFilter) return false;
    if (statusFilter === 'hadir' && hadir === 0) return false;
    if (statusFilter === 'izin'  && izin  === 0) return false;
    if (statusFilter === 'alpha' && alpha === 0) return false;
    return true;
  });

  useEffect(() => {
    onFilter?.(filtered.map(s => s.cashier));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, shiftFilter, statusFilter, cashiers.length, Object.keys(dayMap).length]);

  return (
    <ScrollView
      style={s.wrap}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* SEARCH + RESET — paling atas, sebelum divider */}
      <View style={s.topRow}>
        <View style={s.searchRow}>
          <Search size={13} color="#94A3B8" />
          <TextInput
            style={[s.searchInput, { outlineStyle: 'none' } as any]}
            placeholder="Nama atau email..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
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
        onReset={() => setShiftFilter('all')}
      >
        <FilterChip
          label="Semua"
          active={shiftFilter === 'all'}
          icon={<ArrowDownUp size={12} color={shiftFilter === 'all' ? '#FFF' : COLORS.secondary} />}
          onPress={() => setShiftFilter('all')}
        />
        <FilterChip
          label="Pagi"
          active={shiftFilter === 'pagi'}
          activeColor="#D97706"
          icon={<Clock size={12} color={shiftFilter === 'pagi' ? '#FFF' : '#D97706'} />}
          onPress={() => setShiftFilter(shiftFilter === 'pagi' ? 'all' : 'pagi')}
        />
        <FilterChip
          label="Siang"
          active={shiftFilter === 'siang'}
          activeColor="#EA580C"
          icon={<Clock size={12} color={shiftFilter === 'siang' ? '#FFF' : '#EA580C'} />}
          onPress={() => setShiftFilter(shiftFilter === 'siang' ? 'all' : 'siang')}
        />
        <FilterChip
          label="Malam"
          active={shiftFilter === 'malam'}
          activeColor="#3B82F6"
          icon={<Clock size={12} color={shiftFilter === 'malam' ? '#FFF' : '#3B82F6'} />}
          onPress={() => setShiftFilter(shiftFilter === 'malam' ? 'all' : 'malam')}
        />
        <FilterChip
          label="No Shift"
          active={shiftFilter === 'noshift'}
          activeColor="#94A3B8"
          icon={<Users size={12} color={shiftFilter === 'noshift' ? '#FFF' : '#94A3B8'} />}
          onPress={() => setShiftFilter(shiftFilter === 'noshift' ? 'all' : 'noshift')}
        />
      </SidebarSection>

      <View style={s.divider} />

      {/* SECTION: STATUS */}
      <SidebarSection
        title="Status Bulan Ini"
        isOpen={openStatus}
        onToggle={() => setOpenStatus(v => !v)}
        hasActive={statusFilter !== 'all'}
        onReset={() => setStatusFilter('all')}
      >
        <FilterChip
          label="Semua"
          active={statusFilter === 'all'}
          icon={<ArrowDownUp size={12} color={statusFilter === 'all' ? '#FFF' : COLORS.secondary} />}
          onPress={() => setStatusFilter('all')}
        />
        <FilterChip
          label="Hadir"
          active={statusFilter === 'hadir'}
          activeColor="#10B981"
          icon={<CheckCircle2 size={12} color={statusFilter === 'hadir' ? '#FFF' : '#10B981'} />}
          onPress={() => setStatusFilter(statusFilter === 'hadir' ? 'all' : 'hadir')}
        />
        <FilterChip
          label="Izin"
          active={statusFilter === 'izin'}
          activeColor="#F59E0B"
          icon={<AlertCircle size={12} color={statusFilter === 'izin' ? '#FFF' : '#F59E0B'} />}
          onPress={() => setStatusFilter(statusFilter === 'izin' ? 'all' : 'izin')}
        />
        <FilterChip
          label="Alpha"
          active={statusFilter === 'alpha'}
          activeColor="#EF4444"
          icon={<XCircle size={12} color={statusFilter === 'alpha' ? '#FFF' : '#EF4444'} />}
          onPress={() => setStatusFilter(statusFilter === 'alpha' ? 'all' : 'alpha')}
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

export default AttendanceSidebarWeb;