import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Save } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

interface SubmitButtonProps {
  loading: boolean;
  onPress: () => void;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  loading,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.saveButton, loading && { opacity: 0.8 }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[COLORS.secondary, '#008e85']}
        style={styles.saveGradient}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Save size={20} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.saveButtonText}>Simpan Produk Baru</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  saveButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 8, // Dikurangi dari 10 agar lebih rapat
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14, // Dikurangi dari 16 agar button tidak terlalu bongsor/tinggi
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold', // Menggunakan Poppins sesuai permintaan sebelumnya
  },
});