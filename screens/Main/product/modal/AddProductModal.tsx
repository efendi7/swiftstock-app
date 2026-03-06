import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { X, Package } from 'lucide-react-native';

import { COLORS } from '@constants/colors';
import { ProductFormFields } from '@components/addproduct/ProductFormFields';
import { AddCategoryModal } from './AddCategoryModal';
import { ProductService } from '@services/productService';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Platform.OS === 'web' ? Math.min(600, width * 0.4) : width * 0.85;

export interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: { label: string; value: string }[];
  tenantId: string | null;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  visible,
  onClose,
  onSuccess,
  categories: initialCategories,
  tenantId,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [supplier, setSupplier] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('0');
  const [barcode, setBarcode] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [localCategories, setLocalCategories] = useState(initialCategories);

  // Animation
  const slideAnim = React.useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setLocalCategories(initialCategories);
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
  }, [visible, initialCategories]);

  const handleAddNewCategory = async (categoryName: string) => {
    if (!tenantId) return;
    try {
      await ProductService.addCategory(tenantId, categoryName);
      
      const updatedCategories = await ProductService.getCategories(tenantId);
      setLocalCategories(updatedCategories);
      
      setCategory(categoryName);
      Alert.alert('Berhasil', `Kategori ${categoryName} ditambahkan`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Gagal menambah kategori');
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
      // Reset form after animation
      setName('');
      setPrice('');
      setPurchasePrice('');
      setSupplier('');
      setCategory('');
      setStock('0');
      setBarcode('');
      setImageUri(null);
      onClose();
    });
  };

  const handleSave = async () => {
    try {
      if (!tenantId) {
        Alert.alert('Error', 'Tenant tidak ditemukan');
        return;
      }

      if (!name || !price || !purchasePrice || !barcode || !category) {
        Alert.alert('Error', 'Lengkapi semua data wajib (Nama, Harga, Harga Beli, Barcode, Kategori)');
        return;
      }

      setLoading(true);

      let finalImageUrl = '';
      if (imageUri) {
        try {
          finalImageUrl = await ProductService.uploadImage(imageUri);
        } catch (uploadError) {
          console.warn('Gagal upload gambar, lanjut tanpa gambar:', uploadError);
        }
      }

      const newProductId = await ProductService.addProduct(tenantId, {
        name: name.trim(),
        price,
        purchasePrice,
        supplier,
        category,
        stock,
        barcode: barcode.trim(),
        imageUrl: finalImageUrl,
      });

      if (!newProductId) {
        throw new Error('Gagal menyimpan produk ke database');
      }

      console.log('✅ Produk berhasil tersimpan dengan ID:', newProductId);

      Alert.alert('Berhasil', `Produk "${name}" berhasil ditambahkan`);

      await onSuccess();
      handleClose();
      
    } catch (error: any) {
      console.error('Error handleSave:', error);
      Alert.alert('Gagal', error.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      <Modal
        visible={visible}
        animationType="none"
        transparent
        onRequestClose={handleClose}
        statusBarTranslucent
      >
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
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconBox}>
                  <Package size={24} color={COLORS.primary} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Tambah Produk</Text>
                  <Text style={styles.headerSubtitle}>Lengkapi form di bawah</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.scrollView} 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <ProductFormFields
                name={name}
                price={price}
                purchasePrice={purchasePrice}
                supplier={supplier}
                category={category}
                stock={stock}
                barcode={barcode}
                imageUri={imageUri}
                categories={localCategories}
                onChangeName={setName}
                onChangePrice={setPrice}
                onChangePurchasePrice={setPurchasePrice}
                onChangeSupplier={setSupplier}
                onChangeCategory={setCategory}
                onChangeStock={setStock}
                onChangeBarcode={setBarcode}
                onPickImage={() => {}}
                onRemoveImage={() => setImageUri(null)}
                onScanPress={() => {}}
                onAutoGeneratePress={() =>
                  setBarcode(ProductService.generateUniqueBarcode('EAN13'))
                }
                onAddCategoryPress={() => setShowCategoryModal(true)}
                onStockOpname={() => {}}
                isEditable
              />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveBtn, loading && styles.saveBtnDisabled]} 
                onPress={handleSave} 
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Simpan Produk</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <AddCategoryModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onAdd={handleAddNewCategory}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
    backgroundColor: 'rgba(28, 58, 90, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'MontserratBold',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
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
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 15,
    fontFamily: 'PoppinsSemiBold',
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'PoppinsBold',
  },
});