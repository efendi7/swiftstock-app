import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, PackagePlus, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';

interface ProductFormHeaderProps {
  onClose: () => void;
  isModal?: boolean;
}

export const ProductFormHeader: React.FC<ProductFormHeaderProps> = ({
  onClose,
  isModal = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[COLORS.primary, '#2c537a']}
      style={[styles.header, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.dragHandleContainer}>
        <View style={styles.dragHandle} />
      </View>

      <View style={styles.headerContent}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          {isModal ? <X size={26} color="#FFF" /> : <ChevronLeft size={26} color="#FFF" />}
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSubtitle}>Manajemen Produk</Text>
          <Text style={styles.headerTitle}>Tambah Produk</Text>
        </View>

        <PackagePlus size={30} color="rgba(255,255,255,0.85)" />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  dragHandleContainer: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  dragHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'PoppinsMedium', // Gunakan Poppins
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontFamily: 'MontserratBold', // Khusus ini pakai Montserrat
  },
});