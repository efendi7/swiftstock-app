import { db } from './firebaseConfig';
import { 
  writeBatch, 
  getDocs, 
  collection, 
  doc 
} from 'firebase/firestore';

/**
 * Menghitung ulang soldCount khusus untuk satu toko (tenant) tertentu
 */
export const migrateSoldCountByTenant = async (tenantId: string) => {
  if (!tenantId) throw new Error("Tenant ID diperlukan untuk migrasi");

  try {
    // 1. Ambil transaksi khusus milik tenant tersebut
    const transactionsPath = collection(db, 'tenants', tenantId, 'transactions');
    const transactionsSnap = await getDocs(transactionsPath);
    const soldMap: Record<string, number> = {};

    // 2. Hitung total penjualan per produk
    transactionsSnap.forEach(docSnap => {
      const items = docSnap.data().items || [];
      items.forEach((item: any) => {
        const pId = item.productId || item.id; // handle jika key-nya berbeda
        if (pId) {
          soldMap[pId] = (soldMap[pId] || 0) + (item.qty || 0);
        }
      });
    });

    // 3. Update dokumen produk di dalam folder tenant
    const batch = writeBatch(db);
    const productsPath = collection(db, 'tenants', tenantId, 'products');
    const productsSnap = await getDocs(productsPath);
    
    productsSnap.forEach(prodDoc => {
      const totalSold = soldMap[prodDoc.id] || 0;
      batch.update(prodDoc.ref, { soldCount: totalSold });
    });

    await batch.commit();
    return { success: true, updatedProducts: productsSnap.size };
  } catch (error) {
    console.error("Migrasi SoldCount Gagal:", error);
    throw error;
  }
};