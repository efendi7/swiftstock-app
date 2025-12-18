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
import { COLORS } from '../../../constants/colors';
import { useProductForm } from '../../../hooks/useProductForm';
import { ProductFormHeader } from '../../../components/product/ProductFormHeader';
import { ProductFormFields } from '../../../components/product/ProductFormFields';
import { SubmitButton } from '../../../components/product/SubmitButton';
import BarcodeScannerScreen from './../BarcodeScannerScreen';

const { height } = Dimensions.get('window');
const MAX_MODAL_HEIGHT = height * 0.85;

interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>; // ✅ OPTIONAL
}


const AddProductModal: React.FC<AddProductModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  /* =============================
     HANDLE CLOSE (STABLE)
  ============================== */
const handleClose = useCallback(() => {
  Animated.timing(slideAnim, {
    toValue: height,
    duration: 250,
    useNativeDriver: true,
  }).start(async () => {
    if (onSuccess) {
      await onSuccess(); // aman, dicek dulu
    }
    onClose();
  });
}, [onClose, onSuccess, slideAnim]);


  /* =============================
     PRODUCT FORM HOOK
  ============================== */
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

  /* =============================
     OPEN / CLOSE ANIMATION
  ============================== */
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }).start();
    } else {
      slideAnim.setValue(height);
    }
  }, [visible, slideAnim]);

  /* =============================
     SCROLL TO INPUT
  ============================== */
  const handleFieldFocus = (fieldY: number) => {
    scrollViewRef.current?.scrollTo({
      y: fieldY - 60,
      animated: true,
    });
  };

  return (
    <Modal transparent visible={visible} animationType="none">
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <View style={styles.overlay}>
        {/* BACKDROP */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* MODAL */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              maxHeight: MAX_MODAL_HEIGHT,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* HEADER */}
          <ProductFormHeader onClose={handleClose} isModal />

          <View style={styles.contentWrapper}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
            >
              <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <ProductFormFields
                  {...formData}
                  onChangeName={(v) => updateField('name', v)}
                  onChangePrice={(v) => updateField('price', v)}
                  onChangePurchasePrice={(v) =>
                    updateField('purchasePrice', v)
                  }
                  onChangeSupplier={(v) => updateField('supplier', v)}
                  onChangeCategory={(v) => updateField('category', v)}
                  onChangeStock={(v) => updateField('stock', v)}
                  onChangeBarcode={(v) => updateField('barcode', v)}
                  onScanPress={() => setShowScanner(true)}
                  onAutoGeneratePress={generateBarcode}
                  onFieldFocus={handleFieldFocus}
                />

                <SubmitButton
                  loading={loading}
                  onPress={handleSubmit}
                />

                <Text style={styles.infoFooter}>
                  Pastikan kategori, harga beli, dan pemasok diisi agar laporan laba akurat.
                </Text>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>

          {/* BARCODE SCANNER */}
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
