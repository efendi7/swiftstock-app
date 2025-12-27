// Interface untuk data yang ditarik dari Database (Firestore)
export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  purchasePrice: number;
  supplier: string;      // Sebaiknya wajib agar tidak error saat di-render
  category: string;      // Sebaiknya wajib agar tidak error saat di-render
  stock: number;
  soldCount: number;     // Penting untuk statistik penjualan
  imageUrl?: string; 
  createdAt: any;
  updatedAt: any;
}

// Interface untuk data yang ada di State Form (Input User)
// Di State Form, semua input angka biasanya bertipe 'string' karena dari TextInput
export interface ProductFormData {
  name: string;
  price: string;
  purchasePrice: string;
  supplier: string;
  category: string;
  stock: string;
  barcode: string;
  imageUrl: string;      // Wajib di state (bisa string kosong "")
}

// Interface untuk hasil validasi
export interface ProductValidationResult {
  isValid: boolean;
  error?: string;
}