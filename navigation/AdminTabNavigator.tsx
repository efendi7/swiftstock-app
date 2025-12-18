import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import AdminDashboard from '../screens/Main/AdminDashboard';
import ProductScreen from '../screens/Main/ProductScreen';
import TransactionScreen from '../screens/Main/TransactionScreen';
// import ProfileScreen from '../screens/Main/ProfileScreen';

import { AdminTabParamList } from './types';
import { BottomNavigation } from '../components/dashboard/BottomNavigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator<AdminTabParamList>();

interface AdminTabNavigatorProps {
  onFabPress: () => void;
}

const AdminTabNavigator: React.FC<AdminTabNavigatorProps> = ({ onFabPress }) => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
  tabBar={(props) => (
    <BottomNavigation
      {...props}
      onFabPress={onFabPress}
    />
  )}
>

      <Tab.Screen name="AdminDashboard" component={AdminDashboard} />
      <Tab.Screen name="Product" component={ProductScreen} />
      <Tab.Screen name="Transaction" component={TransactionScreen} />
      {/* <Tab.Screen name="Profile" component={ProfileScreen} /> */}
    </Tab.Navigator>
  );
};

export default AdminTabNavigator;