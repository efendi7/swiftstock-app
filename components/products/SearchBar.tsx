import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, X } from 'lucide-react-native'; // Import ikon Lucide
import { COLORS } from '../../constants/colors';

interface Props {
  value: string;
  onChange: (text: string) => void;
}

const SearchBar = ({ value, onChange }: Props) => {
  return (
    <View style={styles.container}>
      {/* IKON SEARCH DI KIRI */}
      <Search size={20} color={COLORS.textLight} style={styles.searchIcon} />

      <TextInput
        style={styles.input}
        placeholder="Cari produk, kategori, pemasok..."
        value={value}
        onChangeText={onChange}
        placeholderTextColor="#94A3B8"
        selectionColor={COLORS.primary}
      />

      {/* TOMBOL CLEAR DI KANAN (Hanya muncul jika ada teks) */}
      {value.length > 0 && (
        <TouchableOpacity 
          onPress={() => onChange('')} 
          style={styles.clearButton}
          activeOpacity={0.7}
        >
          <View style={styles.clearIconCircle}>
            <X size={14} color="#FFF" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF', // Warna putih bersih
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 16,
    paddingHorizontal: 15,
    // Soft Shadow agar terlihat mengapung (elegan)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: COLORS.textDark,
    fontSize: 14,
    fontFamily: 'PoppinsRegular', // Menggunakan font Poppins
  },
  clearButton: {
    padding: 5,
  },
  clearIconCircle: {
    backgroundColor: '#CBD5E1',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchBar;