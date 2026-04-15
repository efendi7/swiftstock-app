import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AdminDashboard         from '@/screens/main/dashboard/admin/AdminDashboard';
import ProductScreen          from '@/screens/main/product/ProductScreen';
import TransactionScreen      from '@/screens/main/transaction/TransactionScreen';
import ProfileScreen          from '@/screens/main/profile/ProfileScreen';
import CreateCashierScreen    from '@/screens/main/profile/CreateCashierScreen';
import CashierManagementScreen from '@/screens/main/profile/CashierManagementScreen';

import { AdminTabParamList }  from '@navigation/types';
import { BottomNavigation }   from '@components/common/BottomNavigation';
import { AddProductModal }    from '@/screens/main/product/modal/AddProductModal';

// ✅ Ambil tenantId dari useAuth
import { useAuth } from '@hooks/auth/useAuth';

const Tab = createBottomTabNavigator<AdminTabParamList>();

const AdminMobileNavigator = () => {
  const insets = useSafeAreaInsets();
  const { tenantId } = useAuth(); // ✅

  const [showAddProduct, setShowAddProduct] = useState(false);

  const categories = [
    { label: 'Makanan', value: 'makanan' },
    { label: 'Minuman', value: 'minuman' },
    { label: 'Lainnya', value: 'lainnya' },
  ];

  return (
    <>
      <Tab.Navigator
        tabBar={props => (
          <BottomNavigation
            {...props}
            onFabPress={() => setShowAddProduct(true)}
          />
        )}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="AdminDashboard"    component={AdminDashboard} />
        <Tab.Screen name="Product"           component={ProductScreen} />
        <Tab.Screen name="Transaction"       component={TransactionScreen} />
        <Tab.Screen name="Profile"           component={ProfileScreen} />
        <Tab.Screen name="CreateCashier"     component={CreateCashierScreen}     options={{ tabBarButton: () => null }} />
        <Tab.Screen name="CashierManagement" component={CashierManagementScreen} options={{ tabBarButton: () => null }} />
      </Tab.Navigator>

      <AddProductModal
        visible={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onSuccess={() => setShowAddProduct(false)}
        categories={categories}
        tenantId={tenantId}  // ✅ pass tenantId
      />
    </>
  );
};

export default AdminMobileNavigator;