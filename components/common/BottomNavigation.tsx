import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  LayoutDashboard,
  Package,
  BarChart2,
  User,
  PackagePlus,
  Scan,
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';

interface Props extends BottomTabBarProps {
  onFabPress: () => void;
}

export const BottomNavigation: React.FC<Props> = ({
  state,
  navigation,
  onFabPress,
  insets,
}) => {
  const currentRoute = state.routes[state.index].name;
  const isCashierRole = state.routeNames.includes('CashierDashboard');

  const isActive = (routeName: string) => {
  if (routeName === 'Home') {
    return currentRoute === 'AdminDashboard' || currentRoute === 'CashierDashboard';
  }
  return currentRoute === routeName;
};

  const handleDashboardPress = () => {
    navigation.navigate(isCashierRole ? 'CashierDashboard' : 'AdminDashboard');
  };

  return (
    <View style={[styles.footerWrapper, { paddingBottom: insets.bottom }]}>
      <View style={styles.navContainer}>
        
        {/* 1. DASHBOARD */}
        <TouchableOpacity style={styles.navItem} onPress={handleDashboardPress}>
  <LayoutDashboard
    size={22}
    color={isActive('Home') ? COLORS.secondary : COLORS.textLight}
  />
  <Text style={[styles.navLabel, { color: isActive('Home') ? COLORS.secondary : COLORS.textLight }]}>
    Home
  </Text>
</TouchableOpacity>

        {/* 2. PRODUK (KASIR & ADMIN BISA LIHAT) */}
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Product')}>
          <Package
            size={22}
            color={isActive('Product') ? COLORS.secondary : COLORS.textLight}
          />
          <Text style={[styles.navLabel, { color: isActive('Product') ? COLORS.secondary : COLORS.textLight }]}>
            Produk
          </Text>
        </TouchableOpacity>

        {/* 3. SPACE TENGAH UNTUK FAB (DIBUAT TRANSPARAN) */}
        <View style={styles.fabPlaceholder} />

        {/* 4. TRANSAKSI / RIWAYAT */}
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Transaction')}>
          <BarChart2
            size={22}
            color={isActive('Transaction') ? COLORS.secondary : COLORS.textLight}
          />
          <Text style={[styles.navLabel, { color: isActive('Transaction') ? COLORS.secondary : COLORS.textLight }]}>
            {isCashierRole ? 'Riwayat' : 'Laporan'}
          </Text>
        </TouchableOpacity>

        {/* 5. PROFIL */}
<TouchableOpacity 
  style={styles.navItem} 
  onPress={() => navigation.navigate('Profile')}
>
  <User 
    size={22} 
    color={isActive('Profile') ? COLORS.secondary : COLORS.textLight} 
  />
  <Text style={[
    styles.navLabel, 
    { color: isActive('Profile') ? COLORS.secondary : COLORS.textLight }
  ]}>
    Profil
  </Text>
</TouchableOpacity>
      </View>

     {/* FAB BUTTON DI TENGAH */}
      <TouchableOpacity
        style={[styles.fabButton, { bottom: 25 + insets.bottom }]}
        onPress={onFabPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          
          colors={[COLORS.secondary, '#008e85']} 
          style={styles.fabGradient}
        >
          {isCashierRole ? (
            <Scan size={30} color="#FFF" />
          ) : (
            <PackagePlus size={30} color="#FFF" />
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  navContainer: {
    height: 75,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  navItem: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  fabPlaceholder: { 
    width: 70 // Memberikan ruang agar menu Produk dan Riwayat tidak bertabrakan dengan tombol tengah
  },
  navLabel: { 
    fontSize: 10, 
    marginTop: 4, 
    fontFamily: 'PoppinsMedium' 
  },
  fabButton: {
    position: 'absolute',
    alignSelf: 'center',
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFF',
    padding: 4,
    elevation: 10,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});