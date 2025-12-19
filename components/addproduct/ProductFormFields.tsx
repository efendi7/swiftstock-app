import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { 
  Tag, 
  HandCoins, 
  Layers, 
  Barcode, 
  Coins, 
  Truck, 
  LayoutGrid, 
  Maximize,
  Camera,
  X
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import FloatingLabelInput from '../FloatingLabelInput';

export interface ProductFormFieldsProps {
  name: string;
  price: string;
  purchasePrice: string;
  supplier: string;
  category: string;
  stock: string;
  barcode: string;
  imageUri: string | null; // Tambahan untuk preview gambar
  onChangeName: (t: string) => void;
  onChangePrice: (t: string) => void;
  onChangePurchasePrice: (t: string) => void;
  onChangeSupplier: (t: string) => void;
  onChangeCategory: (t: string) => void;
  onChangeStock: (t: string) => void;
  onChangeBarcode: (t: string) => void;
  onPickImage: () => void;       // Tambahan fungsi pilih gambar
  onRemoveImage: () => void;     // Tambahan fungsi hapus gambar preview
  onScanPress: () => void;
  onAutoGeneratePress: () => void;
  onFieldFocus?: (y: number) => void;
}

export const ProductFormFields: React.FC<ProductFormFieldsProps> = ({
  name, price, purchasePrice, supplier, category, stock, barcode, imageUri,
  onChangeName, onChangePrice, onChangePurchasePrice, onChangeSupplier,
  onChangeCategory, onChangeStock, onChangeBarcode, onPickImage, onRemoveImage,
  onScanPress, onAutoGeneratePress, onFieldFocus,
}) => (
  <View style={styles.card}>
    {/* --- SECTION: IMAGE PICKER --- */}
    <View style={styles.imageSection}>
      <Text style={styles.sectionLabel}>Foto Produk</Text>
      <TouchableOpacity 
        style={[styles.imageUploadBox, imageUri && styles.imageBoxActive]} 
        onPress={onPickImage}
        activeOpacity={0.7}
      >
        {imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={onRemoveImage}>
              <X size={16} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.placeholderContainer}>
            <View style={styles.iconCircle}>
              <Camera size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.uploadText}>Tambah Foto</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>

    {/* --- SECTION: INPUT FIELDS --- */}
    <FloatingLabelInput
      label="Nama Produk"
      value={name}
      onChangeText={onChangeName}
      icon={<Tag size={18} color={COLORS.primary} />}
      onFocusCallback={onFieldFocus}
    />

    <View style={styles.row}>
      <View style={styles.flex}>
        <FloatingLabelInput
          label="Kategori"
          value={category}
          onChangeText={onChangeCategory}
          icon={<LayoutGrid size={18} color={COLORS.primary} />}
          onFocusCallback={onFieldFocus}
        />
      </View>
      <View style={styles.flex}>
        <FloatingLabelInput
          label="Pemasok"
          value={supplier}
          onChangeText={onChangeSupplier}
          icon={<Truck size={18} color={COLORS.primary} />}
          onFocusCallback={onFieldFocus}
        />
      </View>
    </View>

    <View style={styles.row}>
      <View style={styles.flex}>
        <FloatingLabelInput
          label="Harga Jual"
          value={price}
          onChangeText={onChangePrice}
          keyboardType="numeric"
          icon={<HandCoins size={18} color={COLORS.primary} />}
          onFocusCallback={onFieldFocus}
        />
      </View>
      <View style={styles.flex}>
        <FloatingLabelInput
          label="Harga Beli"
          value={purchasePrice}
          onChangeText={onChangePurchasePrice}
          keyboardType="numeric"
          icon={<Coins size={18} color={COLORS.primary} />}
          onFocusCallback={onFieldFocus}
        />
      </View>
    </View>

    <View style={styles.row}>
      <View style={styles.flex}>
        <FloatingLabelInput
          label="Stok"
          value={stock}
          onChangeText={onChangeStock}
          keyboardType="numeric"
          icon={<Layers size={18} color={COLORS.primary} />}
          onFocusCallback={onFieldFocus}
        />
      </View>
      <View style={styles.flex}>
        <FloatingLabelInput
          label="Barcode"
          value={barcode}
          onChangeText={onChangeBarcode}
          icon={<Barcode size={18} color={COLORS.primary} />}
          onFocusCallback={onFieldFocus}
        />
      </View>
    </View>

    <View style={styles.actions}>
      <TouchableOpacity style={styles.btn} onPress={onScanPress}>
        <Maximize size={16} color="#fff" />
        <Text style={styles.btnText}>SCAN</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnAlt} onPress={onAutoGeneratePress}>
        <HandCoins size={16} color="#fff" />
        <Text style={styles.btnText}>AUTO</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    padding: 18,
  },
  // Style untuk Image Picker
  imageSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionLabel: {
    fontFamily: 'PoppinsBold',
    fontSize: 14,
    color: COLORS.textDark,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  imageUploadBox: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imageBoxActive: {
    borderStyle: 'solid',
    borderColor: COLORS.primary,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadText: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 12,
    color: COLORS.primary,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.8)',
    padding: 4,
    borderRadius: 12,
  },
  // Sisa style
  row: { 
    flexDirection: 'row', 
    gap: 10 
  },
  flex: { 
    flex: 1 
  },
  actions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    gap: 8, 
    marginTop: -4
  },
  btn: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.secondary, 
    paddingHorizontal: 14, 
    paddingVertical: 9, 
    borderRadius: 10 
  },
  btnAlt: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FF8A65', 
    paddingHorizontal: 14, 
    paddingVertical: 9, 
    borderRadius: 10 
  },
  btnText: { 
    color: '#fff', 
    fontFamily: 'PoppinsBold', 
    fontSize: 12 
  },
});