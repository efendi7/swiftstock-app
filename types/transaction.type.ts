import { Timestamp } from 'firebase/firestore';

export type FilterMode = 'all' | 'specificMonth' | 'today';
export type SortType = 'latest' | 'oldest';

export interface Transaction {
  id: string;
  transactionNumber?: string;
  cashierId: string;
  cashierName?: string;
  cashierEmail?: string;
  total: number;
  
  // ✅ TAMBAHKAN DUA PROPERTI INI
  cashAmount?: number;   // Jumlah uang tunai yang diterima dari pelanggan
  changeAmount?: number; // Jumlah uang kembalian yang diberikan
  
  date?: Timestamp; 
  createdAt: Timestamp; 
  items: TransactionItem[];
}

export interface TransactionItem {
  productId: string;
  productName?: string;
  qty: number;
  price: number;
  subtotal: number;
}