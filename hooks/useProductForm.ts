import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ProductService } from '../services/productService';
import { ProductFormData } from '../models/Product';

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
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [initialStock, setInitialStock] = useState(0);

  const updateField = useCallback((field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * PERBAIKAN UTAMA: Menggunakan useCallback 
   * Ini mencegah loop render saat dipanggil di useEffect EditProductModal
   */
  const setInitialData = useCallback((data: ProductFormData, existingImageUri: string | null) => {
    setFormData(data);
    setImageUri(existingImageUri);
    setInitialStock(parseInt(data.stock) || 0);
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
        Alert.alert(
          'Izin Diperlukan',
          'Aplikasi memerlukan izin akses galeri untuk memilih foto produk.',
          [{ text: 'OK' }]
        );
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
      Alert.alert('Error', 'Gagal memilih gambar. Silakan coba lagi.');
    }
  };

  const removeImage = useCallback(() => {
    setImageUri(null);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name: '', 
      price: '', 
      purchasePrice: '', 
      stock: '',
      barcode: '', 
      supplier: '', 
      category: '', 
      imageUrl: ''
    });
    setImageUri(null);
    setInitialStock(0);
  }, []);

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      let finalData = { ...formData };
      
      // Upload gambar baru jika ada perubahan (uri lokal/file)
      if (imageUri && !imageUri.startsWith('http')) {
        const uploadedUrl = await ProductService.uploadImage(imageUri);
        finalData.imageUrl = uploadedUrl;
      } else {
        finalData.imageUrl = imageUri || '';
      }
      
      if (productId) {
        await ProductService.updateProduct(productId, finalData, initialStock);
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
    formData, 
    loading, 
    showScanner, 
    imageUri,
    updateField, 
    generateBarcode, 
    handleBarcodeScanned,
    handleSubmit, 
    setShowScanner, 
    pickImage, 
    removeImage, 
    resetForm,
    setInitialData
  };
};