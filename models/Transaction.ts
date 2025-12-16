// src/models/Transaction.ts (Bagian 1/2)

/**
 * Interface untuk merepresentasikan item produk dalam satu transaksi.
 * (Mirip dengan entitas TRANSACTION_ITEM pada ERD)
 */
export interface TransactionItem {
    /** ID Produk yang dibeli */
    productId: string;
    /** Nama produk saat transaksi terjadi (untuk keperluan laporan) */
    productName: string; 
    /** Kuantitas yang dibeli */
    qty: number;
    /** Harga jual produk saat transaksi dilakukan (untuk menghindari perubahan harga historis) */
    price: number; 
}

// src/models/Transaction.ts (Bagian 2/2)

/**
 * Interface untuk merepresentasikan data utama Transaksi.
 * (Sesuai dengan entitas TRANSACTION pada ERD)
 */
export interface Transaction {
    /** ID Dokumen di Firestore */
    id: string;
    /** ID Kasir yang melakukan transaksi (dari USER) */
    cashierId: string;
    /** Total harga transaksi */
    total: number;
    /** Tanggal dan waktu transaksi */
    date: Date; // Di Firestore akan disimpan sebagai Timestamp
    /** Daftar item yang dibeli dalam transaksi ini (Relasi 1:N) */
    items: TransactionItem[];
}