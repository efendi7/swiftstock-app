import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './styles';
import { MonthPicker } from './MonthPicker';
import { DateRangePicker } from './DateRangePicker';

type FilterMode = 'today' | 'week' | 'month' | 'all' | 'specificMonth' | 'dateRange';

interface Props {
  filterMode: FilterMode;
  selectedSort: 'latest' | 'oldest';
  selectedMonth: number;
  selectedYear: number;
  startDate: Date | null;
  endDate: Date | null;
  showStartPicker: boolean;
  showEndPicker: boolean;

  onFilterChange: (mode: FilterMode) => void;
  onSortChange: (sort: 'latest' | 'oldest') => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onShowStartPicker: (show: boolean) => void;
  onShowEndPicker: (show: boolean) => void;
  onClose: () => void;
}

const renderChip = (label: string, active: boolean, onPress: () => void, activeColor: string = '#00A79D') => (
  <TouchableOpacity
    style={[styles.filterChip, active && { backgroundColor: activeColor, borderColor: activeColor }]}
    onPress={onPress}
  >
    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

export const TransactionFilterSection: React.FC<Props> = (props) => {
  const {
    filterMode,
    selectedSort,
    selectedMonth,
    selectedYear,
    startDate,
    endDate,
    showStartPicker,
    showEndPicker,
    onFilterChange,
    onSortChange,
    onMonthChange,
    onYearChange,
    onStartDateChange,
    onEndDateChange,
    onShowStartPicker,
    onShowEndPicker,
    onClose,
  } = props;

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      onMonthChange(11);
      onYearChange(selectedYear - 1);
    } else {
      onMonthChange(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      onMonthChange(0);
      onYearChange(selectedYear + 1);
    } else {
      onMonthChange(selectedMonth + 1);
    }
  };

  const handleFilterSelect = (mode: FilterMode) => {
    onFilterChange(mode);
    if (mode !== 'specificMonth' && mode !== 'dateRange') onClose();
  };

  return (
    <View style={styles.filterContent}>
      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupLabel}>Periode</Text>
        <View style={styles.chipRow}>
          {renderChip('Hari Ini', filterMode === 'today', () => handleFilterSelect('today'))}
          {renderChip('Minggu Ini', filterMode === 'week', () => handleFilterSelect('week'))}
        </View>
        <View style={styles.chipRow}>
          {renderChip('Bulan Ini', filterMode === 'month', () => handleFilterSelect('month'))}
          {renderChip('Semua', filterMode === 'all', () => handleFilterSelect('all'))}
        </View>
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupLabel}>Filter Lanjutan</Text>
        <View style={styles.chipRow}>
          {renderChip('Pilih Bulan', filterMode === 'specificMonth', () => handleFilterSelect('specificMonth'))}
          {renderChip('Rentang Tanggal', filterMode === 'dateRange', () => handleFilterSelect('dateRange'))}
        </View>
      </View>

      {filterMode === 'specificMonth' && (
        <MonthPicker
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onPrev={handlePrevMonth}
          onNext={handleNextMonth}
        />
      )}

      {filterMode === 'dateRange' && (
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          showStartPicker={showStartPicker}
          showEndPicker={showEndPicker}
          onShowStartPicker={onShowStartPicker}
          onShowEndPicker={onShowEndPicker}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
        />
      )}

      <View style={styles.filterGroup}>
        <Text style={styles.filterGroupLabel}>Urutkan</Text>
        <View style={styles.chipRow}>
          {renderChip('Terbaru', selectedSort === 'latest', () => onSortChange('latest'), '#F58220')}
          {renderChip('Terlama', selectedSort === 'oldest', () => onSortChange('oldest'), '#F58220')}
        </View>
      </View>
    </View>
  );
};