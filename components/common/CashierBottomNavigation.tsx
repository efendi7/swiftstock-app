/**
 * CashierBottomNavigation.tsx
 * Bottom nav kasir — 5 tab dengan FAB Scan di tengah.
 * Style mengikuti BottomNavigation admin (rounded top, shadow, gradient FAB).
 *
 * Layout:  Kasir · Produk · [FAB Scan] · Absensi · Profil
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  CalendarCheck, Package, Scan, Receipt, User,
} from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import { useNavigation } from '@react-navigation/native';

// Tab kiri & kanan FAB — 2 kiri, 2 kanan
const LEFT_TABS  = [
  { route: 'Attendance', label: 'Absensi', Icon: CalendarCheck },
  { route: 'Product',    label: 'Produk',  Icon: Package       },
];
const RIGHT_TABS = [
  { route: 'Transaction', label: 'Transaksi', Icon: Receipt },
  { route: 'Profile',     label: 'Profil',    Icon: User    },
];

export const CashierBottomNavigation: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
  insets,
}) => {
  const currentRoute = state.routes[state.index].name;
  const isActive = (route: string) => currentRoute === route;

  const nav = useNavigation<any>();

  const handleFab = () => {
    // FAB → buka CashierScreen (layar POS kasir dengan scanner)
    nav.navigate('Cashier');
  };

  const renderTab = (tab: typeof LEFT_TABS[0]) => {
    const active = isActive(tab.route);
    const { Icon } = tab;
    return (
      <TouchableOpacity
        key={tab.route}
        style={styles.navItem}
        onPress={() => navigation.navigate(tab.route)}
        activeOpacity={0.7}
      >
        <Icon
          size={22}
          color={active ? COLORS.secondary : COLORS.textLight}
        />
        <Text style={[styles.navLabel, { color: active ? COLORS.secondary : COLORS.textLight }]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.footerWrapper, { paddingBottom: insets.bottom }]}>
      <View style={styles.navContainer}>

        {/* Kiri: Kasir · Produk */}
        {LEFT_TABS.map(renderTab)}

        {/* Placeholder tengah untuk FAB */}
        <View style={styles.fabPlaceholder} />

        {/* Kanan: Absensi · Profil */}
        {RIGHT_TABS.map(renderTab)}

      </View>

      {/* FAB Scan di tengah */}
      <TouchableOpacity
        style={[styles.fabButton, { bottom: 25 + insets.bottom }]}
        onPress={handleFab}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.secondary, '#008e85']}
          style={styles.fabGradient}
        >
          <Scan size={30} color="#FFF" />
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
    justifyContent: 'center',
  },
  fabPlaceholder: {
    width: 70, // ruang untuk FAB agar tab tidak tertutup
  },
  navLabel: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'PoppinsMedium',
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

export default CashierBottomNavigation;