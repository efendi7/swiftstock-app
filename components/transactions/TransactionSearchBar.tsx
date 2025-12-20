import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  isAdmin: boolean;
}

export const TransactionSearchBar: React.FC<Props> = ({
  value,
  onChangeText,
  isAdmin,
}) => (
  <View style={styles.container}>
    <Search size={20} color={COLORS.textLight} />

    <TextInput
      style={styles.input}
      placeholder={
        isAdmin
          ? 'Cari invoice, kasir, email...'
          : 'Cari nomor transaksi...'
      }
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor="#94A3B8"
    />

    {value.length > 0 && (
      <TouchableOpacity onPress={() => onChangeText('')}>
        <View style={styles.clear}>
          <X size={14} color="#FFF" />
        </View>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontFamily: 'PoppinsRegular',
    fontSize: 14,
    color: '#1E293B',
  },
  clear: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
