import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';

import { auth } from '../services/firebaseConfig';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import CashierDashboard from '../screens/Main/CashierDashboard';
import CashierScreen from '../screens/Main/CashierScreen';

import AdminTabsLayout from './AdminTabsLayout'; // ← Import AdminTabsLayout
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'kasir' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : role === 'admin' ? (
          <Stack.Screen name="AdminTabs" component={AdminTabsLayout} />
        ) : (
          <>
            <Stack.Screen name="CashierDashboard" component={CashierDashboard} />
            <Stack.Screen name="Cashier" component={CashierScreen} />
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
  },
});

export default AppNavigator;