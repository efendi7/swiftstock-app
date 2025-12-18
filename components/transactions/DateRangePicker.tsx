import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { styles } from './styles';

interface Props {
  startDate: Date | null;
  endDate: Date | null;
  showStartPicker: boolean;
  showEndPicker: boolean;
  onShowStartPicker: (show: boolean) => void;
  onShowEndPicker: (show: boolean) => void;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
}

const formatDateDisplay = (date: Date | null) => date ? date.toLocaleDateString('id-ID') : 'Pilih tanggal';

export const DateRangePicker: React.FC<Props> = ({
  startDate,
  endDate,
  showStartPicker,
  showEndPicker,
  onShowStartPicker,
  onShowEndPicker,
  onStartDateChange,
  onEndDateChange,
}) => (
  <View style={styles.dateRangeContainer}>
    <View style={styles.dateRangeRow}>
      <TouchableOpacity style={styles.dateButton} onPress={() => onShowStartPicker(true)}>
        <Text style={styles.dateLabel}>Dari:</Text>
        <Text style={styles.dateValue}>{formatDateDisplay(startDate)}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dateButton} onPress={() => onShowEndPicker(true)}>
        <Text style={styles.dateLabel}>Sampai:</Text>
        <Text style={styles.dateValue}>{formatDateDisplay(endDate)}</Text>
      </TouchableOpacity>
    </View>

    {showStartPicker && (
      <DateTimePicker
        mode="date"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        value={startDate || new Date()}
        onChange={(event, date) => {
          onShowStartPicker(Platform.OS === 'ios');
          if (date) onStartDateChange(date);
        }}
      />
    )}

    {showEndPicker && (
      <DateTimePicker
        mode="date"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        value={endDate || new Date()}
        onChange={(event, date) => {
          onShowEndPicker(Platform.OS === 'ios');
          if (date) onEndDateChange(date);
        }}
      />
    )}
  </View>
);