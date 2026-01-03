import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar, Modal,
  TouchableWithoutFeedback, Dimensions, KeyboardAvoidingView, Platform, Alert,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Save, Edit3, Lock } from 'lucide-react-native';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { COLORS } from '../../../../constants/colors';
import { db } from '../../../../services/firebaseConfig';
import { useProductForm } from '../../../../hooks/useProductForm';
import { ProductFormFields } from '../../../../components/addproduct/ProductFormFields';
import { AddCategoryModal } from './AddCategoryModal';
import { StockOpnameModal } from './StockOpnameModal';
import BarcodeScannerScreen from '../../transaction/BarcodeScannerScreen';
import { ProductService } from '../../../../services/productService';
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
  const [isEditable, setIsEditable] = useState(false);
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOpnameModal, setShowOpnameModal] = useState(false);
  
  const loadedProductId = useRef<string | null>(null);

  const {
    formData, loading, showScanner, imageUri,
    updateField, generateBarcode, handleBarcodeScanned, handleSubmit, 
    setShowScanner, pickImage, removeImage, resetForm, setInitialData
  } = useProductForm(() => {
    if (onSuccess) onSuccess();
    handleClose();
  }, product?.id);

  const loadCategories = useCallback(async () => {
    try {
      const data = await ProductService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Gagal memuat kategori:", error);
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
  }, [visible, product, setInitialData]);

  const handleSaveOpname = async (physicalStock: number, reason: string) => {
    try {
      if (!product?.id) return;
      
      const productRef = doc(db, 'products', product.id);
      const systemStock = parseInt(formData.stock || '0');
      const diff = physicalStock - systemStock;

      await updateDoc(productRef, { 
        stock: physicalStock,
        lastOpname: serverTimestamp()
      });

      await addDoc(collection(db, 'activities'), {
        type: 'UPDATE',
        message: `Stock Opname "${formData.name}": Sistem ${systemStock} → Fisik ${physicalStock} (Selisih: ${diff > 0 ? '+' : ''}${diff}). Alasan: ${reason || '-'}`,
        userName: 'Admin', 
        createdAt: serverTimestamp()
      });

      updateField('stock', physicalStock.toString());
      
      Alert.alert("Berhasil", "Stok fisik telah disesuaikan");
      if (onSuccess) onSuccess(); 
    } catch (error: any) {
      Alert.alert("Gagal", error.message);
      throw error;
    }
  };

  const handleAddCategory = async (categoryName: string) => {
    try {
      await ProductService.addCategory(categoryName);
      await loadCategories();
      updateField('category', categoryName);
      Alert.alert("Berhasil", `Kategori "${categoryName}" telah ditambahkan.`);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Gagal menambah kategori");
    }
  };

  const handleClose = () => {
    resetForm();
    setIsEditable(false);
    onClose();
  };

  const onAutoGeneratePress = () => {
    Alert.alert(
      "Opsi Generate Barcode",
      "Pilih standar barcode yang diinginkan:",
      [
        { text: "EAN-13", onPress: () => generateBarcode('EAN13') },
        { text: "CODE-128", onPress: () => generateBarcode('CODE128') },
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
            <View style={[styles.modalContainer, { maxHeight: MAX_MODAL_HEIGHT }]}>
              <LinearGradient
                colors={isEditable ? [COLORS.primary, '#2c537a'] : ['#475569', '#1e293b']}
                style={styles.header}
              >
                <View style={styles.dragHandleContainer}>
                  <View style={styles.dragHandle} />
                </View>
                <View style={styles.headerContent}>
                  <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerSubtitle}>
                      {isEditable ? "Mode Edit" : "Informasi"}
                    </Text>
                    <Text style={styles.headerTitle}>
                      {isEditable ? "Edit Produk" : "Detail Produk"}
                    </Text>
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
                    onStockOpname={() => setShowOpnameModal(true)}
                    onFieldFocus={(fieldY) => {
                      scrollViewRef.current?.scrollTo({ y: fieldY - 60, animated: true });
                    }}
                  />

                  <View style={styles.footerActions}>
                    {!isEditable ? (
                      userRole === 'admin' ? (
                        <TouchableOpacity 
                          style={styles.editModeButton} 
                          onPress={() => setIsEditable(true)}
                        >
                          <Edit3 size={20} color="#FFF" />
                          <Text style={styles.buttonText}>Edit Produk</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.readOnlyBadge}>
                          <Lock size={16} color={COLORS.textLight} />
                          <Text style={styles.readOnlyText}>Akses Terbatas (Kasir)</Text>
                        </View>
                      )
                    ) : (
                      <TouchableOpacity 
                        style={[styles.saveButton, loading && { opacity: 0.8 }]} 
                        onPress={handleSubmit} 
                        disabled={loading}
                      >
                        <LinearGradient 
                          colors={[COLORS.secondary, '#008e85']} 
                          style={styles.saveGradient}
                        >
                          {loading ? (
                            <ActivityIndicator color="#FFF" />
                          ) : (
                            <>
                              <Save size={20} color="#FFF" style={{ marginRight: 10 }} />
                              <Text style={styles.buttonText}>Simpan</Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                    {isEditable && (
                      <TouchableOpacity 
                        style={styles.cancelButton} 
                        onPress={() => {
                          if (product) {
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
                          }
                          setIsEditable(false);
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Batal</Text>
                      </TouchableOpacity>
                    )}
                  </View>
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

      <AddCategoryModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onAdd={handleAddCategory}
      />

      <StockOpnameModal 
        visible={showOpnameModal}
        onClose={() => setShowOpnameModal(false)}
        currentStock={parseInt(formData.stock || '0')}
        productName={formData.name}
        onSave={handleSaveOpname}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  keyboardView: { justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: COLORS.primary, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  contentWrapper: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -16, flexShrink: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  header: { paddingBottom: 36, paddingHorizontal: 20, paddingTop: 16 },
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