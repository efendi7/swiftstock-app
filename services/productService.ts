import { 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  writeBatch, 
  doc 
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { ProductFormData, ProductValidationResult } from '../models/Product';

const CLOUD_NAME = 'dlkrdbabo'; 
const UPLOAD_PRESET = 'expo_products'; 

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
   * Validasi data produk
   */
  static validateProduct(data: ProductFormData): ProductValidationResult {
    const { name, price, purchasePrice, stock, barcode } = data;

    if (!name || !price || !purchasePrice || !stock || !barcode) {
      return { isValid: false, error: 'Silakan isi semua data produk wajib.' };
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
   * Upload ke Cloudinary
   */
  static async uploadImage(uri: string): Promise<string> {
    try {
      const formData = new FormData();
      const uriParts = uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('file', {
        uri: uri,
        name: `product_${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      } as any);
      
      formData.append('upload_preset', UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Upload gagal');

      return result.secure_url.replace('/upload/', '/upload/w_600,q_auto,f_auto/');
    } catch (error) {
      console.error("Cloudinary Error:", error);
      throw new Error("Gagal mengunggah gambar ke server.");
    }
  }

  static async checkBarcodeExists(barcode: string): Promise<boolean> {
    const q = query(collection(db, 'products'), where('barcode', '==', barcode.trim()));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  /**
   * Add Product (Menerima 1 argumen ProductFormData yang sudah berisi imageUrl)
   */
  static async addProduct(data: ProductFormData): Promise<void> {
    // 1. Validasi Internal
    const validation = this.validateProduct(data);
    if (!validation.isValid) throw new Error(validation.error);

    // 2. Cek Duplikat
    const isDuplicate = await this.checkBarcodeExists(data.barcode);
    if (isDuplicate) throw new Error('Barcode ini sudah terdaftar.');

    try {
      const batch = writeBatch(db);
      const productRef = doc(collection(db, 'products'));
      
      const productData = {
        name: data.name.trim(),
        price: parseFloat(data.price),
        purchasePrice: parseFloat(data.purchasePrice),
        supplier: data.supplier?.trim() || 'Umum',
        category: data.category?.trim() || 'Tanpa Kategori',
        stock: parseInt(data.stock),
        barcode: data.barcode.trim(),
        imageUrl: data.imageUrl, 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      batch.set(productRef, productData);

      const stockPurchaseRef = doc(collection(db, 'stock_purchases'));
      batch.set(stockPurchaseRef, {
        productId: productRef.id,
        productName: data.name.trim(),
        barcode: data.barcode.trim(),
        quantity: parseInt(data.stock),
        purchasePrice: parseFloat(data.purchasePrice),
        totalCost: parseInt(data.stock) * parseFloat(data.purchasePrice),
        supplier: data.supplier?.trim() || 'Umum',
        date: serverTimestamp(),
        type: 'initial_stock',
      });

      await batch.commit();
    } catch (error) {
      console.error("Firestore Error:", error);
      throw new Error('Gagal menyimpan ke database');
    }
  }
}