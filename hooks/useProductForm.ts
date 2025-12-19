import React, { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { ProductFormData } from '../models/Product';
import { ProductService } from '../services/productService';

export const useProductForm = (
  onSuccess?: () => void 
) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    price: '',
    purchasePrice: '',
    supplier: '',
    category: '',
    stock: '',
    barcode: '',
    imageUrl: '', 
  });

  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null); 

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
  }, [updateField]);

  const handleBarcodeScanned = (code: string) => {
    setShowScanner(false);
    updateField('barcode', code);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      purchasePrice: '',
      supplier: '',
      category: '',
      stock: '',
      barcode: '',
      imageUrl: '',
    });
    setImageUri(null);
  };
  
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Maaf, kami butuh izin galeri untuk mengunggah foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Fungsi tambahan untuk menghapus preview gambar jika user batal pilih
  const removeImage = () => {
    setImageUri(null);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.purchasePrice || !formData.category) {
      Alert.alert('Error', 'Nama, harga jual, harga beli, dan kategori wajib diisi');
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = '';

      // 1. Upload jika ada gambar baru
      if (imageUri) {
        finalImageUrl = await ProductService.uploadImage(imageUri);
      }

      // 2. Gabungkan formData dengan imageUrl terbaru menjadi 1 OBJEK
      const productToSave: ProductFormData = {
        ...formData,
        stock: formData.stock || '0', // Fallback jika stok kosong
        supplier: formData.supplier || 'Umum',
        imageUrl: finalImageUrl // Masukkan URL hasil upload ke dalam objek
      };

      // 3. Panggil service dengan 1 argumen sesuai pesan error (Expected 1 arguments)
      await ProductService.addProduct(productToSave);

      Alert.alert('Sukses', 'Produk berhasil ditambahkan');
      resetForm();
      onSuccess?.(); 

    } catch (e: any) {
      console.error('Submit Error:', e);
      Alert.alert('Error', e.message || 'Gagal menambahkan produk');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    showScanner,
    imageUri,
    setShowScanner,
    updateField,
    generateBarcode,
    handleBarcodeScanned,
    pickImage,
    removeImage, // Expose fungsi hapus gambar
    handleSubmit,
    resetForm,
  };
};