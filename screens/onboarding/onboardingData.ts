import { ImageSourcePropType } from 'react-native';

export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
}

export const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Sistem Kasir Privat',
    description: 'Selamat datang di SwiftStock. Pantau stok dan transaksi dalam satu genggaman.',
    image: require('../../assets/images/dashboard/sad.png'),
  },
  {
    id: '2',
    title: 'Manajemen Inventaris',
    description: 'Kelola produk, stok, dan harga dengan sistem terenkripsi.',
    image: require('../../assets/images/dashboard/netral.png'),
  },
  {
    id: '3',
    title: 'Scan Produk untuk Checkout',
    description: 'Pindai produk dan proses checkout dengan cepat.',
    image: require('../../assets/images/dashboard/good.png'),
  },
  {
    id: '4',
    title: 'Laporan Real-Time',
    description: 'Analisis penjualan lengkap dengan grafik dan peringatan stok kritis.',
    image: require('../../assets/images/dashboard/good.png'),
  },
];