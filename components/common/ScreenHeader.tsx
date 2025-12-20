import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onBackPress?: () => void;
  backIcon?: 'chevron' | 'close';
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  icon,
  onBackPress,
  backIcon = 'chevron',
}) => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      // Kembali ke warna asli Anda
      colors={[COLORS.primary, '#2c537a']}
      style={[styles.header, { paddingTop: insets.top + 12 }]}
    >
      <View style={styles.headerContent}>
        {onBackPress && (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            {backIcon === 'close' ? (
              <X size={26} color="#FFF" />
            ) : (
              <ChevronLeft size={26} color="#FFF" />
            )}
          </TouchableOpacity>
        )}

        <View style={[styles.titleContainer, onBackPress && styles.titleWithBack]}>
          {/* Subtitle: Nama User (Montserrat) */}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          {/* Title: Judul Transaksi (Poppins) */}
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.rightIcon}>
          {icon || <View style={{ width: 30 }} />}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 36, // Jarak asli Anda
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
    marginLeft: 0,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'MontserratSemiBold', // Tetap gunakan Montserrat untuk nama
  },
  title: {
    color: '#FFF',
    fontSize: 22, // Ukuran asli Anda
    fontFamily: 'PoppinsBold', // Tetap gunakan Poppins untuk judul
    marginTop: 4,
    lineHeight: 28, // Agar rapi saat ada \n
  },
  rightIcon: {
    width: 40,
    alignItems: 'center',
  },
});