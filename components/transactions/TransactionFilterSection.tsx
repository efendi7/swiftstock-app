import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Collapsible from 'react-native-collapsible';
import { ChevronDown, ChevronUp, Clock, Calendar, Filter } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import MonthPicker from '../products/MonthPicker';
import { FilterMode, SortType } from '../../types/transaction.type';

interface Props {
  filterMode: FilterMode;
  selectedSort: SortType;
  selectedMonth: number;
  selectedYear: number;
  transactionCount: number;
  onFilterChange: (mode: FilterMode) => void;
  onSortChange: (sort: SortType) => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

const TransactionFilterSection: React.FC<Props> = ({
  filterMode,
  selectedSort,
  selectedMonth,
  selectedYear,
  transactionCount,
  onFilterChange,
  onSortChange,
  onMonthChange,
  onYearChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.container}>
      {/* TOGGLE HEADER */}
      <TouchableOpacity
        style={styles.toggle}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.toggleLeft}>
          <Filter size={18} color={COLORS.primary} />
          <Text style={styles.toggleText}>Filter & Urutkan</Text>
        </View>

        <View style={styles.toggleRight}>
          <Text style={styles.countText}>{transactionCount} Transaksi</Text>
          {isExpanded ? (
            <ChevronUp size={20} color="#94A3B8" />
          ) : (
            <ChevronDown size={20} color="#94A3B8" />
          )}
        </View>
      </TouchableOpacity>

      {/* CONTENT */}
      <Collapsible collapsed={!isExpanded} duration={300}>
        <View style={styles.filterBox}>
          {/* TIME FILTER */}
          <View style={styles.row}>
            <FilterButton
              label="Hari Ini"
              icon={<Clock size={16} />}
              active={filterMode === 'today'}
              onPress={() => onFilterChange('today')}
            />
            <FilterButton
              label="Pilih Bulan"
              icon={<Calendar size={16} />}
              active={filterMode === 'specificMonth'}
              onPress={() => onFilterChange('specificMonth')}
            />
          </View>

          {/* MONTH PICKER */}
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

          {/* SORT */}
          <Text style={styles.sectionLabel}>Urutkan</Text>
          <View style={styles.row}>
            <SortButton
              label="Terbaru"
              active={selectedSort === 'latest'}
              onPress={() => onSortChange('latest')}
            />
            <SortButton
              label="Terlama"
              active={selectedSort === 'oldest'}
              onPress={() => onSortChange('oldest')}
            />
          </View>
        </View>
      </Collapsible>
    </View>
  );
};

/* ================= BUTTONS ================= */

const FilterButton = ({ label, icon, active, onPress }: any) => (
  <TouchableOpacity
    style={[styles.filterBtn, active && styles.activePrimary]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    {icon}
    <Text style={[styles.filterText, active && styles.textWhite]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const SortButton = ({ label, active, onPress }: any) => (
  <TouchableOpacity
    style={[styles.sortBtn, active && styles.activeSecondary]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.sortText, active && styles.textWhite]}>
      {label}
    </Text>
  </TouchableOpacity>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },

  toggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleText: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 14,
    color: '#1E293B',
  },
  countText: {
    fontFamily: 'PoppinsMedium',
    fontSize: 12,
    color: '#64748B',
  },

  filterBox: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },

  filterBtn: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterText: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 13,
    color: '#64748B',
  },

  monthPickerWrapper: {
    marginBottom: 14,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },

  sectionLabel: {
    fontFamily: 'PoppinsBold',
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 8,
    marginLeft: 4,
  },

  sortBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortText: {
    fontFamily: 'PoppinsMedium',
    fontSize: 13,
    color: '#64748B',
  },

  activePrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  activeSecondary: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  textWhite: {
    color: '#FFF',
  },
});

export default TransactionFilterSection;
