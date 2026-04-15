import React, { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native'; 
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';

import AppNavigator from '@navigation/AppNavigator';
import { COLORS } from '@constants/colors';

import {
  Montserrat_300Light, Montserrat_400Regular, Montserrat_500Medium,
  Montserrat_600SemiBold, Montserrat_700Bold, Montserrat_800ExtraBold, Montserrat_900Black,
} from '@expo-google-fonts/montserrat';
import {
  Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold,
} from '@expo-google-fonts/poppins';

SplashScreen.preventAutoHideAsync();

const linking = {
  prefixes: [
    'http://localhost:8081',
    'https://swiftstock.web.app',
    'https://swiftstock.com',
    'swiftstock://',
  ],
  config: {
    screens: {
      // ── PUBLIK — tidak perlu login ──────────────────
      MemberPublic: 'member/:tenantId/:memberId',

      // ── AUTH ────────────────────────────────────────
      LandingPage: '',
      Login:       'login',
      Register:    'register',
      Onboarding:  'onboarding',

      // ── WEB ADMIN ───────────────────────────────────
      Dashboard:            'dashboard',
      WebProducts:          'products',
      WebTransactions:      'transactions',
      WebCashierManagement: 'cashiers',
      WebMemberManagement:  'members',
      WebSettings:          'settings',
      WebSubscription:      'subscription',

      // ── MOBILE ──────────────────────────────────────
      AdminMobileNavigator:   'app',
      CashierMobileNavigator: 'pos',
      Cashier:                'cashier',
    },
  },
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    MontserratLight:     Montserrat_300Light,
    MontserratRegular:   Montserrat_400Regular,
    MontserratMedium:    Montserrat_500Medium,
    MontserratSemiBold:  Montserrat_600SemiBold,
    MontserratBold:      Montserrat_700Bold,
    MontserratExtraBold: Montserrat_800ExtraBold,
    MontserratBlack:     Montserrat_900Black,
    PoppinsRegular:      Poppins_400Regular,
    PoppinsMedium:       Poppins_500Medium,
    PoppinsSemiBold:     Poppins_600SemiBold,
    PoppinsBold:         Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={COLORS.primary} 
        translucent={Platform.OS === 'android'}
      />
      <NavigationContainer linking={linking}>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}