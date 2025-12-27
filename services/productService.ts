import { 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  writeBatch, 
  doc, 
  setDoc,
  increment,
  getDoc
} from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import { ProductFormData, ProductValidationResult } from '../types/product.types';

const CLOUD_NAME = 'dlkrdbabo'; 
const UPLOAD_PRESET = 'expo_products'; 

export class ProductService {
  private static async logActivity(batch: any, type: 'MASUK' | 'KELUAR' | 'UPDATE' | 'TAMBAH', message: string) {
    const activityRef = doc(collection(db, 'activities'));
    const user = auth.currentUser;
    batch.set(activityRef, {
      type,
      message,
      userName: user?.displayName || user?.email?.split('@')[0] || 'Admin',
      createdAt: serverTimestamp(),
    });
  }

  // --- LOGIKA KATEGORI ---
  static async addCategory(name: string): Promise<void> {
    const categoryName = name.trim();
    if (!categoryName) throw new Error("Nama kategori tidak boleh kosong");

    const q = query(collection(db, 'categories'), where('name', '==', categoryName));
    const snap = await getDocs(q);
    if (!snap.empty) throw new Error("Kategori ini sudah ada");

    try {
      const categoryRef = doc(collection(db, 'categories'));
      await setDoc(categoryRef, {
        name: categoryName,
        createdAt: serverTimestamp()
      });
    } catch (error: any) {
      console.error('Error addCategory:', error);
      throw new Error("Gagal menambah kategori");
    }
  }

  static async getCategories(): Promise<{label: string, value: string}[]> {
    try {
      const q = query(collection(db, 'categories'));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({
        label: doc.data().name,
        value: doc.data().name
      }));
    } catch (error) {
      return [];
    }
  }

  // --- OPERASI PRODUK ---
  static async addProduct(data: ProductFormData): Promise<void> {
    const validation = this.validateProduct(data);
    if (!validation.isValid) throw new Error(validation.error);
    
    const q = query(collection(db, 'products'), where('barcode', '==', data.barcode.trim()));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) throw new Error('Barcode sudah terdaftar.');

    try {
      const batch = writeBatch(db);
      const productRef = doc(collection(db, 'products'));
      const metadataRef = doc(db, 'metadata', 'dashboard');
      const stockQty = parseInt(data.stock);
      const productName = data.name.trim();
      
      batch.set(productRef, {
        name: productName,
        price: parseFloat(data.price),
        purchasePrice: parseFloat(data.purchasePrice),
        supplier: data.supplier?.trim() || 'Umum',
        category: data.category?.trim() || 'Tanpa Kategori',
        stock: stockQty,
        soldCount: 0,
        barcode: data.barcode.trim(),
        barcodeType: data.barcode.length === 13 ? 'EAN13' : 'CODE128', 
        imageUrl: data.imageUrl || '', 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const metadataSnap = await getDoc(metadataRef);
      if (!metadataSnap.exists()) {
        batch.set(metadataRef, { totalProducts: 1, lastUpdated: serverTimestamp() });
      } else {
        batch.update(metadataRef, { totalProducts: increment(1), lastUpdated: serverTimestamp() });
      }

      this.logActivity(batch, 'TAMBAH', `Mendaftarkan produk baru "${productName}" dengan stok awal ${stockQty} unit`);
      await batch.commit();
    } catch (error: any) {
      throw new Error('Gagal menyimpan produk: ' + error.message);
    }
  }

  // HANYA SATU FUNGSI UPDATEPRODUCT
  static async updateProduct(
  productId: string,
  data: ProductFormData,
  oldData: {
    name: string;
    stock: number;
    price: number;
    purchasePrice: number;
    category: string;
    supplier: string;
  }
): Promise<void> {
  const validation = this.validateProduct(data);
  if (!validation.isValid) throw new Error(validation.error);

  try {
    const batch = writeBatch(db);
    const productRef = doc(db, 'products', productId);
    
    const newStock = parseInt(data.stock) || 0;
    const newName = data.name.trim();
    const newPrice = parseFloat(data.price);
    const newPurchasePrice = parseFloat(data.purchasePrice);
    const newCategory = data.category?.trim() || 'Tanpa Kategori';
    const newSupplier = data.supplier?.trim() || 'Umum';

    const changes: string[] = [];
    
    // DETEKSI PERUBAHAN FIELD RINCI
    if (oldData.name !== newName) {
      changes.push(`nama dari "${oldData.name}" menjadi "${newName}"`);
    }
    if (oldData.price !== newPrice) {
      changes.push(`harga jual dari Rp ${oldData.price.toLocaleString('id-ID')} menjadi Rp ${newPrice.toLocaleString('id-ID')}`);
    }
    if (oldData.purchasePrice !== newPurchasePrice) {
      changes.push(`harga beli dari Rp ${oldData.purchasePrice.toLocaleString('id-ID')} menjadi Rp ${newPurchasePrice.toLocaleString('id-ID')}`);
    }
    if (oldData.category !== newCategory) {
      changes.push(`kategori dari "${oldData.category}" menjadi "${newCategory}"`);
    }
    if (oldData.supplier !== newSupplier) {
      changes.push(`supplier dari "${oldData.supplier}" menjadi "${newSupplier}"`);
    }

    // 1. LOG UPDATE DATA (NAMA, HARGA, DLL)
    if (changes.length > 0) {
      // Gunakan oldData.name sebagai subjek agar admin tahu produk mana yang diedit
      this.logActivity(
        batch, 
        'UPDATE', 
        `Update data produk "${oldData.name}": ${changes.join(', ')}`
      );
    }

    // 2. LOG PERUBAHAN STOK (TERPISAH)
    if (newStock !== oldData.stock) {
      const diff = newStock - oldData.stock;
      this.logActivity(
        batch, 
        diff > 0 ? 'MASUK' : 'KELUAR', 
        `Stok "${newName}" ${diff > 0 ? 'ditambah' : 'dikurangi'} sebanyak ${Math.abs(diff)} unit (${oldData.stock} → ${newStock})`
      );
    }

    // Eksekusi update produk ke koleksi 'products'
    batch.update(productRef, {
      name: newName,
      price: newPrice,
      purchasePrice: newPurchasePrice,
      supplier: newSupplier,
      category: newCategory,
      stock: newStock,
      barcode: data.barcode.trim(),
      imageUrl: data.imageUrl || '',
      updatedAt: serverTimestamp()
    });
    
    await batch.commit();
  } catch (error: any) {
    throw new Error('Gagal update: ' + error.message);
  }
}

  // --- VALIDASI & HELPER ---
  static validateProduct(data: ProductFormData): ProductValidationResult {
    const { name, price, purchasePrice, stock, barcode } = data;
    if (!name || !price || !purchasePrice || !stock || !barcode) {
      return { isValid: false, error: 'Silakan isi semua data wajib.' };
    }
    if (parseFloat(price) < parseFloat(purchasePrice)) {
      return { isValid: false, error: 'Harga jual tidak boleh di bawah harga beli.' };
    }
    return { isValid: true };
  }

  static generateUniqueBarcode(type: 'EAN13' | 'CODE128'): string {
    if (type === 'EAN13') {
      const prefix = '899';
      const randomDigits = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
      const base = prefix + randomDigits;
      let sum = 0;
      for (let i = 0; i < 12; i++) sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
      const checksum = (10 - (sum % 10)) % 10;
      return base + checksum.toString();
    } else {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 15; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
      return result;
    }
  }

  static async uploadImage(localUri: string): Promise<string> {
    const data = new FormData();
    data.append('file', { uri: localUri, type: 'image/jpeg', name: 'product.jpg' } as any);
    data.append('upload_preset', UPLOAD_PRESET);
    data.append('cloud_name', CLOUD_NAME);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, { method: 'POST', body: data });
    const result = await response.json();
    return result.secure_url;
  }
}