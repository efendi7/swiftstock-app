import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import ini

import { auth } from '../services/firebaseConfig';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import CashierScreen from '../screens/Main/transaction/CashierScreen';
import { OnboardingScreen } from '../screens/onboarding'; // Import ini
import AdminTabsLayout from './AdminTabsLayout';
import CashierTabsLayout from './CashierTabsLayout';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'kasir' | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null); // State Onboarding

  useEffect(() => {
    // 1. Cek status Onboarding
    const checkOnboarding = async () => {
      const value = await AsyncStorage.getItem('@alreadyLaunched');
      setIsFirstLaunch(value === null); // true jika belum ada data
    };

    checkOnboarding();

    // 2. Cek status Firebase Auth
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const token = await currentUser.getIdTokenResult();
        setRole((token.claims.role as 'admin' | 'kasir') ?? 'kasir');
        setUser(currentUser);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  // Tampilkan Loading jika status onboarding atau auth belum siap
  if (loading || isFirstLaunch === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00A79D" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            {/* Tampilkan Onboarding HANYA jika isFirstLaunch = true */}
            {isFirstLaunch && (
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            )}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : role === 'admin' ? (
          <Stack.Screen name="AdminTabs" component={AdminTabsLayout} />
        ) : (
          <>
            <Stack.Screen name="CashierTabs" component={CashierTabsLayout} />
            <Stack.Screen name="Cashier" component={CashierScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default AppNavigator;