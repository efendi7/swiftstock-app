import { Timestamp } from 'firebase/firestore';

export interface MemberCardDesign {
  // Background
  backgroundType:   'color' | 'gradient' | 'image';
  backgroundColor:  string;         // hex, default COLORS.primary
  gradientColors?:  [string, string];
  backgroundImageUrl?: string;      // Cloudinary URL

  // Teks
  textColor:        'light' | 'dark';

  // Elemen yang ditampilkan
  showLogo:         boolean;
  showTier:         boolean;
  showPoints:       boolean;
  showPhone:        boolean;
  showExpiry:       boolean;

  // Pendaftaran
  registrationFee:  number;   // 0 = gratis
  expiryMonths:     number;   // 0 = seumur hidup

  updatedAt?:       Timestamp;
}

export const DEFAULT_CARD_DESIGN: MemberCardDesign = {
  backgroundType:   'color',
  backgroundColor:  '#1C3A5A',
  textColor:        'light',
  showLogo:         true,
  showTier:         true,
  showPoints:       true,
  showPhone:        true,
  showExpiry:       false,
  registrationFee:  0,
  expiryMonths:     0,
};