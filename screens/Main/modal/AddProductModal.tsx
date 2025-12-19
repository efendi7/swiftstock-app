import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// Constants & Hooks
import { COLORS } from '../../../constants/colors';
import { useProductForm } from '../../../hooks/useProductForm';

// Components
import { ProductFormHeader } from '../../../components/addproduct/ProductFormHeader';
import { ProductFormFields } from '../../../components/addproduct/ProductFormFields';
import { SubmitButton } from '../../../components/addproduct/SubmitButton';
import BarcodeScannerScreen from '../BarcodeScannerScreen';

const { height } = Dimensions.get('window');
const MAX_MODAL_HEIGHT = height * 0.85;

// Interface untuk Props agar tidak ada error TypeScript "implicitly any"
interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  // --- Animation Logic ---
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const animateModal = useCallback((toValue: number, callback?: () => void) => {
    if (toValue === 0) {
      Animated.spring(slideAnim, {
        toValue,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }).start(callback);
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start(callback);
    }
  }, [slideAnim]);

  // Efek saat modal dibuka atau ditutup dari props visible
  useEffect(() => {
    if (visible) {
      animateModal(0);
    } else {
      slideAnim.setValue(height);
    }
  }, [visible, animateModal, slideAnim]);

  // --- Form Logic dari Hook ---
  const {
    formData,
    loading,
    showScanner,
    imageUri, // State URI lokal untuk preview
    updateField,
    generateBarcode,
    handleBarcodeScanned,
    handleSubmit,
    setShowScanner,
    pickImage,
    removeImage,
    resetForm
  } = useProductForm(() => {
    // Callback ketika sukses simpan
    if (onSuccess) onSuccess();
    handleClose();
  });

  const handleClose = useCallback(() => {
    animateModal(height, () => {
      resetForm(); // Reset data form saat modal ditutup
      onClose();
    });
  }, [onClose, animateModal, resetForm]);

  const handleFieldFocus = (fieldY: number) => {
    scrollViewRef.current?.scrollTo({
      y: fieldY - 60,
      animated: true,
    });
  };

  return (
    <Modal transparent visible={visible} animationType="none">
      <StatusBar translucent backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />

      <View style={styles.overlay}>
        {/* Backdrop clickable untuk menutup modal */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                maxHeight: MAX_MODAL_HEIGHT,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header Biru Modal */}
            <ProductFormHeader onClose={handleClose} isModal />

            <View style={styles.contentWrapper}>
              <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* Input Fields Produk */}
                <ProductFormFields
                  name={formData.name}
                  price={formData.price}
                  purchasePrice={formData.purchasePrice}
                  supplier={formData.supplier}
                  category={formData.category}
                  stock={formData.stock}
                  barcode={formData.barcode}
                  imageUri={imageUri} // Menggunakan imageUri dari hook
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
                  onAutoGeneratePress={generateBarcode}
                  onFieldFocus={handleFieldFocus}
                />

                {/* Tombol Submit dengan Loading State */}
                <SubmitButton 
                  loading={loading} 
                  onPress={handleSubmit} 
                />

                <Text style={styles.infoFooter}>
                  Pastikan kategori, harga beli, dan pemasok diisi agar laporan laba akurat.
                </Text>
              </ScrollView>
            </View>

            {/* MODAL SCANNER BARCODE */}
            {showScanner && (
              <BarcodeScannerScreen
                visible={showScanner}
                onClose={() => setShowScanner(false)}
                onScan={handleBarcodeScanned}
              />
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
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