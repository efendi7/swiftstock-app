import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LogOut, ShoppingCart, Banknote } from 'lucide-react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { COLORS } from '../../constants/colors';

interface CashierHeaderProps {
  headerHeight: Animated.AnimatedInterpolation<number | string>;
  contentOpacity: Animated.AnimatedInterpolation<number | string>;
  topPadding: number;
  userName: string;
  todayTransactions: number;
  todayRevenue: number;
}

export const CashierHeader: React.FC<CashierHeaderProps> = ({
  headerHeight,
  contentOpacity,
  topPadding,
  userName,
  todayTransactions,
  todayRevenue,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // ✅ Firebase Logout handler (seperti DashboardHeader)
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Animated.View style={[styles.header, { height: headerHeight, paddingTop: topPadding }]}>
      <LinearGradient colors={[COLORS.primary, '#2c537a']} style={StyleSheet.absoluteFill} />
      
      {/* BAGIAN YANG TETAP ADA (STAY) */}
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.greeting}>Halo Kasir,</Text>
          <Text style={styles.adminName}>{userName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutCircle} onPress={handleLogout}>
          <LogOut size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* ✅ PROFIT CARD - dengan opacity terpisah */}
      <Animated.View style={[styles.profitCard, { opacity: contentOpacity }]}>
        <View style={styles.profitLeft}>
          <Text style={styles.profitValue}>{formatCurrency(todayRevenue)}</Text>
          <Text style={styles.profitMessage}>Penjualan Hari Ini</Text>
        </View>
        <View style={styles.profitImageWrapper}>
          <Image 
            source={require('../../assets/images/dashboard/good.png')} 
            style={styles.profitImage} 
            resizeMode="contain" 
          />
        </View>
      </Animated.View>

      {/* ✅ BOTTOM STATS - dalam View biasa, bukan Animated */}
      <View style={styles.bottomStats}>
        <View style={styles.bottomCardCompact}>
          <View style={styles.iconBoxGreen}>
            <ShoppingCart size={16} color={COLORS.secondary} />
          </View>
          <View style={styles.bottomTextWrap}>
            <Text style={styles.bottomLabel}>Transaksi</Text>
            <Text style={styles.bottomValue}>{todayTransactions}</Text>
          </View>
        </View>

        <View style={styles.bottomCardCompact}>
          <View style={styles.iconBoxYellow}>
            <Banknote size={16} color="#B8860B" />
          </View>
          <View style={styles.bottomTextWrap}>
            <Text style={styles.bottomLabel}>Avg Sales</Text>
            <Text style={styles.bottomValue}>
              {formatCurrency(todayTransactions > 0 ? todayRevenue / todayTransactions : 0)}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    elevation: 5,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
  },

  greeting: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
  },

  adminName: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: 'MontserratBold',
  },

  logoutCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ===== PROFIT CARD ===== */
  profitCard: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  profitLeft: {
    flex: 1,
  },

  profitValue: {
    fontSize: 18,
    fontFamily: 'PoppinsBold',
    color: '#A5FFB0',
  },

  profitMessage: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'PoppinsMedium',
    color: '#FFF',
    opacity: 0.8,
  },

  profitImageWrapper: {
    width: 60,
    height: 56,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  profitImage: {
    width: 90,
    height: 90,
    position: 'absolute',
    right: -12,
    top: -18,
  },

  /* ===== BOTTOM STATS ===== */
  bottomStats: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  bottomCardCompact: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginHorizontal: 5,
    borderRadius: 14,
  },

  bottomTextWrap: {
    marginLeft: 8,
    flex: 1,
  },

  bottomLabel: {
    fontSize: 10,
    color: '#FFF',
    opacity: 0.75,
    fontFamily: 'PoppinsRegular',
  },

  bottomValue: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 1,
    fontFamily: 'PoppinsBold',
  },

  iconBoxGreen: {
    backgroundColor: '#E9F9EF',
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconBoxYellow: {
    backgroundColor: '#FFF9E6',
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});