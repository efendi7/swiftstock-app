/**
 * useProductForm.ts — hook untuk Add & Edit produk
 * Web-compatible: tidak pakai Alert.alert (silent di web)
 */

import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { ProductService } from '@services/productService';
import { ProductFormData } from '@/types/product.types';

const EMPTY_FORM: ProductFormData = {
  name: '', price: '', purchasePrice: '',
  supplier: '', category: '', stock: '0',
  barcode: '', imageUrl: '',
};

export function useProductForm(
  tenantId:   string | null,
  onSuccess:  () => void,
  productId?: string,
) {
  const [formData,    setFormData]    = useState<ProductFormData>(EMPTY_FORM);
  const [imageUri,    setImageUri]    = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Snapshot data asli produk — dipakai sebagai oldData ke updateProduct
  const oldDataRef = useRef<any>(null);

  // ── setInitialData ─────────────────────────────────────────
  const setInitialData = useCallback((data: ProductFormData, imgUri: string | null) => {
    setFormData(data);
    setImageUri(imgUri);
    oldDataRef.current = {
      name:          data.name,
      price:         parseFloat(data.price)         || 0,
      purchasePrice: parseFloat(data.purchasePrice) || 0,
      stock:         parseInt(data.stock)           || 0,
      barcode:       data.barcode,
      supplier:      data.supplier,
      category:      data.category,
      imageUrl:      data.imageUrl,
    };
  }, []);

  // ── updateField ────────────────────────────────────────────
  const updateField = useCallback(<K extends keyof ProductFormData>(
    field: K, value: ProductFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // ── generateBarcode ────────────────────────────────────────
  const generateBarcode = useCallback((type: 'EAN13' | 'CODE128') => {
    const code = ProductService.generateUniqueBarcode(type);
    setFormData(prev => ({ ...prev, barcode: code }));
  }, []);

  // ── handleBarcodeScanned ───────────────────────────────────
  const handleBarcodeScanned = useCallback((code: string) => {
    setFormData(prev => ({ ...prev, barcode: code }));
    setShowScanner(false);
  }, []);

  // ── pickImage ──────────────────────────────────────────────
  const pickImage = useCallback(async () => {
    if (Platform.OS === 'web') {
      try {
        const input    = document.createElement('input');
        input.type     = 'file';
        input.accept   = 'image/*';
        input.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const uri = ev.target?.result as string;
            setImageUri(uri);
            setFormData(prev => ({ ...prev, imageUrl: uri }));
          };
          reader.readAsDataURL(file);
        };
        input.click();
      } catch { /* ignore */ }
      return;
    }
    try {
      const { launchImageLibraryAsync, MediaTypeOptions, requestMediaLibraryPermissionsAsync } =
        await import('expo-image-picker');
      const { status } = await requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        setFormData(prev => ({ ...prev, imageUrl: uri }));
      }
    } catch (e) { console.warn('pickImage error:', e); }
  }, []);

  // ── removeImage ────────────────────────────────────────────
  const removeImage = useCallback(() => {
    setImageUri(null);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  }, []);

  // ── resetForm ──────────────────────────────────────────────
  const resetForm = useCallback(() => {
    setFormData(EMPTY_FORM);
    setImageUri(null);
    setErrorMsg(null);
    oldDataRef.current = null;
  }, []);

  // ── handleSubmit ───────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!tenantId) { setErrorMsg('Tenant tidak ditemukan'); return; }
    if (!formData.name || !formData.price || !formData.purchasePrice || !formData.barcode) {
      setErrorMsg('Nama, Harga Jual, Harga Beli, dan Barcode wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      // Upload gambar jika ada URI lokal (bukan URL https yang sudah ada)
      let finalImageUrl = formData.imageUrl || '';
      if (imageUri && !imageUri.startsWith('https')) {
        try {
          finalImageUrl = await ProductService.uploadImage(imageUri);
        } catch {
          console.warn('Upload gambar gagal, lanjut tanpa gambar');
          finalImageUrl = oldDataRef.current?.imageUrl || '';
        }
      }

      const dataToSave: ProductFormData = {
        ...formData,
        imageUrl:      finalImageUrl      || '',
        name:          formData.name?.trim()     || '',
        barcode:       formData.barcode?.trim()  || '',
        supplier:      formData.supplier         || '',
        category:      formData.category         || '',
      };

      if (productId) {
        // MODE EDIT
        const old = oldDataRef.current ?? {
          name: '', price: 0, purchasePrice: 0,
          stock: 0, barcode: '', supplier: '', category: '', imageUrl: '',
        };
        await ProductService.updateProduct(tenantId, productId, dataToSave, old);
      } else {
        // MODE TAMBAH
        const id = await ProductService.addProduct(tenantId, dataToSave);
        if (!id) throw new Error('Gagal menyimpan produk');
      }

      // Panggil onSuccess — di modal ini akan tutup modal + refresh list
      onSuccess();

    } catch (e: any) {
      setErrorMsg(e.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setLoading(false);
    }
  }, [tenantId, productId, formData, imageUri, onSuccess]);

  return {
    formData,
    loading,
    errorMsg,
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
    setInitialData,
  };
}