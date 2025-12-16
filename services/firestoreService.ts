import { db } from './firebaseConfig';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Product } from '../models/Product';

export const getProductByBarcode = async (barcode: string): Promise<Product | null> => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('barcode', '==', barcode), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('Produk tidak ditemukan.');
      return null;
    }

    // Ambil data pertama dari hasil query
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Product;

  } catch (error) {
    console.error("Error mendapatkan produk:", error);
    return null;
  }
};