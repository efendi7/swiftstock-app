import React, { ReactNode } from 'react';
import { View, StyleSheet, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signOut } from 'firebase/auth';
import { auth } from '../../../services/firebaseConfig';
import { COLORS } from '../../../constants/colors';
import { DashboardService } from '../../../services/dashboardService';
import { HeaderUserInfo } from './HeaderUserInfo';
import { HeaderActions } from './HeaderActions';

interface BaseDashboardHeaderProps {
  headerHeight: Animated.AnimatedInterpolation<number | string>;
  contentOpacity: Animated.AnimatedInterpolation<number | string>;
  topPadding: number;
  role: string;
  displayName: string;
  renderNotificationButton?: () => ReactNode;
  renderMainCard: (format: (v: number) => string, showDetail: (l: string, v: number) => void) => ReactNode;
  renderBottomStats: (format: (v: number) => string, showDetail: (l: string, v: number) => void) => ReactNode;
}

export const BaseDashboardHeader: React.FC<BaseDashboardHeaderProps> = ({
  headerHeight, contentOpacity, topPadding, role, displayName,
  renderNotificationButton, renderMainCard, renderBottomStats,
}) => {

  const formatValue = (val: number) => {
    const absVal = Math.abs(val);
    let result = absVal >= 1000000 ? `Rp ${(absVal / 1000000).toFixed(1)} jt` : DashboardService.formatCurrency(absVal);
    // Tambahkan logika ribuan/milyaran jika perlu sesuai kode asli Anda
    return val < 0 ? `-${result}` : result;
  };

  const showDetailValue = (label: string, value: number) => {
    Alert.alert(label, DashboardService.formatCurrency(value), [{ text: 'Oke' }]);
  };

  const handleLogout = async () => {
    try { await signOut(auth); } catch (e) { console.error('Logout error:', e); }
  };

  return (
    <Animated.View style={[styles.header, { height: headerHeight, paddingTop: topPadding }]}>
      <LinearGradient colors={[COLORS.primary, '#2c537a']} style={StyleSheet.absoluteFill} />

      <View style={styles.headerTop}>
        <HeaderUserInfo role={role} displayName={displayName} />
        <HeaderActions onLogout={handleLogout} renderNotification={renderNotificationButton} />
      </View>

      <Animated.View style={{ opacity: contentOpacity }}>
        {renderMainCard(formatValue, showDetailValue)}
      </Animated.View>

      {renderBottomStats(formatValue, showDetailValue)}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: { 
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, 
    paddingHorizontal: 20, paddingBottom: 25, 
    borderBottomLeftRadius: 35, borderBottomRightRadius: 35, 
    overflow: 'hidden', elevation: 8 
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 50, marginBottom: 5 },
});