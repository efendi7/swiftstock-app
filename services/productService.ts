import { 
  collection, query, where, getDocs, serverTimestamp,
  writeBatch, doc, setDoc, increment, getDoc,
  orderBy, limit, startAfter,
  QueryDocumentSnapshot, DocumentData, getCountFromServer,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import { ProductFormData, ProductValidationResult } from '../types/product.types';

const CLOUD_NAME   = 'dlkrdbabo';
const UPLOAD_PRESET = 'expo_products';

export interface PaginatedProducts {
  products:   any[];
  totalCount: number;
  lastDoc:    QueryDocumentSnapshot<DocumentData> | null;
  hasMore:    boolean;
}

export class ProductService {

  private static async logActivity(
    batch: any, tenantId: string,
    type: 'IN' | 'OUT' | 'UPDATE' | 'TAMBAH', message: string
  ) {
    const activityRef = doc(collection(db, 'tenants', tenantId, 'activities'));
    const user = auth.currentUser;
    batch.set(activityRef, {
      type, message,
      userName: user?.displayName || user?.email?.split('@')[0] || 'Admin',
      userId:   user?.uid,
      createdAt: serverTimestamp(),
    });
  }

  // ─────────────────────────────────────────────────────────
  // STOCK PURCHASES — catat otomatis saat tambah/update stok
  // ─────────────────────────────────────────────────────────
  private static recordStockPurchase(
    batch: any,
    tenantId: string,
    data: {
      productId:     string;
      productName:   string;
      quantity:      number;
      purchasePrice: number;
      isNewProduct?: boolean;
    }
  ) {
    if (data.quantity <= 0) return; // tidak catat jika stok tidak bertambah
    const user = auth.currentUser;
    const ref  = doc(collection(db, 'tenants', tenantId, 'stock_purchases'));
    batch.set(ref, {
      productId:     data.productId,
      productName:   data.productName,
      quantity:      data.quantity,
      purchasePrice: data.purchasePrice,
      totalCost:     data.quantity * data.purchasePrice,
      isNewProduct:  data.isNewProduct ?? false,
      addedBy:       user?.displayName || user?.email?.split('@')[0] || 'Admin',
      date:          serverTimestamp(), // ✅ FIX: pakai serverTimestamp agar konsisten dengan query
      createdAt:     serverTimestamp(),
    });
  }

  // ── PAGINATION ────────────────────────────────────────────

  static async getProductsFirstPage(
    tenantId: string, pageSize = 20
  ): Promise<PaginatedProducts> {
    try {
      const col      = collection(db, 'tenants', tenantId, 'products');
      const countSnap = await getCountFromServer(col);
      const q        = query(col, orderBy('createdAt', 'desc'), limit(pageSize));
      const snap     = await getDocs(q);
      return {
        products:   snap.docs.map(d => ({ ...d.data(), id: d.id, soldCount: d.data().soldCount || 0 })),
        totalCount: countSnap.data().count,
        lastDoc:    snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
        hasMore:    snap.docs.length === pageSize,
      };
    } catch (error: any) {
      throw new Error('Gagal memuat produk: ' + error.message);
    }
  }

  static async getProductsNextPage(
    tenantId: string, lastDoc: QueryDocumentSnapshot<DocumentData>, pageSize = 20
  ): Promise<PaginatedProducts> {
    try {
      const col       = collection(db, 'tenants', tenantId, 'products');
      const countSnap = await getCountFromServer(col);
      const q         = query(col, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
      const snap      = await getDocs(q);
      const newLast   = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      return {
        products:   snap.docs.map(d => ({ ...d.data(), id: d.id, soldCount: d.data().soldCount || 0 })),
        totalCount: countSnap.data().count,
        lastDoc:    newLast,
        hasMore:    snap.docs.length === pageSize,
      };
    } catch (error: any) {
      throw new Error('Gagal memuat halaman berikutnya: ' + error.message);
    }
  }

  // ── CATEGORIES ────────────────────────────────────────────

  static async addCategory(tenantId: string, name: string): Promise<void> {
    const categoryName = name.trim();
    if (!categoryName) throw new Error('Nama kategori tidak boleh kosong');
    const categoryCol = collection(db, 'tenants', tenantId, 'categories');
    const snap = await getDocs(query(categoryCol, where('name', '==', categoryName)));
    if (!snap.empty) throw new Error('Kategori ini sudah ada');
    await setDoc(doc(categoryCol), { name: categoryName, createdAt: serverTimestamp() });
  }

  static async getCategories(tenantId: string): Promise<{ label: string; value: string }[]> {
    try {
      const snap = await getDocs(query(collection(db, 'tenants', tenantId, 'categories')));
      return snap.docs.map(d => ({ label: d.data().name, value: d.data().name }));
    } catch { return []; }
  }

  // ── ADD PRODUCT ───────────────────────────────────────────

  static async addProduct(tenantId: string, data: ProductFormData): Promise<string> {
    const validation = this.validateProduct(data);
    if (!validation.isValid) throw new Error(validation.error);

    const productCol = collection(db, 'tenants', tenantId, 'products');
    const dupSnap    = await getDocs(query(productCol, where('barcode', '==', data.barcode.trim())));
    if (!dupSnap.empty) throw new Error('Barcode sudah terdaftar di toko Anda.');

    try {
      const batch       = writeBatch(db);
      const productRef  = doc(productCol);
      const metadataRef = doc(db, 'tenants', tenantId, 'metadata', 'dashboard');
      const stockQty    = parseInt(data.stock);
      const purchasePrice = parseFloat(data.purchasePrice);

      batch.set(productRef, {
        ...data,
        name:          data.name.trim(),
        price:         parseFloat(data.price),
        purchasePrice,
        stock:         stockQty,
        soldCount:     0,
        barcodeType:   data.barcode.length === 13 ? 'EAN13' : 'CODE128',
        createdAt:     serverTimestamp(),
        updatedAt:     serverTimestamp(),
      });

      // ✅ Catat ke stock_purchases sebagai produk baru
      this.recordStockPurchase(batch, tenantId, {
        productId:     productRef.id,
        productName:   data.name.trim(),
        quantity:      stockQty,
        purchasePrice,
        isNewProduct:  true,
      });

      const metaSnap = await getDoc(metadataRef);
      if (!metaSnap.exists()) {
        batch.set(metadataRef, { totalProducts: 1, lastUpdated: serverTimestamp() });
      } else {
        batch.update(metadataRef, { totalProducts: increment(1), lastUpdated: serverTimestamp() });
      }

      this.logActivity(batch, tenantId, 'TAMBAH', `Produk baru "${data.name.trim()}" stok: ${stockQty}`);
      await batch.commit();
      return productRef.id;

    } catch (error: any) {
      throw new Error('Gagal: ' + error.message);
    }
  }

  // ── UPDATE PRODUCT ────────────────────────────────────────

  static async updateProduct(
    tenantId: string, productId: string,
    data: ProductFormData, oldData: any
  ): Promise<void> {
    try {
      const batch      = writeBatch(db);
      const productRef = doc(db, 'tenants', tenantId, 'products', productId);
      const newStock   = parseInt(data.stock) || 0;
      const purchasePrice = parseFloat(data.purchasePrice);
      const changes: string[] = [];

      if (oldData.name  !== data.name)              changes.push(`nama: ${oldData.name} → ${data.name}`);
      if (oldData.price !== parseFloat(data.price)) changes.push(`harga: ${oldData.price} → ${data.price}`);
      if (changes.length > 0) {
        this.logActivity(batch, tenantId, 'UPDATE', `Update "${oldData.name}": ${changes.join(', ')}`);
      }

      if (newStock !== oldData.stock) {
        const diff = newStock - oldData.stock;
        this.logActivity(
          batch, tenantId,
          diff > 0 ? 'IN' : 'OUT',
          `Stok "${data.name}" ${diff > 0 ? 'masuk' : 'keluar'} ${Math.abs(diff)} unit`
        );

        // ✅ Catat ke stock_purchases hanya jika stok BERTAMBAH
        if (diff > 0) {
          this.recordStockPurchase(batch, tenantId, {
            productId,
            productName:   data.name.trim(),
            quantity:      diff,
            purchasePrice,
            isNewProduct:  false,
          });
        }
      }

      batch.update(productRef, {
        ...data,
        price:         parseFloat(data.price),
        purchasePrice,
        stock:         newStock,
        updatedAt:     serverTimestamp(),
      });

      await batch.commit();
    } catch (error: any) {
      throw new Error('Gagal update: ' + error.message);
    }
  }

  // ── UTILITIES ─────────────────────────────────────────────

  static validateProduct(data: ProductFormData): ProductValidationResult {
    const { name, price, purchasePrice, stock, barcode } = data;
    if (!name || !price || !purchasePrice || !stock || !barcode)
      return { isValid: false, error: 'Silakan isi semua data wajib.' };
    return { isValid: true };
  }

  static generateUniqueBarcode(type: 'EAN13' | 'CODE128'): string {
    if (type === 'EAN13') {
      const prefix       = '899';
      const randomDigits = Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, '0');
      const base         = prefix + randomDigits;
      let sum = 0;
      for (let i = 0; i < 12; i++) sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
      return base + ((10 - (sum % 10)) % 10).toString();
    }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 15 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  static async uploadImage(localUri: string): Promise<string> {
    const data = new FormData();
    data.append('file', { uri: localUri, type: 'image/jpeg', name: 'product.jpg' } as any);
    data.append('upload_preset', UPLOAD_PRESET);
    data.append('cloud_name', CLOUD_NAME);
    const res    = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, { method: 'POST', body: data });
    const result = await res.json();
    return result.secure_url;
  }
}