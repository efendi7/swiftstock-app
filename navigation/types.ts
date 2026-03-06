import { NavigatorScreenParams } from '@react-navigation/native';

export type UserRole = 'superadmin' | 'admin' | 'cashier';

export type RootStackParamList = {
  // ==================== PUBLIC ROUTES ====================
  LandingPage: undefined;
  Onboarding: undefined; 
  Login: undefined;
  Register: undefined;
  
  // ==================== WEB ROUTES ====================
  Dashboard: undefined;
  WebProducts: undefined;          // ✅ NEW
  WebTransactions: undefined;      // ✅ NEW
  WebCashierManagement: undefined; // ✅ NEW
  WebSubscription: undefined;      // ✅ NEW
  WebSettings: undefined;          // ✅ NEW
  
  // ==================== MOBILE ROUTES ====================
  AdminMobileNavigator: NavigatorScreenParams<AdminTabParamList>; 
  CashierMobileNavigator: NavigatorScreenParams<CashierTabParamList>; 
  
  Cashier: undefined;    
  ProductDetail: { productId: string };
};

export type AdminTabParamList = {
  AdminDashboard: undefined;
  Product: undefined;
  Transaction: undefined;
  Profile: undefined;
  CreateCashier: undefined;  
  CashierManagement: undefined;
  Settings: undefined;
  Subscription: undefined;
};

export type CashierTabParamList = {
  CashierDashboard: undefined;
  Product: undefined;
  Transaction: undefined;
  Profile: undefined;
};