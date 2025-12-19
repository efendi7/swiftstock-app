import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  writeBatch, 
  doc 
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Product, ProductFormData, ProductValidationResult } from '../models/Product';

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
   * Upload Gambar ke Firebase Storage
   */
  static async uploadImage(uri: string): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storage = getStorage();
      const fileRef = ref(storage, `products/${Date.now()}.jpg`);
      
      await uploadBytes(fileRef, blob);
      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error("Gagal mengunggah gambar");
    }
  }

  /**
   * Check if barcode already exists
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
   * Validasi data produk menggunakan model ProductFormData
   */
  static validateProduct(data: ProductFormData): ProductValidationResult {
    const { name, price, purchasePrice, stock, barcode } = data;

    if (!name || !price || !purchasePrice || !stock || !barcode) {
      return {
        isValid: false,
        error: 'Silakan isi semua data produk wajib.',
      };
    }

    const priceNum = parseFloat(price);
    const purchasePriceNum = parseFloat(purchasePrice);
    const stockNum = parseInt(stock);

    if (isNaN(priceNum) || isNaN(purchasePriceNum) || isNaN(stockNum)) {
      return { isValid: false, error: 'Harga dan stok harus berupa angka.' };
    }

    if (purchasePriceNum <= 0) return { isValid: false, error: 'Harga beli harus lebih dari 0.' };
    if (priceNum < purchasePriceNum) return { isValid: false, error: 'Harga jual tidak boleh lebih kecil dari harga beli.' };
    if (stockNum < 0) return { isValid: false, error: 'Stok tidak boleh negatif.' };

    return { isValid: true };
  }

  /**
   * Add new product menggunakan Model ProductFormData
   */
  static async addProduct(data: ProductFormData): Promise<void> {
    
    // 1. Validasi
    const validation = this.validateProduct(data);
    if (!validation.isValid) throw new Error(validation.error);

    // 2. Cek Barcode Duplikat
    const isDuplicate = await this.checkBarcodeExists(data.barcode);
    if (isDuplicate) throw new Error('Barcode ini sudah terdaftar.');

    try {
      const batch = writeBatch(db);

      // 3. Siapkan Dokumen Produk Baru
      const productRef = doc(collection(db, 'products'));
      
      // Menggunakan tipe data 'any' sementara untuk Firestore Timestamp, 
      // atau biarkan Firestore yang mengurusnya.
      const productData = {
        name: data.name.trim(),
        price: parseFloat(data.price),
        purchasePrice: parseFloat(data.purchasePrice),
        supplier: data.supplier?.trim() || 'Umum',
        category: data.category?.trim() || 'Tanpa Kategori',
        stock: parseInt(data.stock),
        barcode: data.barcode.trim(),
        imageUrl: data.imageUrl, // Diambil dari model
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      batch.set(productRef, productData);

      // 4. Catat Stok Awal (Stock Purchase)
      const stockPurchaseRef = doc(collection(db, 'stock_purchases'));
      const purchaseData = {
        productId: productRef.id,
        productName: data.name.trim(),
        barcode: data.barcode.trim(),
        quantity: parseInt(data.stock),
        purchasePrice: parseFloat(data.purchasePrice),
        totalCost: parseInt(data.stock) * parseFloat(data.purchasePrice),
        supplier: data.supplier?.trim() || 'Umum',
        date: serverTimestamp(),
        type: 'initial_stock',
      };
      
      batch.set(stockPurchaseRef, purchaseData);

      // 5. Jalankan Batch
      await batch.commit();
    } catch (error) {
      console.error('Error adding product:', error);
      throw new Error('Gagal menyimpan data ke database.');
    }
  }
}