import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar, Modal,
  TouchableWithoutFeedback, Dimensions, KeyboardAvoidingView, Platform, Alert,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Save, Edit3, Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../../../../constants/colors';
import { useProductForm } from '../../../../hooks/useProductForm';
import { ProductFormFields } from '../../../../components/addproduct/ProductFormFields';
import BarcodeScannerScreen from '../../transaction/BarcodeScannerScreen';
import { Product } from '../../../../types/product.types';

const { height } = Dimensions.get('window');
const MAX_MODAL_HEIGHT = height * 0.9;

interface EditProductModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess?: () => void;
  userRole: 'admin' | 'kasir'; 
}

const EditProductModal: React.FC<EditProductModalProps> = ({ 
  visible, 
  product, 
  onClose, 
  onSuccess,
  userRole
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const [isEditable, setIsEditable] = useState(false);
  
  // Ref untuk mencegah loop (perbaikan error gambar 1)
  const loadedProductId = useRef<string | null>(null);

  const {
    formData, loading, showScanner, imageUri,
    updateField, handleBarcodeScanned, handleSubmit, 
    setShowScanner, pickImage, removeImage, resetForm, setInitialData
  } = useProductForm(() => {
    if (onSuccess) onSuccess();
    handleClose();
  }, product?.id);

  // Effect untuk sinkronisasi data (fix infinite loop)
  useEffect(() => {
    if (visible && product && product.id !== loadedProductId.current) {
      setInitialData({
        name: product.name,
        price: product.price.toString(),
        purchasePrice: product.purchasePrice.toString(),
        stock: product.stock.toString(),
        barcode: product.barcode,
        supplier: product.supplier || '',
        category: product.category || '',
        imageUrl: product.imageUrl || ''
      }, product.imageUrl || null);
      
      loadedProductId.current = product.id;
    }

    if (!visible) {
      loadedProductId.current = null;
      setIsEditable(false);
    }
  }, [product, visible, setInitialData]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const onAutoGeneratePress = () => {
    Alert.alert(
      "Opsi Generate Barcode",
      "Pilih standar barcode yang diinginkan:",
      [
        { 
          text: "EAN-13", 
          onPress: () => updateField('barcode', Date.now().toString().substring(0, 13))
        },
        { 
          text: "CODE-128", 
          onPress: () => updateField('barcode', Date.now().toString().substring(0, 15))
        },
        { text: "Batal", style: "cancel" }
      ]
    );
  };

  return (
    <Modal 
      transparent 
      visible={visible} 
      animationType="slide" // Meniru kecepatan modal transaksi
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
            <LinearGradient
  colors={isEditable ? [COLORS.primary, '#2c537a'] : ['#475569', '#1e293b']}
  // DIUBAH: Gunakan padding standar (biasanya 16-20), jangan tambahkan insets.top berlebih
  style={styles.header} 
>
  <View style={styles.dragHandleContainer}><View style={styles.dragHandle} /></View>
  <View style={styles.headerContent}>
    <View style={styles.headerTitleContainer}>
      <Text style={styles.headerSubtitle}>{isEditable ? "Mode Edit" : "Informasi"}</Text>
      <Text style={styles.headerTitle}>{isEditable ? "Edit Produk" : "Detail Produk"}</Text>
    </View>
    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
      <X size={24} color="#FFF" />
    </TouchableOpacity>
  </View>
</LinearGradient>

            <View style={styles.contentWrapper}>
              <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <ProductFormFields
                  isEditable={isEditable}
                  name={formData.name}
                  price={formData.price}
                  purchasePrice={formData.purchasePrice}
                  supplier={formData.supplier}
                  category={formData.category}
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
                  onFieldFocus={(fieldY) => {
                    scrollViewRef.current?.scrollTo({ y: fieldY - 60, animated: true });
                  }}
                />

                <View style={styles.footerActions}>
                  {!isEditable ? (
                    userRole === 'admin' ? (
                      <TouchableOpacity style={styles.editModeButton} onPress={() => setIsEditable(true)}>
                        <Edit3 size={20} color="#FFF" /><Text style={styles.buttonText}>Edit Produk</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.readOnlyBadge}>
                        <Lock size={16} color={COLORS.textLight} /><Text style={styles.readOnlyText}>Akses Terbatas (Kasir)</Text>
                      </View>
                    )
                  ) : (
                    <TouchableOpacity style={[styles.saveButton, loading && { opacity: 0.8 }]} onPress={handleSubmit} disabled={loading}>
                      <LinearGradient colors={[COLORS.secondary, '#008e85']} style={styles.saveGradient}>
                        {loading ? <ActivityIndicator color="#FFF" /> : <><Save size={20} color="#FFF" style={{ marginRight: 10 }} /><Text style={styles.buttonText}>Simpan</Text></>}
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                  {isEditable && (
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditable(false)}>
                      <Text style={styles.cancelButtonText}>Batal</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>

            {showScanner && (
              <BarcodeScannerScreen visible={showScanner} onClose={() => setShowScanner(false)} onScan={handleBarcodeScanned} />
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  keyboardView: { justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: COLORS.primary, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  contentWrapper: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -16, flexShrink: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  header: { paddingBottom: 36, paddingHorizontal: 20 },
  dragHandleContainer: { position: 'absolute', top: 8, left: 0, right: 0, alignItems: 'center' },
  dragHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  headerTitleContainer: { flex: 1 },
  headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 11, textTransform: 'uppercase', fontFamily: 'PoppinsMedium' },
  headerTitle: { color: '#FFF', fontSize: 20, fontFamily: 'MontserratBold' },
  closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  footerActions: { marginTop: 10, gap: 10 },
  editModeButton: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 15, gap: 10 },
  saveButton: { borderRadius: 15, overflow: 'hidden' },
  saveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  buttonText: { color: '#FFF', fontSize: 16, fontFamily: 'PoppinsSemiBold' },
  cancelButton: { alignItems: 'center', paddingVertical: 8 },
  cancelButtonText: { color: COLORS.danger, fontFamily: 'PoppinsMedium' },
  readOnlyBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 15, gap: 8 },
  readOnlyText: { color: '#64748B', fontFamily: 'PoppinsMedium' },
});

export default EditProductModal;