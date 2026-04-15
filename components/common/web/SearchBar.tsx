/**
 * components/common/SearchBar.tsx
 * Search input reusable — dipakai di semua halaman web.
 */
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { COLORS } from '@constants/colors';

interface Props {
  value:         string;
  onChangeText:  (text: string) => void;
  placeholder?:  string;
  focusColor?:   string;
}

const SearchBar: React.FC<Props> = ({
  value, onChangeText,
  placeholder = 'Cari...',
  focusColor  = COLORS.primary,
}) => {
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={[
      s.wrap,
      focused && { borderColor: focusColor },
    ]}>
      <Search size={13} color="#94A3B8" />
      <TextInput
        style={[s.input, { outlineStyle: 'none' } as any]}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
          <X size={12} color="#94A3B8" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 10, height: 36 },
  input: { flex: 1, fontSize: 12, fontFamily: 'PoppinsRegular', color: '#1E293B' },
});

export default SearchBar;