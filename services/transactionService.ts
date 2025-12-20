import { db } from './firebaseConfig';
import { 
  runTransaction, 
  doc, 
  collection, 
  serverTimestamp,
  increment 
} from 'firebase/firestore';

/**
 * Fungsi untuk menangani proses checkout transaksi
 * Menerima 5 argumen untuk mendukung pencatatan uang tunai dan metode pembayaran
 */
export const handleCheckoutProcess = async (
  cartItems: any[], 
  total: number, 
  user: any,
  cashAmount: number,   // Tambahan argumen ke-4
  changeAmount: number, // Tambahan argumen ke-5
  paymentMethod: 'cash' | 'qris' = 'cash' // Tambahan opsional untuk logging
) => {
  try {
    return await runTransaction(db, async (transaction) => {
      // 1. Validasi Stok & Dapatkan Data Terbaru secara Atomik
      for (const item of cartItems) {
        const productRef = doc(db, 'products', item.id);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists()) {
          throw new Error(`Produk ${item.name} tidak ditemukan!`);
        }

        const currentStock = productDoc.data().stock;
        if (currentStock < item.qty) {
          throw new Error(`Stok ${item.name} tidak cukup. Tersisa: ${currentStock}`);
        }
      }

      // 2. Generate Nomor Transaksi dari Counter
      const counterRef = doc(db, 'counters', 'transactions');
      const counterSnap = await transaction.get(counterRef);
      let nextNumber = 1;
      if (counterSnap.exists()) {
        nextNumber = (counterSnap.data()?.count || 0) + 1;
      }
      transaction.set(counterRef, { count: increment(1) }, { merge: true });

      const year = new Date().getFullYear();
      const transactionNumber = `TRX-${year}-${String(nextNumber).padStart(4, '0')}`;

      // 3. Update Stok Produk
      cartItems.forEach((item) => {
        const pRef = doc(db, 'products', item.id);
        transaction.update(pRef, { stock: increment(-item.qty) });
      });

      // 4. Simpan Data Transaksi
      const transactionRef = doc(collection(db, 'transactions'));
      transaction.set(transactionRef, {
        transactionNumber,
        cashierId: user.uid,
        cashierName: user.displayName || user.email?.split('@')[0] || 'Kasir',
        cashierEmail: user.email,
        total: total,
        cashAmount: cashAmount,     // Menyimpan uang tunai yang diterima
        changeAmount: changeAmount, // Menyimpan kembalian
        paymentMethod: paymentMethod, // Menyimpan metode (cash/qris)
        date: serverTimestamp(),
        createdAt: serverTimestamp(),
        items: cartItems.map(item => ({
          productId: item.id,
          productName: item.name,
          qty: item.qty,
          price: item.price,
          subtotal: item.qty * item.price
        }))
      });

      return { success: true, transactionNumber };
    });
  } catch (e) {
    console.error("Transaction Error: ", e);
    throw e;
  }
};