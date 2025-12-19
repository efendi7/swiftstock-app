// Interface untuk data yang ditarik dari Database (Firestore)
export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  purchasePrice: number;
  supplier: string;
  category: string;
  stock: number;
  imageUrl?: string; // Tambahan: Opsional karena produk lama mungkin belum punya foto
  createdAt?: any;
  updatedAt?: any;
}

// Interface untuk data yang ada di State Form (Input User)
export interface ProductFormData {
  name: string;
  price: string;
  purchasePrice: string;
  supplier: string;
  category: string;
  stock: string;
  barcode: string;
  imageUrl: string; // Tambahan: Wajib (bisa diisi string kosong "" jika tidak ada foto)
}

// Interface untuk hasil validasi
export interface ProductValidationResult {
  isValid: boolean;
  error?: string;
}