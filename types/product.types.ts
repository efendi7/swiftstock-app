export interface ProductFormData {
  name: string;
  price: string;
  purchasePrice: string;
  stock: string;
  barcode: string;
  supplier?: string;
  category?: string;
  imageUrl: string; // Tambahkan ini untuk menampung URL hasil upload
}

export interface Product {
  id: string;
  name: string;
  price: number;
  purchasePrice: number;
  supplier?: string;
  category?: string;
  stock: number;
  barcode: string;
  imageUrl?: string;
  createdAt: any;
  sold?: number; // <--- TAMBAHKAN INI (opsional)
}

export interface ProductValidationResult {
  isValid: boolean;
  error?: string;
}