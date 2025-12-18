import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react-native';
import { styles, COLORS } from './styles';

interface Props {
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export const TransactionSummaryBar: React.FC<Props> = ({ count, isExpanded, onToggle }) => (
  <View style={styles.summaryBar}>
    <Text style={styles.summaryText}>
      Total: <Text style={styles.summaryValue}>{count}</Text> transaksi
    </Text>
    <TouchableOpacity style={styles.filterToggle} onPress={onToggle}>
      <Filter size={16} color={COLORS.secondary} />
      <Text style={styles.filterToggleText}>Filter</Text>
      {isExpanded ? <ChevronUp size={16} color={COLORS.secondary} /> : <ChevronDown size={16} color={COLORS.secondary} />}
    </TouchableOpacity>
  </View>
);