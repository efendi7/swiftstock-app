import { Timestamp } from 'firebase/firestore';

export type LogoShape    = 'square' | 'portrait' | 'landscape';
export type LogoPosition = 'left' | 'right' | 'top' | 'bottom';
export type LogoAlign    = 'flex-start' | 'center' | 'flex-end';

export interface StoreProfile {
  storeName:    string;
  ownerName:    string;
  address:      string;
  phone:        string;
  email:        string;
  logoUrl:      string;
  city:         string;
  postalCode:   string;
  // Logo kustomisasi sidebar
  logoShape:    LogoShape;
  logoPosition: LogoPosition;
  logoAlign:    LogoAlign;   // rata kiri / tengah / kanan
  // Target omzet per preset (0 = belum diset)
  targets?: {
    today: number;
    week:  number;
    month: number;
    year:  number;
  };
  updatedAt?:   Timestamp;
}

export interface TierSetting {
  name:     string;
  minPoin:  number;
  discount: number;
  color:    string;
}

export type MembershipModel  = 'opt-in' | 'auto-capture' | 'hybrid' | 'conditional';
export type ConditionalLogic = 'AND' | 'OR';

export type RedeemCooldownPeriod = 'none' | 'daily' | 'weekly' | 'monthly';

export interface MemberSettings {
  membershipModel:      MembershipModel;
  autoUpgradeThreshold: number;
  conditionalLogic:     ConditionalLogic;
  minVisits:            number;
  minTotalSpend:        number;
  conditionalFee:        number;
  conditionalFeeEnabled: boolean;
  pointsPerRupiah:      number;
  redeemRate:           number;
  minRedeem:            number;
  // Redeem restrictions
  minRedeemPoin:        number;               // 0 = tidak ada minimum
  redeemCooldown:       RedeemCooldownPeriod; // 'none' | 'daily' | 'weekly' | 'monthly'
  useCustomTiers:       boolean;
  customTiers?:         TierSetting[];
  updatedAt?:           Timestamp;
}

export interface PrinterSettings {
  receiptHeader:  string;
  receiptFooter:  string;
  showLogo:       boolean;
  showAddress:    boolean;
  showPhone:      boolean;
  paperSize:      '58mm' | '80mm';
  printCopies:    number;
  updatedAt?:     Timestamp;
}

export interface NotificationSettings {
  lowStockAlert:      boolean;
  lowStockThreshold:  number;
  dailyReportEnabled: boolean;
  dailyReportTime:    string;
  updatedAt?:         Timestamp;
}