import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

interface Props {
  value: string;
  onChange: (text: string) => void;
}

const SearchBar = ({ value, onChange }: Props) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Cari nama, barcode, kategori, atau pemasok..."
        value={value}
        onChangeText={onChange}
        placeholderTextColor={COLORS.textLight}
      />
      {value ? (
        <TouchableOpacity onPress={() => onChange('')}>
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: { flex: 1, paddingVertical: 12, color: COLORS.textDark },
  clearIcon: { padding: 5, color: COLORS.textLight, fontSize: 18 },
});

export default SearchBar;