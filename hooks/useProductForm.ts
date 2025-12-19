import React, { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { ProductFormData } from '../models/Product';
import { ProductService } from '../services/productService';

export const useProductForm = (
  onSuccess?: () => void   // Tetap dipertahankan untuk backward compatibility
) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: '',
    purchasePrice: '',
    supplier: '',
    category: '',
    stock: '',
    barcode: '',
  });

  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const updateField = useCallback(
    (field: keyof ProductFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const generateBarcode = useCallback(() => {
    const code = ProductService.generateUniqueBarcode();
    updateField('barcode', code);
    Alert.alert('Barcode dibuat', code);
  }, []);

  const handleBarcodeScanned = (code: string) => {
    setShowScanner(false);
    updateField('barcode', code);
  };

  const resetForm = () =>
    setFormData({
      name: '',
      price: '',
      purchasePrice: '',
      supplier: '',
      category: '',
      stock: '',
      barcode: '',
    });

  const handleSubmit = async () => {
    // Validasi minimal (bisa diperbaiki lagi nanti)
    if (!formData.name || !formData.price || !formData.purchasePrice || !formData.category) {
      Alert.alert('Error', 'Nama, harga jual, harga beli, dan kategori wajib diisi');
      return;
    }

    setLoading(true);
    try {
      await ProductService.addProduct(
        formData.name,
        formData.price,
        formData.purchasePrice,
        formData.supplier || '',
        formData.category,
        formData.stock || '0',
        formData.barcode || ''
      );

      resetForm();
      
      // Ini kunci utamanya!
      onSuccess?.(); // Panggil callback (bisa refresh ProductScreen + Dashboard)

    } catch (e: any) {
      Alert.alert('Error', e.message || 'Gagal menambahkan produk');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    showScanner,
    setShowScanner,
    updateField,
    generateBarcode,
    handleBarcodeScanned,
    handleSubmit,
    resetForm, // Opsional: expose jika perlu dari luar
  };
};