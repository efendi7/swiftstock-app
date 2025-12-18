import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AdminDashboard from '../screens/Main/AdminDashboard';
import ProductScreen from '../screens/Main/ProductScreen';
import TransactionScreen from '../screens/Main/TransactionScreen';
// import ProfileScreen from '../screens/Main/ProfileScreen';

import { AdminTabParamList } from './types';
import { BottomNavigation } from '../components/dashboard/BottomNavigation';
import AddProductModal from '../screens/Main/modal/AddProductModal';

const Tab = createBottomTabNavigator<AdminTabParamList>();

const AdminTabsLayout = () => {
  const insets = useSafeAreaInsets();
  const [showAddProduct, setShowAddProduct] = useState(false);

  const handleProductAdded = () => {
    setShowAddProduct(false);
  };

  return (
    <>
      <Tab.Navigator
  tabBar={(props) => (
    <BottomNavigation
      {...props}
      onFabPress={() => setShowAddProduct(true)}
    />
  )}
  screenOptions={{ headerShown: false }}
>

        <Tab.Screen name="AdminDashboard" component={AdminDashboard} />
        <Tab.Screen name="Product" component={ProductScreen} />
        <Tab.Screen name="Transaction" component={TransactionScreen} />
        {/* <Tab.Screen name="Profile" component={ProfileScreen} /> */}
      </Tab.Navigator>

      <AddProductModal
        visible={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onSuccess={handleProductAdded}
      />
    </>
  );
};

export default AdminTabsLayout;