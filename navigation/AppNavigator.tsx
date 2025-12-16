// navigation/AppNavigator.tsx

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // ✅ BENAR
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import AdminDashboard from '../screens/Main/AdminDashboard';
import CashierDashboard from '../screens/Main/CashierDashboard';

import CashierScreen from '../screens/Main/CashierScreen';
import ProductScreen from '../screens/Main/ProductScreen';
import TransactionScreen from '../screens/Main/TransactionScreen';

// Firebase
import { auth } from '../services/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

// Definisikan tipe param list secara global (buat file terpisah lebih baik, tapi bisa di sini dulu)
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  AdminDashboard: undefined;
  CashierDashboard: undefined;
  Cashier: undefined;
  Product: undefined;
  Transaction: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Helper ambil role
const getUserRole = async (user: User): Promise<string> => {
  try {
    const token = await user.getIdTokenResult();
    return (token.claims.role as string) || 'kasir';
  } catch (error) {
    console.error('Gagal ambil role:', error);
    return 'kasir';
  }
};

const AppNavigator = () => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'kasir' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRole = await getUserRole(currentUser);
        setRole(userRole as 'admin' | 'kasir');
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#007bff' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {user ? (
          <>
            {/* Initial route berdasarkan role */}
            {role === 'admin' ? (
              <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboard}
                options={{ title: 'Dashboard Admin', headerLeft: () => null }}
              />
            ) : (
              <Stack.Screen
                name="CashierDashboard"
                component={CashierDashboard}
                options={{ title: 'Dashboard Kasir', headerLeft: () => null }}
              />
            )}

            {/* Screen lain yang bisa diakses */}
            <Stack.Screen name="Cashier" component={CashierScreen} options={{ title: 'Kasir' }} />
            <Stack.Screen name="Product" component={ProductScreen} options={{ title: 'Produk' }} />
            <Stack.Screen name="Transaction" component={TransactionScreen} options={{ title: 'Transaksi' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Daftar Akun' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default AppNavigator;