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

// Components (Updated Path to addproduct)
import { ProductFormHeader } from '../../../components/addproduct/ProductFormHeader';
import { ProductFormFields } from '../../../components/addproduct/ProductFormFields';
import { SubmitButton } from '../../../components/addproduct/SubmitButton';
import BarcodeScannerScreen from '../BarcodeScannerScreen';

const { height } = Dimensions.get('window');
const MAX_MODAL_HEIGHT = height * 0.85;

interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // --- Animation Logic ---
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

  const handleClose = useCallback(() => {
    animateModal(height, async () => {
      if (onSuccess) await onSuccess();
      onClose();
    });
  }, [onClose, onSuccess, animateModal]);

  useEffect(() => {
    if (visible) {
      animateModal(0);
    } else {
      slideAnim.setValue(height);
    }
  }, [visible, animateModal, slideAnim]);

  // --- Form Logic ---
  const {
    formData,
    loading,
    showScanner,
    updateField,
    generateBarcode,
    handleBarcodeScanned,
    handleSubmit,
    setShowScanner,
  } = useProductForm(handleClose);

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
            <ProductFormHeader onClose={handleClose} isModal />

            <View style={styles.contentWrapper}>
              <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <ProductFormFields
                  {...formData}
                  // Helper untuk update field secara dinamis jika diperlukan, 
                  // atau tetap explisit seperti ini untuk type-safety yang kuat:
                  onChangeName={(v) => updateField('name', v)}
                  onChangePrice={(v) => updateField('price', v)}
                  onChangePurchasePrice={(v) => updateField('purchasePrice', v)}
                  onChangeSupplier={(v) => updateField('supplier', v)}
                  onChangeCategory={(v) => updateField('category', v)}
                  onChangeStock={(v) => updateField('stock', v)}
                  onChangeBarcode={(v) => updateField('barcode', v)}
                  onScanPress={() => setShowScanner(true)}
                  onAutoGeneratePress={generateBarcode}
                  onFieldFocus={handleFieldFocus}
                />

                <SubmitButton loading={loading} onPress={handleSubmit} />

                <Text style={styles.infoFooter}>
                  Pastikan kategori, harga beli, dan pemasok diisi agar laporan laba akurat.
                </Text>
              </ScrollView>
            </View>

            {/* BARCODE SCANNER MODAL */}
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
    flexShrink: 1, // Memastikan konten tidak "meledak" keluar screen
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