import { Timestamp } from 'firebase/firestore';

export type FilterMode = 'all' | 'specificMonth' | 'today';
export type SortType = 'latest' | 'oldest';

export interface Transaction {
  id: string;
  transactionNumber?: string;
  cashierId: string;
  cashierName?: string;
  cashierEmail?: string; // Untuk admin view
  total: number;
  
  // ✅ Properti untuk pencatatan uang tunai
  cashAmount?: number;   // Jumlah uang tunai yang diterima dari pelanggan
  changeAmount?: number; // Jumlah uang kembalian yang diberikan
  
  // ✅ TAMBAHKAN INI: Untuk membedakan warna & ikon di UI
  paymentMethod?: 'cash' | 'qris'; 
  
  date?: Timestamp;      // legacy field
  createdAt: Timestamp;  // Primary timestamp untuk filtering
  items: TransactionItem[];
}

export interface TransactionItem {
  productId: string;
  productName?: string;
  qty: number;
  price: number;
  subtotal: number;
}