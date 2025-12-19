// services/productService.ts
import { collection, addDoc, query, where, getDocs, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Product } from '../models/Product';

export interface ProductValidationResult {
  isValid: boolean;
  error?: string;
}

export class ProductService {
  /**
   * Generate unique barcode (15 digit)
   */
  static generateUniqueBarcode(): string {
    const timestamp = new Date().getTime().toString();
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    return (timestamp + random).substring(0, 15);
  }

  /**
   * Check if barcode already exists in Firestore
   */
  static async checkBarcodeExists(barcode: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'products'),
        where('barcode', '==', barcode.trim())
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking barcode:', error);
      throw new Error('Gagal memeriksa barcode');
    }
  }

  /**
   * Validate product data including Purchase Price and Supplier
   */
  static validateProduct(
    name: string,
    price: string,
    purchasePrice: string,
    stock: string,
    barcode: string
  ): ProductValidationResult {
    if (!name || !price || !purchasePrice || !stock || !barcode) {
      return {
        isValid: false,
        error: 'Silakan isi semua data produk wajib (Nama, Harga Jual, Harga Beli, Stok, dan Barcode).',
      };
    }

    const priceNum = parseFloat(price);
    const purchasePriceNum = parseFloat(purchasePrice);
    const stockNum = parseInt(stock);

    if (isNaN(priceNum) || isNaN(purchasePriceNum) || isNaN(stockNum)) {
      return {
        isValid: false,
        error: 'Harga jual, harga beli, dan stok harus berupa angka.',
      };
    }

    if (purchasePriceNum <= 0) {
      return { isValid: false, error: 'Harga beli harus lebih dari 0.' };
    }

    if (priceNum < purchasePriceNum) {
      return { 
        isValid: false, 
        error: 'Peringatan: Harga jual tidak boleh lebih kecil dari harga beli (rugi).' 
      };
    }

    if (stockNum < 0) {
      return { isValid: false, error: 'Stok tidak boleh negatif.' };
    }

    return { isValid: true };
  }

  /**
   * Add new product to database AND record the stock purchase
   */
  static async addProduct(
    name: string,
    price: string,
    purchasePrice: string,
    supplier: string,
    category: string,
    stock: string,
    barcode: string
  ): Promise<void> {
    
    const validation = this.validateProduct(name, price, purchasePrice, stock, barcode);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const isDuplicate = await this.checkBarcodeExists(barcode);
    if (isDuplicate) {
      throw new Error('Barcode ini sudah terdaftar untuk produk lain.');
    }

    try {
      const batch = writeBatch(db);

      // 1. Tambahkan produk ke collection 'products'
      const productRef = doc(collection(db, 'products'));
      const productData = {
        name: name.trim(),
        price: parseFloat(price),
        purchasePrice: parseFloat(purchasePrice),
        supplier: supplier.trim() || 'Umum',
        category: category.trim() || 'Tanpa Kategori',
        stock: parseInt(stock),
        barcode: barcode.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      batch.set(productRef, productData);

      // 2. 🔥 CATAT PEMBELIAN STOK ke collection 'stock_purchases'
      const stockPurchaseRef = doc(collection(db, 'stock_purchases'));
      const purchaseData = {
        productId: productRef.id,
        productName: name.trim(),
        barcode: barcode.trim(),
        quantity: parseInt(stock),
        purchasePrice: parseFloat(purchasePrice),
        totalCost: parseInt(stock) * parseFloat(purchasePrice), // Total modal
        supplier: supplier.trim() || 'Umum',
        date: serverTimestamp(),
        type: 'initial_stock', // Tipe: stok awal
      };
      batch.set(stockPurchaseRef, purchaseData);

      // Commit semua operasi sekaligus
      await batch.commit();

    } catch (error) {
      console.error('Error adding product:', error);
      throw new Error('Gagal menyimpan data ke database.');
    }
  }

  /**
   * 🆕 Record additional stock purchase (untuk restock)
   */
  static async recordStockPurchase(
    productId: string,
    productName: string,
    barcode: string,
    quantity: number,
    purchasePrice: number,
    supplier: string
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'stock_purchases'), {
        productId,
        productName,
        barcode,
        quantity,
        purchasePrice,
        totalCost: quantity * purchasePrice,
        supplier: supplier || 'Umum',
        date: serverTimestamp(),
        type: 'restock',
      });
    } catch (error) {
      console.error('Error recording stock purchase:', error);
      throw new Error('Gagal mencatat pembelian stok.');
    }
  }
}