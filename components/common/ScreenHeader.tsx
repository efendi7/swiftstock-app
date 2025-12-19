// components/common/ScreenHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';

interface ScreenHeaderProps {
  title: string;              // Judul utama, misal "Daftar Produk"
  subtitle?: string;          // Opsional, misal "Manajemen Produk"
  icon?: React.ReactNode;     // Ikon di kanan (bisa PackagePlus, ShoppingCart, dll)
  onBackPress?: () => void;   // Jika ada, tampilkan tombol kembali
  backIcon?: 'chevron' | 'close'; // Pilih ikon kembali: panah atau X
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle = 'Manajemen',
  icon,
  onBackPress,
  backIcon = 'chevron',
}) => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[COLORS.primary, '#2c537a']}
      style={[styles.header, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.headerContent}>
        {/* Tombol Kembali (jika ada) */}
        {onBackPress && (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            {backIcon === 'close' ? (
              <X size={26} color="#FFF" />
            ) : (
              <ChevronLeft size={26} color="#FFF" />
            )}
          </TouchableOpacity>
        )}

        {/* Judul */}
        <View style={[styles.titleContainer, onBackPress && styles.titleWithBack]}>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* Ikon Kanan */}
        <View style={styles.rightIcon}>
          {icon || <View style={{ width: 30 }} />}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 36,
    paddingHorizontal: 20,
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
    marginRight: 15,
  },
  titleContainer: {
    flex: 1,
  },
  titleWithBack: {
    marginLeft: 0, // Tidak perlu margin jika ada back button
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'PoppinsMedium',
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontFamily: 'MontserratBold',
    marginTop: 4,
  },
  rightIcon: {
    width: 40,
    alignItems: 'center',
  },
});