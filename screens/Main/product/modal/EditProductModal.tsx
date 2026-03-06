import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar, Modal,
  Dimensions, Platform, Alert, TouchableOpacity, ActivityIndicator,
  Animated, TouchableWithoutFeedback
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Save, Edit3, Lock, Package } from 'lucide-react-native';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { COLORS } from '../../../../constants/colors';
import { db, auth } from '../../../../services/firebaseConfig';
import { useProductForm } from '../../../../hooks/useProductForm';
import { ProductFormFields } from '../../../../components/addproduct/ProductFormFields';
import { AddCategoryModal } from './AddCategoryModal';
import { StockOpnameModal } from './StockOpnameModal';
import BarcodeScannerScreen from '../../transaction/BarcodeScannerScreen';
import { ProductService } from '../../../../services/productService';
import { Product } from '../../../../types/product.types';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = Platform.OS === 'web' ? Math.min(600, width * 0.4) : width * 0.85;

interface EditProductModalProps {
  visible: boolean;
  product: Product | null;
  tenantId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
  userRole: 'admin' | 'kasir'; 
}

const EditProductModal: React.FC<EditProductModalProps> = ({ 
  visible, 
  product, 
  tenantId,
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

  // Animation
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const {
    formData, loading, showScanner, imageUri,
    updateField, generateBarcode, handleBarcodeScanned, handleSubmit, 
    setShowScanner, pickImage, removeImage, resetForm, setInitialData
  } = useProductForm(tenantId, () => {
    if (onSuccess) onSuccess();
    handleClose();
  }, product?.id);

  const loadCategories = useCallback(async () => {
    if (!tenantId) return;
    try {
      const data = await ProductService.getCategories(tenantId);
      setCategories(data);
    } catch (error) {
      console.error("Gagal memuat kategori:", error);
      setCategories([{ label: 'Umum', value: 'umum' }]);
    }
  }, [tenantId]);

  // Animation effect
  useEffect(() => {
    if (visible) {
      loadCategories();
      // Slide in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
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
    if (!tenantId || !product?.id) return;
    
    try {
      const productRef = doc(db, 'tenants', tenantId, 'products', product.id);
      const activityCol = collection(db, 'tenants', tenantId, 'activities');
      
      const systemStock = parseInt(formData.stock || '0');
      const diff = physicalStock - systemStock;
      const user = auth.currentUser;

      await updateDoc(productRef, { 
        stock: physicalStock,
        lastOpname: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await addDoc(activityCol, {
        type: 'UPDATE',
        message: `Stock Opname "${formData.name}": Sistem ${systemStock} → Fisik ${physicalStock} (Selisih: ${diff > 0 ? '+' : ''}${diff}). Alasan: ${reason || '-'}`,
        userName: user?.displayName || user?.email?.split('@')[0] || 'Admin', 
        userId: user?.uid,
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
    if (!tenantId) return;
    try {
      await ProductService.addCategory(tenantId, categoryName);
      await loadCategories();
      updateField('category', categoryName);
      Alert.alert("Berhasil", `Kategori "${categoryName}" telah ditambahkan.`);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Gagal menambah kategori");
    }
  };

  const handleClose = () => {
    // Animate out first
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      resetForm();
      setIsEditable(false);
      onClose();
    });
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

  if (!visible) return null;

  return (
    <>
      <Modal 
        transparent 
        visible={visible} 
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
        <View style={styles.modalOverlay}>
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={handleClose}>
            <Animated.View 
              style={[
                styles.backdrop,
                { opacity: opacityAnim }
              ]} 
            />
          </TouchableWithoutFeedback>

          {/* Drawer from Right */}
          <Animated.View
            style={[
              styles.drawerContainer,
              {
                width: DRAWER_WIDTH,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <LinearGradient
              colors={isEditable ? [COLORS.primary, '#2c537a'] : ['#475569', '#1e293b']}
              style={styles.header}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconBox}>
                    <Package size={24} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.headerSubtitle}>
                      {isEditable ? "Mode Edit" : "Informasi"}
                    </Text>
                    <Text style={styles.headerTitle}>
                      {isEditable ? "Edit Produk" : "Detail Produk"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <X size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Content */}
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
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              {!isEditable ? (
                userRole === 'admin' ? (
                  <TouchableOpacity 
                    style={styles.editModeButton} 
                    onPress={() => setIsEditable(true)}
                    activeOpacity={0.7}
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
                <>
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
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Batal</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.saveButton, loading && { opacity: 0.6 }]} 
                    onPress={handleSubmit} 
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <LinearGradient 
                      colors={[COLORS.secondary, '#008e85']} 
                      style={styles.saveGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <>
                          <Save size={20} color="#FFF" />
                          <Text style={styles.buttonText}>Simpan</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {showScanner && (
              <BarcodeScannerScreen 
                visible={showScanner} 
                onClose={() => setShowScanner(false)} 
                onScan={handleBarcodeScanned} 
              />
            )}
          </Animated.View>
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
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    height: '100%',
    backgroundColor: '#F8FAFC',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    textTransform: 'uppercase',
    fontFamily: 'PoppinsMedium',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: 'MontserratBold',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  editModeButton: {
    flex: 1,
    height: 50,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748B',
    fontFamily: 'PoppinsSemiBold',
    fontSize: 15,
  },
  saveButton: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'PoppinsBold',
  },
  readOnlyBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  readOnlyText: {
    color: '#64748B',
    fontFamily: 'PoppinsMedium',
  },
});

export default EditProductModal;