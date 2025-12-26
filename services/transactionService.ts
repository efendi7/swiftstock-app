import { db } from './firebaseConfig';
import { 
  runTransaction, 
  doc, 
  collection, 
  serverTimestamp,
  increment,
  getDocs,
  writeBatch 
} from 'firebase/firestore';

/**
 * 1. FUNGSI MIGRASI DATA LAMA (Jalankan sekali dari Profile)
 */
export const migrateSoldCount = async () => {
  try {
    console.log("Memulai migrasi soldCount...");
    const transactionsSnap = await getDocs(collection(db, 'transactions'));
    const soldMap: Record<string, number> = {};

    // Hitung total dari semua transaksi lama
    transactionsSnap.forEach(docSnap => {
      const data = docSnap.data();
      const items = data.items || [];
      items.forEach((item: any) => {
        if (item.productId) {
          soldMap[item.productId] = (soldMap[item.productId] || 0) + (item.qty || 0);
        }
      });
    });

    // Update dokumen produk menggunakan Batch
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

/**
 * 2. FUNGSI CHECKOUT (Update Stok & SoldCount Real-time)
 */
export const handleCheckoutProcess = async (
  cartItems: any[], 
  total: number, 
  user: any,
  cashAmount: number,
  changeAmount: number,
  paymentMethod: 'cash' | 'qris' = 'cash'
) => {
  try {
    return await runTransaction(db, async (transaction) => {
      // 1. Validasi Stok secara Atomik
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

      // 3. Update Stok Produk & SoldCount
      cartItems.forEach((item) => {
        const pRef = doc(db, 'products', item.id);
        transaction.update(pRef, { 
          stock: increment(-item.qty),
          soldCount: increment(item.qty) // Update real-time di sini
        });
      });

      // 4. Simpan Data Transaksi Utama
      const transactionRef = doc(collection(db, 'transactions'));
      transaction.set(transactionRef, {
        transactionNumber,
        cashierId: user.uid,
        cashierName: user.displayName || user.email?.split('@')[0] || 'Kasir',
        cashierEmail: user.email,
        total: total,
        cashAmount: cashAmount,
        changeAmount: changeAmount,
        paymentMethod: paymentMethod,
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

      // 5. Simpan Log Aktivitas
      const activityRef = doc(collection(db, 'activities'));
      const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
      const productList = cartItems.map(item => `${item.qty} unit "${item.name}"`).join(', ');
      const formattedPrice = `Rp ${total.toLocaleString('id-ID')}`;
      
      let message = `Kasir Checkout total ${totalQty} produk yaitu ${productList} via ${paymentMethod.toUpperCase()} seharga ${formattedPrice}`;
      if (paymentMethod === 'cash' && changeAmount > 0) {
        message += ` dengan kembalian Rp ${changeAmount.toLocaleString('id-ID')}`;
      }

      transaction.set(activityRef, {
        type: 'OUT',
        message: message,
        userName: user.displayName || user.email?.split('@')[0] || 'Kasir',
        createdAt: serverTimestamp(),
      });

      return { success: true, transactionNumber };
    });
  } catch (e) {
    console.error("Transaction Error: ", e);
    throw e;
  }
};