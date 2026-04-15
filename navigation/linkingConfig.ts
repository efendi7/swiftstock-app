/**
 * linkingConfig.ts
 * Deep link & web URL mapping untuk React Navigation.
 * 
 * Development : http://localhost:8081/member/:tenantId/:memberId
 * Production  : https://swiftstock.web.app/member/:tenantId/:memberId
 * 
 * Cara pakai di App.tsx / NavigationContainer:
 * 
 *   import { linkingConfig } from '@navigation/linkingConfig';
 *   
 *   <NavigationContainer linking={linkingConfig}>
 *     <AppNavigator />
 *   </NavigationContainer>
 */

export const linkingConfig = {
  prefixes: [
    'https://swiftstock.web.app',
    'http://localhost:8081',
    'exp://localhost:8081',
    'swiftstock://',                // deep link mobile
  ],
  config: {
    screens: {
      // Halaman publik member — tidak perlu login
      MemberPublic: 'member/:tenantId/:memberId',

      // Auth screens
      LandingPage:  '',
      Login:        'login',
      Register:     'register',

      // Web admin screens
      Dashboard:              'dashboard',
      WebProducts:            'products',
      WebTransactions:        'transactions',
      WebCashierManagement:   'cashiers',
      WebMemberManagement:    'members',
      WebSettings:            'settings',
      WebSubscription:        'subscription',
    },
  },
};