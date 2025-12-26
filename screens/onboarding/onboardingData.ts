import { ImageSourcePropType } from 'react-native';

export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: any;
}

export const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Sistem Kasir Privat',
    description: 'Selamat datang di panel manajemen toko. Pantau stok dan transaksi dalam satu genggaman.',
    image: require('../../assets/images/dashboard/sad.png'), // Menggunakan Icon Aplikasi Anda
  },
  {
    id: '2',
    title: 'Manajemen Inventaris',
    description: 'Kelola produk, update stok, dan atur harga dengan sistem yang aman dan terenkripsi.',
    image: require('../../assets/images/dashboard/netral.png'), // Pastikan file gambar ada
  },
  {
    id: '3',
    title: 'Laporan Real-Time',
    description: 'Dapatkan analisis penjualan harian untuk membantu pengambilan keputusan bisnis Anda.',
    image: require('../../assets/images/dashboard/good.png'),
  },
];