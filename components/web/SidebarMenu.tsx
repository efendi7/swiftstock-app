import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '@constants/colors';
import { UserRole } from '@navigation/types';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Store,
  BarChart3,
  CreditCard,
} from 'lucide-react-native';
import { auth } from '@services/firebaseConfig';

interface SidebarMenuProps {
  role?: UserRole | null;
  tenantId?: string | null;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ role, tenantId }) => {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Menu untuk SuperAdmin
  const superAdminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', route: 'Dashboard' },
    { icon: Store, label: 'All Tenants', route: 'Tenants' },
    { icon: Users, label: 'All Users', route: 'Users' },
    { icon: BarChart3, label: 'Analytics', route: 'Analytics' },
    { icon: Settings, label: 'System Settings', route: 'Settings' },
  ];

  // ✅ Menu untuk Admin: Sinkron dengan AppNavigator
  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', route: 'Dashboard' },
    { icon: Package, label: 'Products', route: 'WebProducts' }, 
    { icon: ShoppingCart, label: 'Transactions', route: 'WebTransactions' },
    { icon: Users, label: 'Staff Management', route: 'WebCashierManagement' }, // ✅ Diperbarui
    { icon: CreditCard, label: 'Subscription', route: 'WebSubscription' }, 
    { icon: Settings, label: 'Settings', route: 'WebSettings' }, 
  ];

  // Menu untuk Cashier (Web)
  const cashierMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', route: 'Dashboard' },
    { icon: Package, label: 'Products', route: 'WebProducts' }, 
    { icon: ShoppingCart, label: 'My Transactions', route: 'WebTransactions' },
  ];

  const getMenuItems = () => {
    if (role === 'superadmin') return superAdminMenuItems;
    if (role === 'admin') return adminMenuItems;
    return cashierMenuItems;
  };

  const menuItems = getMenuItems();

  const MenuItem = ({ icon: Icon, label, route: menuRoute }: any) => {
    const isActive = route.name === menuRoute;

    return (
      <TouchableOpacity
        style={[styles.menuItem, isActive && styles.menuItemActive]}
        onPress={() => navigation.navigate(menuRoute)}
        activeOpacity={0.7}
      >
        <Icon
          size={20}
          color={isActive ? COLORS.secondary : 'rgba(255,255,255,0.7)'}
        />
        <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.brandName}>SwiftStock</Text>
          <Text style={styles.brandTagline}>
            {role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Admin Panel' : 'Cashier Panel'}
          </Text>
          {Platform.OS === 'web' && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>WEB VERSION</Text>
            </View>
          )}
        </View>

        <View style={styles.menuList}>
          {menuItems.map((item, index) => (
            <MenuItem key={index} {...item} />
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="rgba(255,255,255,0.7)" />
        <Text style={styles.logoutText}>Keluar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: { padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  brandName: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  brandTagline: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  badge: { backgroundColor: COLORS.secondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginTop: 8 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#FFF', letterSpacing: 0.5 },
  menuList: { paddingVertical: 20 },
  menuItem: { 
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, 
    paddingHorizontal: 24, marginHorizontal: 12, borderRadius: 12,
    // @ts-ignore
    cursor: 'pointer' 
  },
  menuItemActive: { backgroundColor: 'rgba(0, 167, 157, 0.15)' },
  menuText: { marginLeft: 12, fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  menuTextActive: { color: COLORS.secondary, fontWeight: '700' },
  logoutButton: { 
    flexDirection: 'row', alignItems: 'center', padding: 24, 
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
    // @ts-ignore
    cursor: 'pointer' 
  },
  logoutText: { marginLeft: 12, fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
});

export default SidebarMenu;