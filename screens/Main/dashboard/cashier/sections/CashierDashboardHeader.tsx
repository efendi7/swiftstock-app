import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ShoppingCart, Banknote } from 'lucide-react-native';
import { Animated } from 'react-native';
import { COLORS } from '../../../../../constants/colors';
import { BaseDashboardHeader } from '../../../../../components/dashboard/header/BaseDashboardHeader';
import { DashboardService } from '../../../../../services/dashboardService';

interface CashierDashboardHeaderProps {
  headerHeight: Animated.AnimatedInterpolation<number | string>;
  contentOpacity: Animated.AnimatedInterpolation<number | string>;
  topPadding: number;
  role: string;
  displayName: string;
  todayTransactions: number;
  todayOut: number;
  todayRevenue: number;
}

export const CashierDashboardHeader: React.FC<CashierDashboardHeaderProps> = ({
  headerHeight,
  contentOpacity,
  topPadding,
  role,
  displayName,
  todayTransactions,
  todayOut,
  todayRevenue,
}) => {
  // --- LOGIKA KONDISI GAMBAR (Hanya 2 Kondisi) ---
  const isNeutral = todayRevenue === 0;
  
  const getStatusImage = () => {
    return isNeutral 
      ? require('../../../../../assets/images/dashboard/netral.png') 
      : require('../../../../../assets/images/dashboard/good.png');
  };

  const getStatusMessage = () => {
    return isNeutral ? 'Belum ada transaksi masuk.' : 'Kerja bagus! Terus semangat.';
  };

  const avgSales = todayTransactions > 0 ? todayRevenue / todayTransactions : 0;

  // Helper format khusus untuk Cashier (lebih sederhana)
  const formatValueCashier = (amount: number) => {
    if (amount >= 1000000) {
        const jt = (amount / 1000000).toFixed(1).replace(/\.0$/, '');
        return `Rp ${jt} jt`;
    }
    return DashboardService.formatCurrency(amount);
  };

  // Render main card (Revenue Card)
  const renderMainCard = (_: any, showDetail: (label: string, value: number) => void) => (
    <View style={styles.profitCard}>
      <TouchableOpacity 
        style={styles.profitLeft} 
        onPress={() => showDetail('Total Penjualan Hari Ini', todayRevenue)}
      >
        <Text style={styles.profitValue} numberOfLines={1}>
          {formatValueCashier(todayRevenue)}
        </Text>
        <Text style={styles.profitMessage}>{getStatusMessage()}</Text>
      </TouchableOpacity>
      
      <View style={styles.profitImageWrapper}>
        <Image source={getStatusImage()} style={styles.profitImage} resizeMode="contain" />
      </View>
    </View>
  );

  // Render bottom stats (Transactions & Avg Sales)
  const renderBottomStats = (_: any, showDetail: (label: string, value: number) => void) => (
    <View style={styles.bottomStats}>
      {/* Kolom Transaksi */}
      <View style={styles.bottomCardCompact}>
        <View style={styles.iconBoxGreen}>
          <ShoppingCart size={14} color={COLORS.secondary} />
        </View>
        <View style={styles.bottomTextWrap}>
          <Text style={styles.bottomLabel}>Transaksi</Text>
          <Text style={styles.bottomValue}>
             {todayTransactions} <Text style={styles.unitText}>Nota</Text>
             <Text style={styles.separator}> • </Text>
             {todayOut} <Text style={styles.unitText}>Unit</Text>
          </Text>
        </View>
      </View>

      {/* Kolom Avg Sales */}
      <TouchableOpacity 
        style={styles.bottomCardCompact}
        onPress={() => showDetail('Rata-rata Penjualan (Avg Sales)', avgSales)}
      >
        <View style={styles.iconBoxYellow}>
          <Banknote size={14} color="#B8860B" />
        </View>
        <View style={styles.bottomTextWrap}>
          <Text style={styles.bottomLabel}>Avg Sales</Text>
          <Text style={styles.bottomValue} numberOfLines={1}>{formatValueCashier(avgSales)}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <BaseDashboardHeader
      headerHeight={headerHeight}
      contentOpacity={contentOpacity}
      topPadding={topPadding}
      role={role}
      displayName={displayName}
      renderMainCard={renderMainCard}
      renderBottomStats={renderBottomStats}
    />
  );
};

const styles = StyleSheet.create({
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
    fontFamily: 'PoppinsBold', 
    color: '#A5FFB0' 
  },
  profitMessage: { 
    fontSize: 11, 
    fontFamily: 'PoppinsMedium', 
    color: '#FFF', 
    opacity: 0.8 
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
  unitText: { 
    fontSize: 8, 
    opacity: 0.8, 
    fontFamily: 'PoppinsRegular' 
  },
  separator: { 
    fontSize: 10, 
    color: '#A5FFB0' 
  },
  iconBoxGreen: { 
    backgroundColor: '#E9F9EF', 
    width: 26, 
    height: 26, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  iconBoxYellow: { 
    backgroundColor: '#FFF9E6', 
    width: 26, 
    height: 26, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
});