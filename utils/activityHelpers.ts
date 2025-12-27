import { ActivityPart } from '../types/activity';

export const getActivityTitle = (type: string, message: string): string => {
  const upperType = type?.toUpperCase();
  const lowerMsg = message?.toLowerCase() || '';
  
  // 1. Produk Baru
  if (upperType === 'TAMBAH') {
    return 'PRODUK BARU';
  }
  
  // 2. Update Field Spesifik (DISESUAIKAN DENGAN SERVICE)
  if (upperType === 'UPDATE') {
    // Mencocokkan dengan teks yang dikirim dari ProductService
    if (lowerMsg.includes('harga jual')) return 'UPDATE HARGA JUAL';
    if (lowerMsg.includes('harga beli')) return 'UPDATE HARGA BELI';
    if (lowerMsg.includes('kategori')) return 'UPDATE KATEGORI';
    if (lowerMsg.includes('nama')) return 'UPDATE NAMA'; // Lebih umum agar mudah nyangkut
    if (lowerMsg.includes('supplier')) return 'UPDATE SUPPLIER';
    
    return 'UPDATE PRODUK';
  }
  
  // 3. Stok Masuk
  if (upperType === 'MASUK' || upperType === 'IN') {
    return 'STOK MASUK';
  }
  
  // 4. Stok Keluar / Penjualan
  if (upperType === 'KELUAR' || upperType === 'OUT') {
    if (lowerMsg.includes('checkout') || lowerMsg.includes('kasir') || lowerMsg.includes('terjual')) {
      return 'PENJUALAN';
    }
    return 'STOK KELUAR';
  }
  
  return 'AKTIVITAS';
};

export const formatActivityMessage = (message: string): ActivityPart[] => {
  const allMatches: any[] = [];
  
  // Regex Patterns
  const productRegex = /"([^"]+)"/g; // Menangkap apapun di dalam tanda kutip
  const priceRegex = /Rp\s?[\d.,]+/gi; // Menangkap format harga Rp
  const stockChangeRegex = /(\d+)\s+→\s+(\d+)/g; // Menangkap perubahan stok (10 → 15)
  const qtyRegex = /(\d+)\s+unit/gi; // Menangkap jumlah unit
  
  // Regex untuk menyorot label field (nama, harga jual, dll) sebelum kata "dari"
  const fieldLabelRegex = /(nama|harga jual|harga beli|kategori|supplier)(?=\sdari)/gi;

  const findMatches = (regex: RegExp, type: string) => {
    let match;
    while ((match = regex.exec(message)) !== null) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        type: type,
      });
    }
  };

  // Jalankan pencarian
  findMatches(productRegex, 'product');
  findMatches(priceRegex, 'price');
  findMatches(stockChangeRegex, 'qty');
  findMatches(qtyRegex, 'qty');
  findMatches(fieldLabelRegex, 'qty'); // Label field menggunakan warna secondary

  // Sortir semua temuan berdasarkan urutan kemunculan di teks
  allMatches.sort((a, b) => a.start - b.start);
  
  const parts: ActivityPart[] = [];
  let lastEnd = 0;

  allMatches.forEach((match) => {
    // Hindari tumpang tindih (overlap) antar regex
    if (match.start < lastEnd) return; 
    
    // Masukkan teks normal di antara highlight
    if (match.start > lastEnd) {
      parts.push({ 
        text: message.substring(lastEnd, match.start), 
        styleType: 'normal' 
      });
    }
    
    // Bersihkan tanda kutip jika tipe-nya produk agar tampilan lebih bersih
    let displayText = match.text;
    if (match.type === 'product') {
      displayText = match.text.replace(/"/g, ''); 
    }
    
    parts.push({ 
      text: displayText, 
      styleType: match.type as any 
    });
    
    lastEnd = match.end;
  });

  // Masukkan sisa teks di akhir kalimat
  if (lastEnd < message.length) {
    parts.push({ 
      text: message.substring(lastEnd), 
      styleType: 'normal' 
    });
  }
  
  return parts.length > 0 ? parts : [{ text: message, styleType: 'normal' }];
};