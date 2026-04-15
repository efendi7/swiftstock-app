import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet, Platform, Text } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { auth, db } from '@services/firebaseConfig';
import { COLORS } from '@constants/colors';

import { LandingPage } from '@/screens/public/LandingPage';
import { LoginScreen, RegisterScreen } from '@/screens/auth';
import { OnboardingScreen } from '@screens/onboarding';

import WebLayout                 from '@layouts/WebLayout';
import AdminDashboardWeb         from '@/screens/main/dashboard/admin/AdminDashboard.web';
import SuperAdminDashboardWeb    from '@/screens/main/dashboard/superadmin/SuperAdminDashboard.web';
import ProductScreenWeb          from '@/screens/main/product/ProductScreen.web';
import TransactionScreenWeb      from '@/screens/main/transaction/TransactionScreen.web';
import CashierManagementWeb      from '@/screens/main/cashier/CashierManagement.web';
import MemberManagementWeb       from '@/screens/main/member/MemberManagament.web';
import WebSettings               from '@/screens/main/settings/Setting.web';
import MemberPublicScreen        from '@/screens/public/MemberPublicScreen';

import AdminMobileNavigator      from '@navigation/AdminMobileNavigator';
import CashierMobileNavigator    from '@navigation/CashierMobileNavigator';
import CashierScreen             from '@/screens/main/transaction/CashierScreen';
import AttendanceHistoryScreen      from '@screens/main/attendance/AttendanceHistoryScreen';
import AttendanceManagementWeb      from '@screens/main/attendance/AttendanceManagement.web';

import { RootStackParamList, UserRole } from '@navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const [user,          setUser]          = useState<User | null>(null);
  const [role,          setRole]          = useState<UserRole | null>(null);
  const [tenantId,      setTenantId]      = useState<string | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (Platform.OS === 'web') { setIsFirstLaunch(false); return; }
      try {
        const value = await AsyncStorage.getItem('@alreadyLaunched');
        setIsFirstLaunch(value === null);
      } catch { setIsFirstLaunch(false); }
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
            setRole('cashier'); setTenantId(null);
          }
          setUser(currentUser);
        } catch {
          setRole('cashier'); setUser(currentUser);
        }
      } else {
        setUser(null); setRole(null); setTenantId(null);
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
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
      {!user ? (
        <>
          <Stack.Screen name="LandingPage" component={LandingPage} />
          {isFirstLaunch && Platform.OS !== 'web' && (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          )}
          <Stack.Screen name="Login"    component={LoginScreen}    options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ animation: 'slide_from_right' }} />
        </>
      ) : (
        <>
          {/* ── WEB ROUTES ─────────────────────────────────── */}
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

              <Stack.Screen name="WebCashierManagement">
                {() => (
                  <WebLayout role={role} tenantId={tenantId}>
                    <CashierManagementWeb />
                  </WebLayout>
                )}
              </Stack.Screen>

              <Stack.Screen name="WebMemberManagement">
                {() => (
                  <WebLayout role={role} tenantId={tenantId}>
                    <MemberManagementWeb />
                  </WebLayout>
                )}
              </Stack.Screen>

              <Stack.Screen name="WebSubscription">
                {() => (
                  <WebLayout role={role} tenantId={tenantId}>
                    <View style={styles.placeholder}>
                      <Text style={styles.placeholderText}>Subscription Management (Coming Soon)</Text>
                    </View>
                  </WebLayout>
                )}
              </Stack.Screen>

              <Stack.Screen name="WebSettings">
                {() => (
                  <WebLayout role={role} tenantId={tenantId}>
                    <WebSettings />
                  </WebLayout>
                )}
              </Stack.Screen>

              {/* Riwayat absensi per kasir (dari modal detail) */}
              <Stack.Screen name="AttendanceHistory">
                {() => (
                  <WebLayout role={role} tenantId={tenantId}>
                    <AttendanceHistoryScreen />
                  </WebLayout>
                )}
              </Stack.Screen>

              {/* Manajemen absensi semua kasir — menu sidebar */}
              <Stack.Screen name="WebAttendanceManagement">
                {() => (
                  <WebLayout role={role} tenantId={tenantId}>
                    <AttendanceManagementWeb />
                  </WebLayout>
                )}
              </Stack.Screen>
            </>
          )}

          {/* ── MOBILE ROUTES ──────────────────────────────── */}
          {Platform.OS !== 'web' && (
            <>
              {role === 'superadmin' || role === 'admin' ? (
                <Stack.Screen name="AdminMobileNavigator" component={AdminMobileNavigator} />
              ) : (
                <Stack.Screen name="CashierMobileNavigator" component={CashierMobileNavigator} />
              )}
              <Stack.Screen name="Cashier" component={CashierScreen} />
              {/* Riwayat absensi — bisa diakses kasir & admin mobile */}
              <Stack.Screen
                name="AttendanceHistory"
                component={AttendanceHistoryScreen}
                options={{ animation: 'slide_from_right' }}
              />
            </>
          )}
        </>
      )}

      {/* ── ROUTE PUBLIK — tidak perlu login ── */}
      <Stack.Screen
        name="MemberPublic"
        component={MemberPublicScreen}
        options={{ animation: 'none', headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loading:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  placeholder:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  placeholderText: { fontSize: 18, color: COLORS.textLight, fontWeight: '600' },
});

export default AppNavigator;