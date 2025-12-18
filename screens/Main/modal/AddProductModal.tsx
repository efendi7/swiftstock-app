import React, { useEffect, useRef } from 'react';
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
}

const AddProductModal: React.FC<AddProductModalProps> = ({ visible, onClose }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scrollViewRef = useRef<ScrollView>(null);

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

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  function handleClose() {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(onClose);
  }

  const handleFieldFocus = (fieldY: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ 
        y: fieldY - 60, 
        animated: true 
      });
    }
  };

  return (
    <Modal transparent visible={visible} animationType="none">
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalContainer,
            { 
              maxHeight: MAX_MODAL_HEIGHT, 
              transform: [{ translateY: slideAnim }] 
            },
          ]}
        >
          {/* HEADER MODAL */}
          <ProductFormHeader onClose={handleClose} isModal />

          <View style={styles.contentWrapper}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
              style={styles.keyboardView}
            >
              <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                bounces={true}
              >
                <ProductFormFields
                  name={formData.name}
                  price={formData.price}
                  purchasePrice={formData.purchasePrice}
                  supplier={formData.supplier}
                  category={formData.category}
                  stock={formData.stock}
                  barcode={formData.barcode}
                  onChangeName={(t) => updateField('name', t)}
                  onChangePrice={(t) => updateField('price', t)}
                  onChangePurchasePrice={(t) => updateField('purchasePrice', t)}
                  onChangeSupplier={(t) => updateField('supplier', t)}
                  onChangeCategory={(t) => updateField('category', t)}
                  onChangeStock={(t) => updateField('stock', t)}
                  onChangeBarcode={(t) => updateField('barcode', t)}
                  onScanPress={() => setShowScanner(true)}
                  onAutoGeneratePress={generateBarcode}
                  onFieldFocus={handleFieldFocus}
                />

                <SubmitButton loading={loading} onPress={handleSubmit} />

                <Text style={styles.infoFooter}>
                  Pastikan kategori, harga beli, dan pemasok diisi agar laporan laba akurat.
                </Text>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>

          <BarcodeScannerScreen
            visible={showScanner}
            onClose={() => setShowScanner(false)}
            onScan={handleBarcodeScanned}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    justifyContent: 'flex-end' 
  },
  backdrop: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalContainer: {
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    // Tidak menggunakan height: MODAL_HEIGHT agar auto-height mengikuti isi
  },
  contentWrapper: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16, // Overlay di atas header gradient sedikit
  },
  keyboardView: {
    // Membatasi keyboard avoiding view agar tidak memaksa tinggi ke flex 1
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