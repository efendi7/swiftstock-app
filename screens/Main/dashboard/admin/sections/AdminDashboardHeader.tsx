import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { TrendingUp, TrendingDown, Siren, HeartPulse } from 'lucide-react-native';
import { COLORS } from '../../../../../constants/colors';
import { BaseDashboardHeader } from '../../../../../components/dashboard/header';

interface AdminDashboardHeaderProps {
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

export const AdminDashboardHeader: React.FC<AdminDashboardHeaderProps> = ({
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
  // --- ANIMASI PULSE UNTUK MOOD ---
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // --- LOGIKA AI MOOD ENGINE ---
  const getMoodData = () => {
    if (totalProfit === 0) {
      return {
        color: '#FFFF00',
        msg: 'Belum ada data laba hari ini.',
        img: require('../../../../../assets/images/dashboard/netral.png'),
        insight: 'Menunggu transaksi pertama...'
      };
    }
    if (totalProfit > 1000000) { // Target Profit > 1jt (Bisa disesuaikan)
      return {
        color: '#00FF47',
        msg: 'Gila! Cuan parah hari ini! 🔥',
        img: require('../../../../../assets/images/dashboard/rich.png'),
        insight: `Laba bersih ${(totalProfit / totalRevenue * 100).toFixed(1)}% dari omzet.`
      };
    }
    if (totalProfit > 0) {
      return {
        color: '#A5FFB0',
        msg: 'Wah, toko lagi untung nih!',
        img: require('../../../../../assets/images/dashboard/good.png'),
        insight: 'Pertahankan performa ini!'
      };
    }
    if (totalProfit < -500000) { // Rugi besar
      return {
        color: '#FF4C4C',
        msg: 'GAWAT! Rugi cukup dalam!',
        img: require('../../../../../assets/images/dashboard/panic.png'),
        insight: 'Segera evaluasi biaya operasional!'
      };
    }
    return {
      color: '#FFB3B3',
      msg: 'Perhatikan pengeluaranmu!',
      img: require('../../../../../assets/images/dashboard/sad.png'),
      insight: 'Laba minus, coba cek stok barang.'
    };
  };

  const mood = getMoodData();

  const hasLowStock = lowStockCount > 0;

  const renderNotificationButton = () => (
    <TouchableOpacity
      style={[styles.bellCircle, { backgroundColor: hasLowStock ? '#FEE2E2' : '#D1FAE5' }]}
      onPress={onLowStockPress}
    >
      {hasLowStock ? <Siren size={18} color="#EF4444" /> : <HeartPulse size={18} color="#10B981" />}
      {hasLowStock && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{lowStockCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderMainCard = (formatValue: (val: number) => string, showDetail: (label: string, value: number) => void) => (
    <View style={styles.profitCard}>
      <TouchableOpacity 
        style={styles.profitLeft} 
        onPress={() => showDetail('Total Laba/Rugi', totalProfit)}
      >
        <Text style={[styles.profitValue, { color: mood.color }]} numberOfLines={1}>
          {formatValue(totalProfit)}
        </Text>
        <Text style={[styles.profitMessage, { color: mood.color }]}>
          {mood.msg}
        </Text>
        {/* AI Insight Text */}
        <Text style={styles.aiInsightText}>
          ✨ {mood.insight}
        </Text>
      </TouchableOpacity>

      <Animated.View style={[styles.profitImageWrapper, { transform: [{ scale: pulseAnim }] }]}>
        <Image source={mood.img} style={styles.profitImage} resizeMode="contain" />
      </Animated.View>
    </View>
  );

  const renderBottomStats = (formatValue: (val: number) => string, showDetail: (label: string, value: number) => void) => (
    <View style={styles.bottomStats}>
      <TouchableOpacity style={styles.bottomCardCompact} onPress={() => showDetail('Total Pendapatan', totalRevenue)}>
        <View style={styles.iconBoxGreen}><TrendingUp size={14} color={COLORS.secondary} /></View>
        <View style={styles.bottomTextWrap}>
          <Text style={styles.bottomLabel}>Pendapatan</Text>
          <Text style={styles.bottomValue} numberOfLines={1}>{formatValue(totalRevenue)}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.bottomCardCompact} onPress={() => showDetail('Total Pengeluaran', totalExpense)}>
        <View style={styles.iconBoxRed}><TrendingDown size={14} color="#E74C3C" /></View>
        <View style={styles.bottomTextWrap}>
          <Text style={styles.bottomLabel}>Pengeluaran</Text>
          <Text style={styles.bottomValue} numberOfLines={1}>{formatValue(totalExpense)}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <BaseDashboardHeader
      headerHeight={headerHeight}
      contentOpacity={revenueOpacity}
      topPadding={topPadding}
      role={role}
      displayName={displayName}
      renderNotificationButton={renderNotificationButton}
      renderMainCard={renderMainCard}
      renderBottomStats={renderBottomStats}
    />
  );
};

const styles = StyleSheet.create({
  bellCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#FFF' },
  badgeText: { color: '#FFF', fontSize: 8, fontFamily: 'PoppinsBold' },
  profitCard: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  profitLeft: { flex: 1 },
  profitValue: { fontSize: 22, fontFamily: 'PoppinsBold' },
  profitMessage: { fontSize: 11, fontFamily: 'PoppinsMedium' },
  aiInsightText: { fontSize: 9, color: '#FFF', opacity: 0.7, marginTop: 4, fontFamily: 'PoppinsRegular' },
  profitImageWrapper: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
  profitImage: { width: 80, height: 80, position: 'absolute', right: -15 },
  bottomStats: { marginTop: 12, flexDirection: 'row', gap: 8 },
  bottomCardCompact: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 14 },
  bottomTextWrap: { marginLeft: 8, flex: 1 },
  bottomLabel: { fontSize: 9, color: '#FFF', opacity: 0.8, fontFamily: 'PoppinsRegular' },
  bottomValue: { fontSize: 11, color: '#FFF', fontFamily: 'PoppinsBold' },
  iconBoxGreen: { backgroundColor: '#E9F9EF', width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  iconBoxRed: { backgroundColor: '#FDECEA', width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});