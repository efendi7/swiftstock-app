# 📦 SwiftStock Admin & POS System
**Smart Inventory Management & Real-time Transaction Analytics**

SwiftStock adalah solusi kasir (Point of Sale) dan manajemen stok terintegrasi yang dibangun menggunakan **React Native Expo** dan **TypeScript**. Aplikasi ini memadukan kecepatan Firebase Firestore untuk data real-time dan efisiensi Cloudinary untuk pengelolaan aset gambar produk.

---

## 🚀 Fitur Unggulan

### 1. POS (Point of Sale) Berbasis Kamera
- **Barcode Scanner:** Input produk cepat menggunakan kamera perangkat.
- **Smart Transaction:** Mendukung kalkulasi otomatis untuk pembayaran Tunai (Cash) dan QRIS.
- **Kembalian Otomatis:** Menghitung `changeAmount` secara real-time berdasarkan `cashAmount` yang diterima.

### 2. Manajemen Stok & Inventaris
- **Product Lifecycle:** CRUD lengkap (Create, Read, Update, Delete) produk dengan validasi `ProductValidationResult`.
- **Image Integration:** Upload gambar produk langsung ke **Cloudinary** menggunakan *Upload Preset* untuk kompresi otomatis.
- **Stock Alert:** Pelacakan stok rendah (`lowStockCount`) untuk mencegah kehabisan barang.

### 3. Analitik Dashboard (Business Intelligence)
- **Financial Tracking:** Visualisasi Pendapatan, Pengeluaran, dan Profit bersih.
- **Weekly Chart:** Grafik performa penjualan mingguan menggunakan `ChartDataPoint`.
- **Ranking System:** Menampilkan produk paling laris dan peringkat stok.

---

## 🛠 Arsitektur Teknologi

- **Frontend:** React Native (Expo) - TypeScript
- **Backend:** Firebase Firestore (NoSQL)
- **Image Hosting:** Cloudinary (Unsigned Upload Preset)
- **Styling:** NativeWind (Tailwind CSS)

---

## 🏗 Struktur Data (Type-Safe)

Aplikasi ini menggunakan TypeScript secara ketat untuk menjamin keamanan transaksi keuangan:

### 📄 Transaksi (`Transaction`)
Menyimpan riwayat detail termasuk ID Kasir, metode pembayaran, dan array item transaksi.
```typescript
export interface Transaction {
  id: string;
  total: number;
  paymentMethod?: 'cash' | 'qris'; 
  cashAmount?: number;
  changeAmount?: number;
  createdAt: Timestamp; // Data tersinkronisasi dengan server time Firebase
  items: TransactionItem[];
}