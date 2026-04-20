export type StockHistoryType = 'IN' | 'OUT';

export interface StockHistoryItem {
  id?: string;
  productId: string;
  productName: string;
  type: StockHistoryType;
  beforeStock: number;
  afterStock: number;
  qtyChange: number;
  reason: string;
  reference?: string;
  date?: any; // Firestore Timestamp
  userId: string;
  userName: string;
}

export interface PaginatedStockHistory {
  data: StockHistoryItem[];
  totalCount: number;
  lastDoc: any | null;
  hasMore: boolean;
}
