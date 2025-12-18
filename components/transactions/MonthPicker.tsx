import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { styles, COLORS } from './styles';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

interface Props {
  selectedMonth: number;
  selectedYear: number;
  onPrev: () => void;
  onNext: () => void;
}

export const MonthPicker: React.FC<Props> = ({ selectedMonth, selectedYear, onPrev, onNext }) => (
  <View style={styles.monthPickerContainer}>
    <TouchableOpacity style={styles.monthArrow} onPress={onPrev}>
      <Text style={styles.arrowText}>◀</Text>
    </TouchableOpacity>
    <View style={styles.monthDisplay}>
      <Calendar size={18} color={COLORS.secondary} />
      <Text style={styles.monthYearText}>
        {MONTH_NAMES[selectedMonth]} {selectedYear}
      </Text>
    </View>
    <TouchableOpacity style={styles.monthArrow} onPress={onNext}>
      <Text style={styles.arrowText}>▶</Text>
    </TouchableOpacity>
  </View>
);