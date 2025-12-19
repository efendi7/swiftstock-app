import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const MONTH_NAMES = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

interface Props {
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

const MonthPicker = ({ selectedMonth, selectedYear, onMonthChange, onYearChange }: Props) => {
  const prev = () => {
    if (selectedMonth === 0) {
      onMonthChange(11);
      onYearChange(selectedYear - 1);
    } else {
      onMonthChange(selectedMonth - 1);
    }
  };

  const next = () => {
    if (selectedMonth === 11) {
      onMonthChange(0);
      onYearChange(selectedYear + 1);
    } else {
      onMonthChange(selectedMonth + 1);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={prev} style={styles.arrow}>
        <Text style={styles.arrowText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.text}>{MONTH_NAMES[selectedMonth]} {selectedYear}</Text>
      <TouchableOpacity onPress={next} style={styles.arrow}>
        <Text style={styles.arrowText}>→</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 12 },
  arrow: { padding: 10 },
  arrowText: { fontSize: 24, color: COLORS.secondary },
  text: { fontSize: 17, fontWeight: 'bold', marginHorizontal: 20 },
});

export default MonthPicker;