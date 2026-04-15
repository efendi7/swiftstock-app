import { Timestamp } from 'firebase/firestore';
import { TransactionMember } from './member.types';

export type FilterMode = 'all' | 'specificMonth' | 'today';
export type SortType   = 'latest' | 'oldest';

export interface Transaction {
  id:                string;
  transactionNumber: string;
  cashierId:         string;
  cashierName:       string;
  cashierEmail?:     string;
  total:             number;
  cashAmount:        number;   // alias cashPaid
  cashPaid?:         number;   // field lama di Firestore
  changeAmount:      number;
  paymentMethod:     'cash' | 'qris';
  date:              Timestamp;
  createdAt:         Timestamp;
  items:             TransactionItem[];
  tenantId?:         string;

  // ✅ Member (opsional — transaksi walk-in tidak punya ini)
  member?:           TransactionMember;
}

export interface TransactionItem {
  productId:   string;
  productName: string;
  qty:         number;
  price:       number;
  subtotal:    number;
}