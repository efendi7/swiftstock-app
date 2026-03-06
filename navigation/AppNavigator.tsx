import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet, Platform, Text } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORT SERVICES & CONSTANTS
import { auth, db } from '@services/firebaseConfig';
import { COLORS } from '@constants/colors';

// SCREENS
import { LandingPage } from '@/screens/public/LandingPage';
import { LoginScreen, RegisterScreen } from '@/screens/auth';
import { OnboardingScreen } from '@screens/onboarding';

// WEB SPECIFIC
import WebLayout from '@layouts/WebLayout';
import AdminDashboardWeb from '@/screens/main/dashboard/admin/AdminDashboard.web';
import SuperAdminDashboardWeb from '@/screens/main/dashboard/superadmin/SuperAdminDashboard.web';

// ✅ WEB SCREENS
import ProductScreenWeb from '@/screens/main/product/ProductScreen.web';
import TransactionScreenWeb from '@/screens/main/transaction/TransactionScreen.web';
import CashierManagementWeb from '@/screens/main/cashier/CashierManagement.web'; // Pastikan path ini benar

// MOBILE SPECIFIC
import AdminMobileNavigator from '@navigation/AdminMobileNavigator';
import CashierMobileNavigator from '@navigation/CashierMobileNavigator';
import CashierScreen from '@/screens/main/transaction/CashierScreen';

import { RootStackParamList, UserRole } from '@navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (Platform.OS === 'web') {
        setIsFirstLaunch(false);
        return;
      }
      try {
        const value = await AsyncStorage.getItem('@alreadyLaunched');
        setIsFirstLaunch(value === null);
      } catch (e) {
        setIsFirstLaunch(false);
      }
    };

    checkOnboarding();

    const unsub = onAuthStateChanged(auth, async currentUser => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setRole(userData.role || 'cashier');
            setTenantId(userData.tenantId || null);
          } else {
            setRole('cashier');
            setTenantId(null);
          }
          setUser(currentUser);
        } catch (error) {
          console.error('Error fetching user role:', error);
          setRole('cashier');
          setUser(currentUser);
        }
      } else {
        setUser(null);
        setRole(null);
        setTenantId(null);
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  if (loading || isFirstLaunch === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
      }}>
      {!user ? (
        <>
          <Stack.Screen name="LandingPage" component={LandingPage} />
          {isFirstLaunch && Platform.OS !== 'web' && (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          )}
          <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ animation: 'slide_from_right' }} />
        </>
      ) : (
        <>
          {/* ==================== WEB ROUTES ==================== */}
          {Platform.OS === 'web' && (
            <>
              <Stack.Screen name="Dashboard">
                {() => (
                  <WebLayout role={role} tenantId={tenantId}>
                    {role === 'superadmin' ? <SuperAdminDashboardWeb /> : <AdminDashboardWeb />}
                  </WebLayout>
                )}
              </Stack.Screen>

              <Stack.Screen name="WebProducts">
                {() => (
                  <WebLayout role={role} tenantId={tenantId}>
                    <ProductScreenWeb />
                  </WebLayout>
                )}
              </Stack.Screen>

              <Stack.Screen name="WebTransactions">
                {() => (
                  <WebLayout role={role} tenantId={tenantId}>
                    <TransactionScreenWeb />
                  </WebLayout>
                )}
              </Stack.Screen>

              {/* ✅ STAFF MANAGEMENT ROUTE */}
              <Stack.Screen name="WebCashierManagement">
                {() => (
                  <WebLayout role={role} tenantId={tenantId}>
                    <CashierManagementWeb />
                  </WebLayout>
                )}
              </Stack.Screen>

              {/* PLACEHOLDERS */}
              <Stack.Screen name="WebSubscription">
                {() => (
                  <WebLayout role={role} tenantId={tenantId}>
                    <View style={styles.placeholderContainer}>
                      <Text style={styles.placeholderText}>Subscription Management (Coming Soon)</Text>
                    </View>
                  </WebLayout>
                )}
              </Stack.Screen>

              <Stack.Screen name="WebSettings">
                {() => (
                  <WebLayout role={role} tenantId={tenantId}>
                    <View style={styles.placeholderContainer}>
                      <Text style={styles.placeholderText}>Settings Screen (Coming Soon)</Text>
                    </View>
                  </WebLayout>
                )}
              </Stack.Screen>
            </>
          )}

          {/* ==================== MOBILE ROUTES ==================== */}
          {Platform.OS !== 'web' && (
            <>
              {role === 'superadmin' || role === 'admin' ? (
                <Stack.Screen name="AdminMobileNavigator" component={AdminMobileNavigator} />
              ) : (
                <Stack.Screen name="CashierMobileNavigator" component={CashierMobileNavigator} />
              )}
              <Stack.Screen name="Cashier" component={CashierScreen} />
            </>
          )}
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  placeholderText: { fontSize: 18, color: COLORS.textLight, fontWeight: '600' },
});

export default AppNavigator;