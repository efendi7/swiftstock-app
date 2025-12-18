import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { styles, COLORS } from './styles';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  isAdmin: boolean;
}

export const TransactionSearchBar: React.FC<Props> = ({ value, onChangeText, isAdmin }) => (
  <View style={styles.searchContainer}>
    <Search size={20} color={COLORS.textLight} style={styles.searchIcon} />
    <TextInput
      style={styles.searchInput}
      placeholder={isAdmin ? "Cari nomor, kasir, email..." : "Cari nomor transaksi..."}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor="#999"
    />
    {value.length > 0 && (
      <TouchableOpacity style={styles.clearButton} onPress={() => onChangeText('')}>
        <X size={16} color="#FFF" />
      </TouchableOpacity>
    )}
  </View>
);