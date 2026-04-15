export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  purchasePrice: number;
  supplier: string; 
  category: string; 
  stock: number;
  soldCount: number; 
  imageUrl?: string; 
  createdAt: any;
  updatedAt: any;
}

export interface ProductFormData {
  name: string;
  price: string;
  purchasePrice: string;
  supplier: string;
  category: string;
  stock: string;
  barcode: string;
  imageUrl: string;     
}

export interface ProductValidationResult {
  isValid: boolean;
  error?: string;
}