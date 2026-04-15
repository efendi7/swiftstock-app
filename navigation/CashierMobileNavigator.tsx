/**
 * CashierMobileNavigator.tsx
 * Tab: Kasir · Produk · [FAB Scan→CashierScreen] · Absensi · Profil
 *
 * Mengikuti pola AdminMobileNavigator.
 * Tab Transaction tidak tampil di bar — diakses dari stack (Cashier screen).
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import CashierScreen      from '@/screens/main/transaction/CashierScreen';
import ProductScreen      from '@/screens/main/product/ProductScreen';
import TransactionScreen  from '@/screens/main/transaction/TransactionScreen';
import AttendanceScreen   from '@/screens/main/attendance/AttendanceScreen';
import ProfileScreen      from '@/screens/main/profile/ProfileScreen';

import { CashierTabParamList }         from '@navigation/types';
import { CashierBottomNavigation }     from '@components/common/CashierBottomNavigation';

const Tab = createBottomTabNavigator<CashierTabParamList>();

const CashierMobileNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CashierBottomNavigation {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* Tab yang tampil di nav bar: Absensi · Produk · [FAB] · Transaksi · Profil */}
      <Tab.Screen name="Attendance"       component={AttendanceScreen}  />
      <Tab.Screen name="Product"          component={ProductScreen}     />
      <Tab.Screen name="Transaction"      component={TransactionScreen} />
      <Tab.Screen name="Profile"          component={ProfileScreen}     />

      {/* CashierDashboard (POS) — diakses via FAB Scan, tidak tampil di bar */}
      <Tab.Screen
        name="CashierDashboard"
        component={CashierScreen}
        options={{ tabBarButton: () => null }}
      />
    </Tab.Navigator>
  );
};

export default CashierMobileNavigator;