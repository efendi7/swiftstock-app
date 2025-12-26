import { db } from './firebaseConfig'; // Pastikan path benar
import { writeBatch, getDocs, collection } from 'firebase/firestore';

export const migrateSoldCount = async () => {
  try {
    const transactionsSnap = await getDocs(collection(db, 'transactions'));
    const soldMap: Record<string, number> = {};

    transactionsSnap.forEach(doc => {
      const items = doc.data().items || [];
      items.forEach((item: any) => {
        if (item.productId) {
          soldMap[item.productId] = (soldMap[item.productId] || 0) + (item.qty || 0);
        }
      });
    });

    const batch = writeBatch(db);
    const productsSnap = await getDocs(collection(db, 'products'));
    
    productsSnap.forEach(prodDoc => {
      const totalSold = soldMap[prodDoc.id] || 0;
      batch.update(prodDoc.ref, { soldCount: totalSold });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Migrasi Gagal:", error);
    throw error;
  }
};