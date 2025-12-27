import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ProductService } from '../services/productService';
import { ProductFormData } from '../types/product.types'; // Pastikan path benar

export const useProductForm = (onSuccess: () => void, productId?: string) => {
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

  // State untuk menyimpan data asli (Original) dari database
  const [originalData, setOriginalData] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const updateField = useCallback((field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Memuat data awal saat modal edit dibuka
  const setInitialData = useCallback((data: ProductFormData, existingImageUri: string | null) => {
    setFormData(data);
    setImageUri(existingImageUri);
    
    // SIMPAN DATA ASLI DI SINI untuk perbandingan saat update
    setOriginalData({
      name: data.name,
      stock: parseInt(data.stock) || 0,
      price: parseFloat(data.price) || 0,
      purchasePrice: parseFloat(data.purchasePrice) || 0,
      category: data.category || '',
      supplier: data.supplier || ''
    });
  }, []);

  const generateBarcode = useCallback((type: 'EAN13' | 'CODE128') => {
    const newBarcode = ProductService.generateUniqueBarcode(type);
    updateField('barcode', newBarcode);
  }, [updateField]);

  const handleBarcodeScanned = useCallback((data: string) => {
    updateField('barcode', data);
    setShowScanner(false);
  }, [updateField]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Diperlukan', 'Aplikasi memerlukan izin akses galeri.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const removeImage = useCallback(() => {
    setImageUri(null);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name: '', price: '', purchasePrice: '', stock: '',
      barcode: '', supplier: '', category: '', imageUrl: ''
    });
    setImageUri(null);
    setOriginalData(null);
  }, []);

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      let finalData = { ...formData };
      
      if (imageUri && !imageUri.startsWith('http')) {
        const uploadedUrl = await ProductService.uploadImage(imageUri);
        finalData.imageUrl = uploadedUrl;
      } else {
        finalData.imageUrl = imageUri || '';
      }
      
      if (productId) {
        // PERBAIKAN: Kirim originalData (objek), bukan hanya initialStock (number)
        if (!originalData) throw new Error("Data asli tidak ditemukan.");
        
        await ProductService.updateProduct(productId, finalData, originalData);
        Alert.alert('Berhasil', 'Produk berhasil diperbarui');
      } else {
        await ProductService.addProduct(finalData);
        Alert.alert('Berhasil', 'Produk berhasil ditambahkan');
      }
      
      resetForm();
      onSuccess();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Gagal menyimpan produk');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData, loading, showScanner, imageUri,
    updateField, generateBarcode, handleBarcodeScanned,
    handleSubmit, setShowScanner, pickImage, removeImage, resetForm,
    setInitialData
  };
};