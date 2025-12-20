import { useState } from 'react';
import { ProductService } from '../services/productService';
import { ProductFormData } from '../models/Product';

export const useProductForm = (onSuccess: () => void) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: '',
    purchasePrice: '',
    stock: '',
    barcode: '',
    supplier: '',
    category: '',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const updateField = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // PERBAIKAN: Menambahkan parameter type
  const generateBarcode = (type: 'EAN13' | 'CODE128') => {
    const newBarcode = ProductService.generateUniqueBarcode(type);
    updateField('barcode', newBarcode);
  };

  const handleBarcodeScanned = (data: string) => {
    updateField('barcode', data);
    setShowScanner(false);
  };

  const pickImage = async () => {
    // Logika pemilihan gambar Anda (ImagePicker)
    // setImageUri(result.uri);
  };

  const removeImage = () => {
    setImageUri(null);
    updateField('imageUrl', '');
  };

  const resetForm = () => {
    setFormData({
      name: '', price: '', purchasePrice: '', stock: '',
      barcode: '', supplier: '', category: '', imageUrl: ''
    });
    setImageUri(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let finalData = { ...formData };
      if (imageUri) {
        const uploadedUrl = await ProductService.uploadImage(imageUri);
        finalData.imageUrl = uploadedUrl;
      }
      await ProductService.addProduct(finalData);
      resetForm();
      onSuccess();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    formData, loading, showScanner, imageUri,
    updateField, generateBarcode, handleBarcodeScanned,
    handleSubmit, setShowScanner, pickImage, removeImage, resetForm
  };
};