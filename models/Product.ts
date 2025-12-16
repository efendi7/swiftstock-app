// src/models/Product.ts

/**
 * Interface untuk merepresentasikan data Produk di Firestore.
 * * Sesuai dengan entitas PRODUCT pada ERD.
 */
export interface Product {
    /** ID Dokumen di Firestore (biasanya sama dengan product_id jika disimpan) */
    id: string; 
    /** Nama Produk (String) */
    name: string; 
    /** Kode Barcode (String, harus unik) */
    barcode: string;
    /** Harga Jual (Double/Number) */
    price: number; 
    /** Stok tersedia (Integer) */
    stock: number;
    /** Timestamp dibuat/diupdate (Opsional) */
    createdAt?: Date; 
    updatedAt?: Date;
}