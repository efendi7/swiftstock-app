import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  AdminTabs: NavigatorScreenParams<AdminTabParamList>; // Links the Tab types
  CashierTabs: NavigatorScreenParams<CashierTabParamList>; // Links the Tab types
  Cashier: undefined;     
};

export type AdminTabParamList = {
  AdminDashboard: undefined;
  Product: undefined;
  Transaction: undefined;
  Profile: undefined;
};

export type CashierTabParamList = {
  CashierDashboard: undefined;
  Product: undefined;
  Transaction: undefined;
  Profile: undefined;
};