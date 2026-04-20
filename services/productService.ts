/**
 * productService.ts
 *
 * Semua operasi Firestore terkait produk:
 *   - Pagination produk (first / next page)
 *   - CRUD kategori
 *   - Tambah & update produk (atomic batch write)
 *   - Upload gambar ke Cloudinary (web + native)
 *   - Generate barcode EAN13 / CODE128
 *
 * Prinsip: SRP · DRY · typed (tidak ada `any` pada batch) · no side-effects tersembunyi
 */

import {
  collection, query, where, getDocs, serverTimestamp,
  writeBatch, doc, setDoc, increment, getDoc,
  orderBy, limit, startAfter, WriteBatch,
  QueryDocumentSnapshot, DocumentData, getCountFromServer,
  QuerySnapshot,
} from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import { ProductFormData, ProductValidationResult } from '../types/product.types';

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

const CLOUD_NAME    = 'dlkrdbabo';
const UPLOAD_PRESET = 'expo_products';

// ─────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────

export interface PaginatedProducts {
  products:   any[];
  totalCount: number;
  lastDoc:    QueryDocumentSnapshot<DocumentData> | null;
  hasMore:    boolean;
}

// ─────────────────────────────────────────────────────────
// Internal types
// ─────────────────────────────────────────────────────────

type ActivityType = 'IN' | 'OUT' | 'UPDATE' | 'TAMBAH';

interface StockPurchasePayload {
  productId:     string;
  productName:   string;
  quantity:      number;
  purchasePrice: number;
  isNewProduct?: boolean;
}

interface ParsedFormNumbers {
  price:         number;
  purchasePrice: number;
  stock:         number;
}

interface SanitizedStrings {
  name:     string;
  barcode:  string;
  supplier: string;
  category: string;
  imageUrl: string;
}

// ─────────────────────────────────────────────────────────
// Private helpers  (module-level — tidak perlu `this`, mudah di-test)
// ─────────────────────────────────────────────────────────

const getCurrentUserName = (): string => {
  const user = auth.currentUser;
  return user?.displayName || user?.email?.split('@')[0] || 'Admin';
};

const getCurrentUserId = (): string | undefined => auth.currentUser?.uid;

/**
 * Tambahkan aktivitas ke batch.
 * Selalu dipanggil sebelum batch.commit() agar atomic.
 */
const batchLogActivity = (
  batch: WriteBatch, tenantId: string,
  type: ActivityType, message: string,
): void => {
  const ref = doc(collection(db, 'tenants', tenantId, 'activities'));
  batch.set(ref, {
    type, message,
    userName:  getCurrentUserName(),
    userId:    getCurrentUserId(),
    createdAt: serverTimestamp(),
  });
};

/**
 * Tambahkan record pembelian stok ke batch.
 * Skip jika quantity <= 0.
 */
const batchRecordStockPurchase = (
  batch: WriteBatch, tenantId: string, payload: StockPurchasePayload,
): void => {
  if (payload.quantity <= 0) return;
  const ref = doc(collection(db, 'tenants', tenantId, 'stock_purchases'));
  batch.set(ref, {
    productId:     payload.productId,
    productName:   payload.productName,
    quantity:      payload.quantity,
    purchasePrice: payload.purchasePrice,
    totalCost:     payload.quantity * payload.purchasePrice,
    isNewProduct:  payload.isNewProduct ?? false,
    addedBy:       getCurrentUserName(),
    date:          serverTimestamp(),
    createdAt:     serverTimestamp(),
  });
};

/** Parse semua field angka dari ProductFormData sekaligus */
const parseFormNumbers = (data: ProductFormData): ParsedFormNumbers => ({
  price:         parseFloat(data.price)         || 0,
  purchasePrice: parseFloat(data.purchasePrice) || 0,
  stock:         parseInt(data.stock)           || 0,
});

/** Sanitasi string fields — tidak ada undefined yang lolos ke Firestore */
const sanitizeStringFields = (data: ProductFormData): SanitizedStrings => ({
  name:     data.name.trim(),
  barcode:  data.barcode.trim(),
  supplier: data.supplier  || '',
  category: data.category  || '',
  imageUrl: data.imageUrl  || '',
});

/** Bangun PaginatedProducts dari snapshot getDocs */
const buildPaginatedResult = (
  snap: QuerySnapshot<DocumentData>,
  totalCount: number,
  pageSize: number,
): PaginatedProducts => ({
  products:   snap.docs.map(d => ({ ...d.data(), id: d.id, soldCount: d.data().soldCount || 0 })),
  totalCount,
  lastDoc:    snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null,
  hasMore:    snap.docs.length === pageSize,
});

/** Bandingkan oldData vs newData, kembalikan array deskripsi perubahan */
const buildChangeLog = (oldData: any, newName: string, newPrice: number): string[] => {
  const changes: string[] = [];
  if (oldData.name  !== newName)  changes.push(`nama: "${oldData.name}" → "${newName}"`);
  if (oldData.price !== newPrice) changes.push(`harga: ${oldData.price} → ${newPrice}`);
  return changes;
};

/** Bangun FormData upload ke Cloudinary — support web (base64) dan native (expo URI) */
const buildImageFormData = (localUri: string): FormData => {
  const formData = new FormData();
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('cloud_name',    CLOUD_NAME);

  if (localUri.startsWith('data:')) {
    // Web: konversi base64 dataURL ke Blob
    const [meta, base64] = localUri.split(',');
    const mimeType       = meta.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bytes          = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    formData.append('file', new Blob([bytes], { type: mimeType }), 'product.jpg');
  } else {
    // Native (Expo): kirim sebagai object URI
    formData.append('file', { uri: localUri, type: 'image/jpeg', name: 'product.jpg' } as any);
  }

  return formData;
};

const generateEAN13 = (): string => {
  const base = '899' + Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, '0');
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
  return base + ((10 - (sum % 10)) % 10).toString();
};

const generateCODE128 = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 15 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// ─────────────────────────────────────────────────────────
// ProductService
// ─────────────────────────────────────────────────────────

export class ProductService {

  // ── Pagination ────────────────────────────────────────

  static async getProductsFirstPage(tenantId: string, pageSize = 20): Promise<PaginatedProducts> {
    try {
      const col = collection(db, 'tenants', tenantId, 'products');
      const [countSnap, snap] = await Promise.all([
        getCountFromServer(col),
        getDocs(query(col, orderBy('createdAt', 'desc'), limit(pageSize))),
      ]);
      return buildPaginatedResult(snap, countSnap.data().count, pageSize);
    } catch (e: any) {
      throw new Error('Gagal memuat produk: ' + e.message);
    }
  }

  static async getProductsNextPage(
    tenantId: string,
    lastDoc:  QueryDocumentSnapshot<DocumentData>,
    pageSize = 20,
  ): Promise<PaginatedProducts> {
    try {
      const col = collection(db, 'tenants', tenantId, 'products');
      const [countSnap, snap] = await Promise.all([
        getCountFromServer(col),
        getDocs(query(col, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize))),
      ]);
      return buildPaginatedResult(snap, countSnap.data().count, pageSize);
    } catch (e: any) {
      throw new Error('Gagal memuat halaman berikutnya: ' + e.message);
    }
  }

  // ── Kategori ──────────────────────────────────────────

  static async addCategory(tenantId: string, name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Nama kategori tidak boleh kosong');

    const col  = collection(db, 'tenants', tenantId, 'categories');
    const snap = await getDocs(query(col, where('name', '==', trimmed)));
    if (!snap.empty) throw new Error('Kategori ini sudah ada');

    await setDoc(doc(col), { name: trimmed, createdAt: serverTimestamp() });
  }

  static async getCategories(tenantId: string): Promise<{ label: string; value: string }[]> {
    try {
      const snap = await getDocs(collection(db, 'tenants', tenantId, 'categories'));
      return snap.docs.map(d => ({ label: d.data().name, value: d.data().name }));
    } catch {
      return [];
    }
  }

  // ── Tambah Produk ─────────────────────────────────────

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

      const nums    = parseFormNumbers(data);
      const strings = sanitizeStringFields(data);

      batch.set(productRef, {
        ...strings,
        ...nums,
        soldCount:   0,
        barcodeType: strings.barcode.length === 13 ? 'EAN13' : 'CODE128',
        createdAt:   serverTimestamp(),
        updatedAt:   serverTimestamp(),
      });

      batchRecordStockPurchase(batch, tenantId, {
        productId:    productRef.id,
        productName:  strings.name,
        quantity:     nums.stock,
        purchasePrice: nums.purchasePrice,
        isNewProduct: true,
      });

      const historyRef = doc(collection(db, 'tenants', tenantId, 'stock_history'));
      batch.set(historyRef, {
        productId: productRef.id,
        productName: strings.name,
        type: 'IN',
        beforeStock: 0,
        afterStock: nums.stock,
        qtyChange: nums.stock,
        reason: 'Penambahan Produk Baru',
        date: serverTimestamp(),
        userId: getCurrentUserId() || '',
        userName: getCurrentUserName(),
      });

      const metaSnap = await getDoc(metadataRef);
      if (metaSnap.exists()) {
        batch.update(metadataRef, { totalProducts: increment(1), lastUpdated: serverTimestamp() });
      } else {
        batch.set(metadataRef, { totalProducts: 1, lastUpdated: serverTimestamp() });
      }

      batchLogActivity(batch, tenantId, 'TAMBAH', `Produk baru "${strings.name}" stok: ${nums.stock}`);
      await batch.commit();
      return productRef.id;

    } catch (e: any) {
      throw new Error('Gagal menambah produk: ' + e.message);
    }
  }

  // ── Update Produk ─────────────────────────────────────

  static async updateProduct(
    tenantId:  string,
    productId: string,
    data:      ProductFormData,
    oldData:   any,
  ): Promise<void> {
    try {
      const batch      = writeBatch(db);
      const productRef = doc(db, 'tenants', tenantId, 'products', productId);

      const nums    = parseFormNumbers(data);
      const strings = sanitizeStringFields(data);
      const stockDiff = nums.stock - (oldData.stock || 0);

      // Log perubahan nama / harga
      const changes = buildChangeLog(oldData, strings.name, nums.price);
      if (changes.length > 0) {
        batchLogActivity(batch, tenantId, 'UPDATE', `Update "${oldData.name}": ${changes.join(', ')}`);
      }

      // Log perubahan stok
      if (stockDiff !== 0) {
        batchLogActivity(
          batch, tenantId,
          stockDiff > 0 ? 'IN' : 'OUT',
          `Stok "${strings.name}" ${stockDiff > 0 ? 'masuk' : 'keluar'} ${Math.abs(stockDiff)} unit`,
        );
        if (stockDiff > 0) {
          batchRecordStockPurchase(batch, tenantId, {
            productId,
            productName:   strings.name,
            quantity:      stockDiff,
            purchasePrice: nums.purchasePrice,
            isNewProduct:  false,
          });
        }

        const historyRef = doc(collection(db, 'tenants', tenantId, 'stock_history'));
        batch.set(historyRef, {
          productId,
          productName: strings.name,
          type: stockDiff > 0 ? 'IN' : 'OUT',
          beforeStock: oldData.stock || 0,
          afterStock: nums.stock,
          qtyChange: Math.abs(stockDiff),
          reason: 'Update Manual',
          date: serverTimestamp(),
          userId: getCurrentUserId() || '',
          userName: getCurrentUserName(),
        });
      }

      batch.update(productRef, {
        ...strings,
        ...nums,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (e: any) {
      throw new Error('Gagal memperbarui produk: ' + e.message);
    }
  }

  // ── Utilitas ──────────────────────────────────────────

  static validateProduct(data: ProductFormData): ProductValidationResult {
    const { name, price, purchasePrice, stock, barcode } = data;
    if (!name || !price || !purchasePrice || !stock || !barcode)
      return { isValid: false, error: 'Silakan isi semua data wajib.' };
    return { isValid: true };
  }

  static generateUniqueBarcode(type: 'EAN13' | 'CODE128'): string {
    return type === 'EAN13' ? generateEAN13() : generateCODE128();
  }

  static async uploadImage(localUri: string): Promise<string> {
    const res    = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
      method: 'POST',
      body:   buildImageFormData(localUri),
    });
    const result = await res.json();
    if (!result.secure_url)
      throw new Error('Upload gambar gagal: ' + (result.error?.message || 'Unknown'));
    return result.secure_url;
  }
}