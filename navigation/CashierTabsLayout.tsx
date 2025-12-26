import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import CashierDashboard from '../screens/Main/dashboard/cashier/CashierDashboard';
import TransactionScreen from '../screens/Main/transaction/TransactionScreen';
import ProductScreen from '../screens/Main/product/ProductScreen';
import ProfileScreen from '../screens/Main/profile/ProfileScreen'; // Pastikan ini diimport
import { BottomNavigation } from '../components/dashboard/BottomNavigation';
import { CashierTabParamList, RootStackParamList } from './types';

const Tab = createBottomTabNavigator<CashierTabParamList>();

const CashierTabsLayout = () => {
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      tabBar={(props) => (
        <BottomNavigation 
          {...props} 
          // Cashier: Tombol tengah membuka layar transaksi/scan
          onFabPress={() => rootNav.navigate('Cashier')} 
        />
      )}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="CashierDashboard" component={CashierDashboard} />
      <Tab.Screen name="Product" component={ProductScreen} />
      <Tab.Screen name="Transaction" component={TransactionScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} /> 
    </Tab.Navigator>
  );
};

export default CashierTabsLayout;