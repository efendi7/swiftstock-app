// types/product.types.ts
export interface ProductFormData {
  name: string;
  price: string;
  purchasePrice: string;
  stock: string;
  barcode: string;
  supplier?: string;
  category?: string;
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
  createdAt: any; // Firebase Timestamp
}

export interface ProductValidationResult {
  isValid: boolean;
  error?: string;
}