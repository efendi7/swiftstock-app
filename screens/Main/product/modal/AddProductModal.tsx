import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar, Modal,
  TouchableWithoutFeedback, Dimensions, KeyboardAvoidingView, Platform, Alert
} from 'react-native';

import { COLORS } from '../../../../constants/colors';
import { useProductForm } from '../../../../hooks/useProductForm';
import { ProductFormHeader } from '../../../../components/addproduct/ProductFormHeader';
import { ProductFormFields } from '../../../../components/addproduct/ProductFormFields';
import { SubmitButton } from '../../../../components/addproduct/SubmitButton';
import { AddCategoryModal } from './AddCategoryModal';
import { ProductService } from '../../../../services/productService';
import BarcodeScannerScreen from '../../transaction/BarcodeScannerScreen';

const { height } = Dimensions.get('window');
const MAX_MODAL_HEIGHT = height * 0.9;

interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ visible, onClose, onSuccess }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  
  // State untuk kategori
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);
  
  // State untuk modal tambah kategori
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const {
    formData, loading, showScanner, imageUri,
    updateField, generateBarcode, handleBarcodeScanned,
    handleSubmit, setShowScanner, pickImage, removeImage, resetForm
  } = useProductForm(() => {
    if (onSuccess) onSuccess();
    handleClose();
  });

  // Load kategori dari service
  const loadCategories = useCallback(async () => {
    try {
      const data = await ProductService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Gagal memuat kategori:", error);
      // Set kategori default jika gagal load
      setCategories([
        { label: 'Makanan', value: 'makanan' },
        { label: 'Minuman', value: 'minuman' },
        { label: 'Elektronik', value: 'elektronik' },
        { label: 'Pakaian', value: 'pakaian' },
        { label: 'Alat Tulis', value: 'alat_tulis' },
      ]);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible, loadCategories]);

  // Handler untuk menambah kategori baru
  const handleAddCategory = async (categoryName: string) => {
    try {
      // Simpan kategori baru ke database/service
      await ProductService.addCategory(categoryName);
      
      // Reload kategori dari database
      await loadCategories();
      
      // Set kategori yang baru ditambahkan sebagai pilihan
      updateField('category', categoryName.toLowerCase().replace(/\s+/g, '_'));
      
      Alert.alert("Berhasil", `Kategori "${categoryName}" telah ditambahkan.`);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Gagal menambah kategori");
      console.error("Error menambah kategori:", error);
    }
  };

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const onAutoGeneratePress = () => {
    Alert.alert(
      "Opsi Generate Barcode",
      "Pilih standar barcode yang diinginkan:",
      [
        { 
          text: "EAN-13 (Ritel Standar)", 
          onPress: () => generateBarcode('EAN13') 
        },
        { 
          text: "CODE-128 (Internal Toko)", 
          onPress: () => generateBarcode('CODE128') 
        },
        { text: "Batal", style: "cancel" }
      ]
    );
  };

  return (
    <>
      <Modal 
        transparent 
        visible={visible} 
        animationType="slide"
        onRequestClose={handleClose}
      >
        <StatusBar translucent backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <View
              style={[
                styles.modalContainer,
                { maxHeight: MAX_MODAL_HEIGHT },
              ]}
            >
              <ProductFormHeader onClose={handleClose} isModal />

              <View style={styles.contentWrapper}>
                <ScrollView
                  ref={scrollViewRef}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <ProductFormFields
                    isEditable={true}
                    name={formData.name}
                    price={formData.price}
                    purchasePrice={formData.purchasePrice}
                    supplier={formData.supplier}
                    category={formData.category}
                    categories={categories}
                    stock={formData.stock}
                    barcode={formData.barcode}
                    imageUri={imageUri}
                    onChangeName={(v) => updateField('name', v)}
                    onChangePrice={(v) => updateField('price', v)}
                    onChangePurchasePrice={(v) => updateField('purchasePrice', v)}
                    onChangeSupplier={(v) => updateField('supplier', v)}
                    onChangeCategory={(v) => updateField('category', v)}
                    onChangeStock={(v) => updateField('stock', v)}
                    onChangeBarcode={(v) => updateField('barcode', v)}
                    onPickImage={pickImage}
                    onRemoveImage={removeImage}
                    onScanPress={() => setShowScanner(true)}
                    onAutoGeneratePress={onAutoGeneratePress}
                    onAddCategoryPress={() => setShowCategoryModal(true)}
                    onFieldFocus={(fieldY) => {
                      scrollViewRef.current?.scrollTo({ y: fieldY - 60, animated: true });
                    }}
                  />

                  <SubmitButton loading={loading} onPress={handleSubmit} />

                  <Text style={styles.infoFooter}>
                    Gunakan EAN-13 untuk produk umum agar kompatibel dengan sistem lain.
                  </Text>
                </ScrollView>
              </View>

              {showScanner && (
                <BarcodeScannerScreen
                  visible={showScanner}
                  onClose={() => setShowScanner(false)}
                  onScan={handleBarcodeScanned}
                />
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal Tambah Kategori */}
      <AddCategoryModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onAdd={handleAddCategory}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  keyboardView: {
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  contentWrapper: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  infoFooter: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'PoppinsRegular',
    color: COLORS.textLight,
    marginTop: 16,
    paddingHorizontal: 20,
    lineHeight: 16,
    marginBottom: 8,
  },
});

export default AddProductModal;