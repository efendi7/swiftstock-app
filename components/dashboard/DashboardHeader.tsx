import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  LogOut,
  TrendingUp,
  TrendingDown,
  Siren,
  HeartPulse,
} from 'lucide-react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { COLORS } from '../../constants/colors';
import { DashboardService } from '../../services/dashboardService';

interface DashboardHeaderProps {
  headerHeight: Animated.AnimatedInterpolation<number | string>;
  revenueOpacity: Animated.AnimatedInterpolation<number | string>;
  topPadding: number;
  totalRevenue: number;
  totalExpense: number;
  totalProfit: number;
  lowStockCount: number;
  onLowStockPress: () => void;
  role?: string;
  displayName: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  headerHeight,
  revenueOpacity,
  topPadding,
  totalRevenue,
  totalExpense,
  totalProfit,
  lowStockCount,
  onLowStockPress,
  role = 'Administrator',
  displayName,
}) => {
  // --- LOGIKA KONDISI PROFIT ---
  const isNeutral = totalProfit === 0;
  const isProfit = totalProfit > 0;

  const getStatusColor = () => {
    if (isNeutral) return '#FFFF00'; // Kuning
    return isProfit ? '#A5FFB0' : '#FFB3B3'; // Hijau : Merah Muda
  };

  const getStatusMessage = () => {
    if (isNeutral) return 'Belum ada data laba nih.';
    return isProfit ? 'Wah, toko lagi untung nih!' : 'Perhatikan pengeluaranmu!';
  };

  const getStatusImage = () => {
    if (isNeutral) return require('../../assets/images/dashboard/netral.png');
    return isProfit 
      ? require('../../assets/images/dashboard/good.png') 
      : require('../../assets/images/dashboard/sad.png');
  };

  // --- HELPER FORMAT RUPIAH COMPACT ---
  const formatValue = (val: number) => {
    const absVal = Math.abs(val);
    let result = '';
    if (absVal >= 1000000000) result = `Rp ${(absVal / 1000000000).toFixed(1)} M`;
    else if (absVal >= 1000000) result = `Rp ${(absVal / 1000000).toFixed(1)} jt`;
    else if (absVal >= 1000) result = `Rp ${(absVal / 1000).toFixed(0)} rb`;
    else result = DashboardService.formatCurrency(absVal);

    return val < 0 ? `-${result}` : result;
  };

  const showDetailValue = (label: string, value: number) => {
    Alert.alert(label, DashboardService.formatCurrency(value), [{ text: 'Oke' }]);
  };

  const hasLowStock = lowStockCount > 0;
  const bellColor = hasLowStock ? '#EF4444' : '#10B981';
  const bellBgColor = hasLowStock ? '#FEE2E2' : '#D1FAE5';

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

      {/* SECTION: HEADER TOP */}
      <View style={styles.headerTop}>
        <View style={styles.userInfo}>
          <Text style={styles.greeting}>Selamat Datang, {role}</Text>
          <Text style={styles.adminName} numberOfLines={1}>
            {displayName || 'Admin'}
          </Text>
        </View>

        <View style={styles.headerRightButtons}>
          <TouchableOpacity
            style={[styles.bellCircle, { backgroundColor: bellBgColor }]}
            onPress={onLowStockPress}
          >
            {hasLowStock ? <Siren size={18} color={bellColor} /> : <HeartPulse size={18} color={bellColor} />}
            {hasLowStock && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{lowStockCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutCircle} onPress={handleLogout}>
            <LogOut size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* SECTION: PROFIT CARD (LABA) */}
      <Animated.View style={[styles.profitCard, { opacity: revenueOpacity }]}>
        <TouchableOpacity 
          style={styles.profitLeft} 
          onPress={() => showDetailValue('Total Laba/Rugi', totalProfit)}
        >
          <Text style={[styles.profitValue, { color: getStatusColor() }]} numberOfLines={1}>
            {formatValue(totalProfit)}
          </Text>
          <Text style={[styles.profitMessage, { color: getStatusColor() }]}>
            {getStatusMessage()}
          </Text>
        </TouchableOpacity>

        <View style={styles.profitImageWrapper}>
          <Image source={getStatusImage()} style={styles.profitImage} resizeMode="contain" />
        </View>
      </Animated.View>

      {/* SECTION: BOTTOM STATS (PENDAPATAN & PENGELUARAN) */}
      <View style={styles.bottomStats}>
        <TouchableOpacity 
          style={styles.bottomCardCompact}
          onPress={() => showDetailValue('Total Pendapatan', totalRevenue)}
        >
          <View style={styles.iconBoxGreen}>
            <TrendingUp size={14} color={COLORS.secondary} />
          </View>
          <View style={styles.bottomTextWrap}>
            <Text style={styles.bottomLabel}>Total Pendapatan</Text>
            <Text style={styles.bottomValue} numberOfLines={1}>{formatValue(totalRevenue)}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.bottomCardCompact}
          onPress={() => showDetailValue('Total Pengeluaran', totalExpense)}
        >
          <View style={styles.iconBoxRed}>
            <TrendingDown size={14} color="#E74C3C" />
          </View>
          <View style={styles.bottomTextWrap}>
            <Text style={styles.bottomLabel}>Total Pengeluaran</Text>
            <Text style={styles.bottomValue} numberOfLines={1}>{formatValue(totalExpense)}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: { 
    position: 'absolute', 
    top: 0, left: 0, right: 0, 
    zIndex: 10, 
    paddingHorizontal: 20, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    overflow: 'hidden', 
    elevation: 5 
  },
  headerTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    height: 50 
  },
  userInfo: { flex: 1 },
  greeting: { 
    color: 'rgba(255,255,255,0.7)', 
    fontSize: 11, 
    fontFamily: 'PoppinsRegular' 
  },
  adminName: { 
    color: '#FFF', 
    fontSize: 18, 
    fontFamily: 'MontserratBold' 
  },
  headerRightButtons: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  bellCircle: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  badge: { 
    position: 'absolute', 
    top: -2, right: -2, 
    backgroundColor: '#EF4444', 
    borderRadius: 10, 
    minWidth: 16, height: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF'
  },
  badgeText: { 
    color: '#FFF', 
    fontSize: 8, 
    fontFamily: 'PoppinsBold' 
  },
  logoutCircle: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  profitCard: { 
    marginTop: 10, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    borderRadius: 18, 
    paddingVertical: 10, 
    paddingHorizontal: 14, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  profitLeft: { flex: 1 },
  profitValue: { 
    fontSize: 22, 
    fontFamily: 'PoppinsBold' 
  },
  profitMessage: { 
    fontSize: 11, 
    fontFamily: 'PoppinsMedium', 
    opacity: 0.9 
  },
  profitImageWrapper: { 
    width: 50, 
    height: 50, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  profitImage: { 
    width: 70, 
    height: 70, 
    position: 'absolute', 
    right: -10 
  },
  bottomStats: { 
    marginTop: 12, 
    flexDirection: 'row', 
    gap: 8 
  },
  bottomCardCompact: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.12)', 
    paddingVertical: 8, 
    paddingHorizontal: 10, 
    borderRadius: 14 
  },
  bottomTextWrap: { 
    marginLeft: 8, 
    flex: 1 
  },
  bottomLabel: { 
    fontSize: 9, 
    color: '#FFF', 
    opacity: 0.8, 
    fontFamily: 'PoppinsRegular' 
  },
  bottomValue: { 
    fontSize: 11, 
    color: '#FFF', 
    fontFamily: 'PoppinsBold' 
  },
  iconBoxGreen: { 
    backgroundColor: '#E9F9EF', 
    width: 26, 
    height: 26, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  iconBoxRed: { 
    backgroundColor: '#FDECEA', 
    width: 26, 
    height: 26, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});