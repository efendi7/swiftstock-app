import { ActivityPart } from '../types/activity';

export const getActivityTitle = (type: string, message: string): string => {
  const upperType = type?.toUpperCase();
  const lowerMsg = message?.toLowerCase() || '';
  
  if (upperType === 'INFO') {
    if (lowerMsg.includes('menambah produk')) return 'Penambahan Produk';
    if (lowerMsg.includes('mengubah nama') || lowerMsg.includes('edit')) return 'Produk Telah Diedit';
    return 'Informasi';
  }
  
  if (upperType === 'IN') return 'Stok Masuk';
  if (upperType === 'OUT') return 'Kasir Checkout';
  
  return 'Aktivitas';
};

export const formatActivityMessage = (message: string): ActivityPart[] => {
  const allMatches: any[] = [];
  
  // Regex Patterns
  const productRegex = /"([^"]+)"/g;
  const totalQtyRegex = /total\s+(\d+)\s+produk/gi;
  const itemQtyRegex = /(\d+)\s+unit/gi;
  const priceRegex = /Rp\s?[\d.,]+/g;

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

  findMatches(productRegex, 'product');
  findMatches(totalQtyRegex, 'qty');
  findMatches(itemQtyRegex, 'qty');
  findMatches(priceRegex, 'price');

  // Urutkan match berdasarkan posisi teks
  allMatches.sort((a, b) => a.start - b.start);

  const parts: ActivityPart[] = [];
  let lastEnd = 0;

  allMatches.forEach((match) => {
    if (match.start < lastEnd) return; // Hindari overlap

    if (match.start > lastEnd) {
      parts.push({ text: message.substring(lastEnd, match.start), styleType: 'normal' });
    }
    
    let displayText = match.text;
    if (match.type === 'product') displayText = match.text.replace(/"/g, '');
    
    parts.push({ text: displayText, styleType: match.type as any });
    lastEnd = match.end;
  });

  if (lastEnd < message.length) {
    parts.push({ text: message.substring(lastEnd), styleType: 'normal' });
  }

  return parts.length > 0 ? parts : [{ text: message, styleType: 'normal' }];
};