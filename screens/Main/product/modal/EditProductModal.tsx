import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar, Modal,
  Dimensions, Platform, Alert, TouchableOpacity, ActivityIndicator,
  Animated, TouchableWithoutFeedback,
} from 'react-native';
import { X, Save, Edit3, Lock, Package, Box } from 'lucide-react-native';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { COLORS } from '@constants/colors';
import { db, auth } from '@services/firebaseConfig';
import { useProductForm } from '@hooks/useProductForm';
import { ProductFormFields } from '@components/addproduct/ProductFormFields';
import { AddCategoryModal } from './AddCategoryModal';
import { StockOpnameModal } from './StockOpnameModal';
import BarcodeScannerScreen from '@screens/main/transaction/BarcodeScannerScreen';
import { ProductService } from '@services/productService';
import { Product } from '@/types/product.types';

const { width } = Dimensions.get('window');
const isWeb      = Platform.OS === 'web';
const DRAWER_W   = isWeb ? Math.min(560, width * 0.42) : width;

const PRIMARY = '#1C3A5A';

interface EditProductModalProps {
  visible:  boolean;
  product:  Product | null;
  tenantId: string | null;
  onClose:  () => void;
  onSuccess?: () => void;
  userRole: 'admin' | 'kasir';
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  visible, product, tenantId, onClose, onSuccess, userRole,
}) => {
  const scrollViewRef   = useRef<ScrollView>(null);
  const [isEditable, setIsEditable] = useState(false);
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOpnameModal,   setShowOpnameModal]   = useState(false);
  const loadedProductId = useRef<string | null>(null);

  // Animation
  const slideAnim   = useRef(new Animated.Value(DRAWER_W)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const {
    formData, loading, showScanner, imageUri,
    updateField, generateBarcode, handleBarcodeScanned, handleSubmit,
    setShowScanner, pickImage, removeImage, resetForm, setInitialData,
  } = useProductForm(tenantId, () => {
    if (onSuccess) onSuccess();
    handleClose();
  }, product?.id);

  const loadCategories = useCallback(async () => {
    if (!tenantId) return;
    try {
      const data = await ProductService.getCategories(tenantId);
      setCategories(data);
    } catch {
      setCategories([{ label: 'Umum', value: 'umum' }]);
    }
  }, [tenantId]);

  // Animate in / out
  useEffect(() => {
    if (visible) {
      loadCategories();
      Animated.parallel([
        Animated.timing(slideAnim,   { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim,   { toValue: DRAWER_W, duration: 250, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0,        duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, loadCategories]);

  // Load product data
  useEffect(() => {
    if (visible && product && product.id !== loadedProductId.current) {
      setInitialData({
        name:          product.name,
        price:         product.price.toString(),
        purchasePrice: product.purchasePrice.toString(),
        stock:         product.stock.toString(),
        barcode:       product.barcode,
        supplier:      product.supplier || '',
        category:      product.category || '',
        imageUrl:      product.imageUrl || '',
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
      const productRef  = doc(db, 'tenants', tenantId, 'products', product.id);
      const activityCol = collection(db, 'tenants', tenantId, 'activities');
      const systemStock = parseInt(formData.stock || '0');
      const diff = physicalStock - systemStock;
      const user = auth.currentUser;

      await updateDoc(productRef, {
        stock:     physicalStock,
        lastOpname: serverTimestamp(),
        updatedAt:  serverTimestamp(),
      });
      await addDoc(activityCol, {
        type:      'UPDATE',
        message:   `Stock Opname "${formData.name}": Sistem ${systemStock} → Fisik ${physicalStock} (Selisih: ${diff > 0 ? '+' : ''}${diff}). Alasan: ${reason || '-'}`,
        userName:  user?.displayName || user?.email?.split('@')[0] || 'Admin',
        userId:    user?.uid,
        createdAt: serverTimestamp(),
      });

      updateField('stock', physicalStock.toString());
      Alert.alert('Berhasil', 'Stok fisik telah disesuaikan');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      Alert.alert('Gagal', error.message);
      throw error;
    }
  };

  const handleAddCategory = async (categoryName: string) => {
    if (!tenantId) return;
    try {
      await ProductService.addCategory(tenantId, categoryName);
      await loadCategories();
      updateField('category', categoryName);
      Alert.alert('Berhasil', `Kategori "${categoryName}" telah ditambahkan.`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Gagal menambah kategori');
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim,   { toValue: DRAWER_W, duration: 250, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0,        duration: 250, useNativeDriver: true }),
    ]).start(() => {
      resetForm();
      setIsEditable(false);
      onClose();
    });
  };

  const onAutoGeneratePress = () => {
    Alert.alert(
      'Opsi Generate Barcode',
      'Pilih standar barcode yang diinginkan:',
      [
        { text: 'EAN-13',   onPress: () => generateBarcode('EAN13')   },
        { text: 'CODE-128', onPress: () => generateBarcode('CODE128') },
        { text: 'Batal', style: 'cancel' },
      ],
    );
  };

  const resetToOriginal = () => {
    if (product) {
      setInitialData({
        name:          product.name,
        price:         product.price.toString(),
        purchasePrice: product.purchasePrice.toString(),
        stock:         product.stock.toString(),
        barcode:       product.barcode,
        supplier:      product.supplier  || '',
        category:      product.category  || '',
        imageUrl:      product.imageUrl  || '',
      }, product.imageUrl || null);
    }
    setIsEditable(false);
  };

  if (!visible) return null;

  // ── SHARED INNER CONTENT ──────────────────────────────────
  const InnerContent = () => (
    <>
      {/* DRAG HANDLE — mobile only */}
      {!isWeb && <View style={s.handle} />}

      {/* HEADER */}
      <View style={[s.header, isEditable && s.headerEdit]}>
        <View style={s.headerLeft}>
          <View style={[s.headerIcon, { backgroundColor: isEditable ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)' }]}>
            {isEditable ? <Edit3 size={20} color="#FFF" /> : <Box size={20} color="#FFF" />}
          </View>
          <View>
            <Text style={s.headerSub}>
              {isEditable ? 'Mode Edit' : 'Informasi Produk'}
            </Text>
            <Text style={s.headerTitle}>
              {isEditable ? 'Edit Produk' : (product?.name || 'Detail Produk')}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
          <X size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* BODY — scrollable */}
      <ScrollView
        ref={scrollViewRef}
        style={s.body}
        contentContainerStyle={s.bodyContent}
        showsVerticalScrollIndicator={false}
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
          onChangeName={(v)          => updateField('name', v)}
          onChangePrice={(v)         => updateField('price', v)}
          onChangePurchasePrice={(v) => updateField('purchasePrice', v)}
          onChangeSupplier={(v)      => updateField('supplier', v)}
          onChangeCategory={(v)      => updateField('category', v)}
          onChangeStock={(v)         => updateField('stock', v)}
          onChangeBarcode={(v)       => updateField('barcode', v)}
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

      {/* FOOTER — fixed */}
      <View style={[s.footer, { backgroundColor: isEditable ? PRIMARY : '#FFF' }]}>
        {!isEditable ? (
          userRole === 'admin' ? (
            <TouchableOpacity style={s.editBtn} onPress={() => setIsEditable(true)} activeOpacity={0.8}>
              <Edit3 size={18} color="#FFF" />
              <Text style={s.footerBtnText}>Edit Produk</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.readOnlyRow}>
              <Lock size={14} color="#94A3B8" />
              <Text style={s.readOnlyText}>Akses Terbatas (Kasir)</Text>
            </View>
          )
        ) : (
          <>
            {/* Total tagihan style — info singkat produk */}
            <View style={s.footerInfo}>
              <Text style={s.footerInfoLabel}>Harga Jual</Text>
              <Text style={s.footerInfoValue}>
                Rp {parseInt(formData.price || '0').toLocaleString('id-ID')}
              </Text>
            </View>
            <View style={s.footerDivider} />
            <View style={s.footerActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={resetToOriginal} activeOpacity={0.7}>
                <Text style={s.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, loading && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Save size={16} color="#FFF" />
                    <Text style={s.footerBtnText}>Simpan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
    </>
  );

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

        {isWeb ? (
          // WEB — drawer dari kanan
          <View style={s.overlayWeb}>
            <TouchableWithoutFeedback onPress={handleClose}>
              <Animated.View style={[s.backdrop, { opacity: opacityAnim }]} />
            </TouchableWithoutFeedback>

            <Animated.View style={[
              s.drawerContainer,
              { width: DRAWER_W, transform: [{ translateX: slideAnim }] },
            ]}>
              <InnerContent />
            </Animated.View>
          </View>
        ) : (
          // MOBILE — bottom sheet
          <View style={s.overlayMobile}>
            <TouchableWithoutFeedback onPress={handleClose}>
              <Animated.View style={[s.backdrop, { opacity: opacityAnim }]} />
            </TouchableWithoutFeedback>

            <Animated.View style={[
              s.sheetContainer,
              { transform: [{ translateY: slideAnim }] },
            ]}>
              <InnerContent />
            </Animated.View>
          </View>
        )}
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

// ── STYLES ────────────────────────────────────────────────
const s = StyleSheet.create({
  // Overlays
  overlayWeb: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  overlayMobile: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  // Web drawer
  drawerContainer: {
    height: '100%' as any,
    backgroundColor: '#F8FAFC',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
    flexDirection: 'column',
  },

  // Mobile bottom sheet
  sheetContainer: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%' as any,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },

  // Drag handle
  handle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 12, marginBottom: 4,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: PRIMARY,
  },
  headerEdit: {
    backgroundColor: '#2C537A',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    width: 40, height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSub: {
    fontSize: 10,
    fontFamily: 'PoppinsMedium',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase' as any,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: 'PoppinsBold',
    color: '#FFF',
    marginTop: 1,
  },
  closeBtn: {
    width: 34, height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Body
  body:        { flexShrink: 1 },
  bodyContent: { padding: 16, paddingBottom: 12 },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },

  // Footer — view mode
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    paddingVertical: 13,
    borderRadius: 12,
  },
  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 12,
  },
  readOnlyText: {
    fontSize: 13,
    fontFamily: 'PoppinsMedium',
    color: '#94A3B8',
  },

  // Footer — edit mode
  footerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  footerInfoLabel: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: 'rgba(255,255,255,0.7)',
  },
  footerInfoValue: {
    fontSize: 20,
    fontFamily: 'PoppinsBold',
    color: '#FFF',
  },
  footerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 12,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: 'rgba(255,255,255,0.85)',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  footerBtnText: {
    fontSize: 14,
    fontFamily: 'PoppinsBold',
    color: '#FFF',
  },
});

export default EditProductModal;