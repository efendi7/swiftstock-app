import * as Print from 'expo-print';

const printReceipt = async (receiptContent: string) => {
  // receiptContent adalah string HTML atau string yang diformat
  try {
    await Print.printAsync({
      html: receiptContent, // Anda perlu memformat data transaksi menjadi HTML
      // printerUrl: ..., // opsional: spesifik printer
    });
  } catch (error) {
    console.error("Gagal mencetak resi:", error);
  }
};