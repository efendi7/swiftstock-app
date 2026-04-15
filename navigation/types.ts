import { NavigatorScreenParams } from '@react-navigation/native';

export type UserRole = 'superadmin' | 'admin' | 'cashier';

export type RootStackParamList = {
  // ── PUBLIC ──────────────────────────────────────────
  LandingPage:  undefined;
  Onboarding:   undefined;
  Login:        undefined;
  Register:     undefined;
  MemberPublic: { tenantId: string; memberId: string };

  // ── WEB ─────────────────────────────────────────────
  Dashboard:            undefined;
  WebProducts:          undefined;
  WebTransactions:      undefined;
  WebCashierManagement: undefined;
  WebMemberManagement:  undefined;
  WebSubscription:      undefined;
  WebSettings:          undefined;
  WebAttendanceManagement: undefined;

  // ── MOBILE ──────────────────────────────────────────
  AdminMobileNavigator:   NavigatorScreenParams<AdminTabParamList>;
  CashierMobileNavigator: NavigatorScreenParams<CashierTabParamList>;
  Cashier:                undefined;
  ProductDetail:          { productId: string };

  // ── ATTENDANCE ──────────────────────────────────────
  // cashierId & cashierName opsional:
  //   - kasir tidak perlu kirim params (pakai uid sendiri)
  //   - admin kirim params untuk lihat riwayat kasir tertentu
  AttendanceHistory: { cashierId: string; cashierName: string } | undefined;
};

export type AdminTabParamList = {
  AdminDashboard:    undefined;
  Product:           undefined;
  Transaction:       undefined;
  Profile:           undefined;
  CreateCashier:     undefined;
  CashierManagement: undefined;
  Settings:          undefined;
  Subscription:      undefined;
};

export type CashierTabParamList = {
  // ── Tampil di nav bar: Absensi · Produk · [FAB Scan] · Transaksi · Profil ──
  Attendance:       undefined;  // kiri-1
  Product:          undefined;  // kiri-2
  Transaction:      undefined;  // kanan-1
  Profile:          undefined;  // kanan-2
  // ── Hidden — diakses via FAB Scan ──
  CashierDashboard: undefined;
};