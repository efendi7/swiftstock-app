import { db } from './firebaseConfig';
import { runTransaction, doc, collection } from 'firebase/firestore';

const handleCheckout = async (cartItems: any[], total: number, cashierId: string) => {
    try {
        await runTransaction(db, async (transaction) => {
            // 1. Validasi Stok & Dapatkan Product DocRefs
            const productRefs = cartItems.map(item => doc(db, 'products', item.id));

            for (const item of cartItems) {
                const productRef = doc(db, 'products', item.id);
                const productDoc = await transaction.get(productRef);

                if (!productDoc.exists()) {
                    throw "Produk tidak ditemukan!";
                }

                const newStock = productDoc.data().stock - item.qty;
                if (newStock < 0) {
                    throw `Stok ${productDoc.data().name} tidak cukup.`;
                }

                // 2. Update Stok
                transaction.update(productRef, { stock: newStock });
            }

            // 3. Simpan Transaksi
            const transactionRef = doc(collection(db, 'transactions')); // Membuat Ref baru untuk id
            transaction.set(transactionRef, {
                cashierId: cashierId,
                total: total,
                date: new Date(), // Simpan sebagai Timestamp
                items: cartItems.map(item => ({ productId: item.id, qty: item.qty, price: item.price }))
            });

            // Jika berhasil, cetak resi (di luar transaction, tapi setelah commit)
        });
        
        console.log("Transaksi berhasil disimpan.");
        // Panggil fungsi cetak resi di sini
        // await printReceipt(transactionDetails); 

    } catch (e) {
        console.error("Checkout gagal: ", e);
        // Tampilkan error ke pengguna
    }
};