import React, { useState } from 'react';
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
  X,
  Plus,
  Zap,
} from 'lucide-react-native';
import { Dropdown } from 'react-native-element-dropdown';
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
  imageUri: string | null;
  categories: { label: string; value: string }[];
  onChangeName: (t: string) => void;
  onChangePrice: (t: string) => void;
  onChangePurchasePrice: (t: string) => void;
  onChangeSupplier: (t: string) => void;
  onChangeCategory: (t: string) => void;
  onChangeStock: (t: string) => void;
  onChangeBarcode: (t: string) => void;
  onPickImage: () => void;
  onRemoveImage: () => void;
  onScanPress: () => void;
  onAutoGeneratePress: () => void;
  onAddCategoryPress: () => void;
  onStockOpname: () => void; // ✅ Menambahkan prop yang kurang
  onFieldFocus?: (y: number) => void;
  isEditable?: boolean;
}

export const ProductFormFields: React.FC<ProductFormFieldsProps> = ({
  name,
  price,
  purchasePrice,
  supplier,
  category,
  stock,
  barcode,
  imageUri,
  categories,
  onChangeName,
  onChangePrice,
  onChangePurchasePrice,
  onChangeSupplier,
  onChangeCategory,
  onChangeStock,
  onChangeBarcode,
  onPickImage,
  onRemoveImage,
  onScanPress,
  onAutoGeneratePress,
  onAddCategoryPress,
  onStockOpname, // ✅ Destructure prop disini
  onFieldFocus,
  isEditable = true,
}) => {
  const iconColor = isEditable ? COLORS.primary : '#94A3B8';
  const [isFocus, setIsFocus] = useState(false);

  return (
    <View style={styles.card}>
      {/* --- SECTION: IMAGE PICKER --- */}
      <View style={styles.imageSection}>
        <Text style={styles.sectionLabel}>Foto Produk</Text>
        <TouchableOpacity
          style={[
            styles.imageUploadBox,
            imageUri && styles.imageBoxActive,
            !isEditable && { borderStyle: 'solid', backgroundColor: '#F1F5F9' },
          ]}
          onPress={isEditable ? onPickImage : undefined}
          activeOpacity={isEditable ? 0.7 : 1}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              {isEditable && (
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={onRemoveImage}>
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.placeholderContainer}>
              <View
                style={[
                  styles.iconCircle,
                  !isEditable && { backgroundColor: '#E2E8F0' },
                ]}>
                <Camera size={24} color={iconColor} />
              </View>
              <Text
                style={[
                  styles.uploadText,
                  !isEditable && { color: '#94A3B8' },
                ]}>
                {isEditable ? 'Tambah Foto' : 'Tidak ada foto'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* --- SECTION: INPUT FIELDS --- */}
      <View>
        <FloatingLabelInput
          label="Nama Produk"
          value={name}
          onChangeText={onChangeName}
          icon={<Tag size={18} color={iconColor} />}
          onFocusCallback={onFieldFocus}
          editable={isEditable}
        />

        <View
          style={[
            styles.dropdownContainer,
            isFocus && { borderColor: COLORS.primary },
          ]}>
          <LayoutGrid
            size={18}
            color={isFocus ? COLORS.primary : iconColor}
            style={styles.dropdownIcon}
          />
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            data={categories}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={!isFocus ? 'Kategori' : '...'}
            searchPlaceholder="Cari..."
            value={category}
            onFocus={() => setIsFocus(true)}
            onBlur={() => setIsFocus(false)}
            onChange={item => {
              onChangeCategory(item.value);
              setIsFocus(false);
            }}
            disable={!isEditable}
            containerStyle={{ zIndex: 1000 }}
          />
          {isEditable && (
            <TouchableOpacity
              style={styles.addCategoryBtn}
              onPress={onAddCategoryPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.6}>
              <Plus size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        <FloatingLabelInput
          label="Pemasok"
          value={supplier}
          onChangeText={onChangeSupplier}
          icon={<Truck size={18} color={iconColor} />}
          onFocusCallback={onFieldFocus}
          editable={isEditable}
        />

        <View style={styles.row}>
          <View style={styles.flex}>
            <FloatingLabelInput
              label="Harga Jual"
              value={price}
              onChangeText={onChangePrice}
              keyboardType="numeric"
              icon={<HandCoins size={18} color={iconColor} />}
              onFocusCallback={onFieldFocus}
              editable={isEditable}
            />
          </View>
          <View style={styles.flex}>
            <FloatingLabelInput
              label="Harga Beli"
              value={purchasePrice}
              onChangeText={onChangePurchasePrice}
              keyboardType="numeric"
              icon={<Coins size={18} color={iconColor} />}
              onFocusCallback={onFieldFocus}
              editable={isEditable}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.flex}>
            <View style={styles.stockInputWrapper}>
              <FloatingLabelInput
                label="Stok"
                value={stock}
                onChangeText={onChangeStock}
                keyboardType="numeric"
                icon={<Layers size={18} color={iconColor} />}
                onFocusCallback={onFieldFocus}
                editable={isEditable}
              />
              {isEditable && (
                <View style={styles.stockStepper}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() =>
                      onChangeStock((parseInt(stock || '0') + 1).toString())
                    }>
                    <Plus size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() =>
                      onChangeStock(
                        Math.max(0, parseInt(stock || '0') - 1).toString(),
                      )
                    }>
                    <View style={styles.minusIcon} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {isEditable && (
              <TouchableOpacity
                style={styles.opnameBtn}
                onPress={onStockOpname} // ✅ Memanggil prop onStockOpname
              >
                <Text style={styles.opnameText}>Stock Opname</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.flex}>
            <FloatingLabelInput
              label="Barcode"
              value={barcode}
              onChangeText={onChangeBarcode}
              icon={<Barcode size={18} color={iconColor} />}
              onFocusCallback={onFieldFocus}
              editable={isEditable}
            />
          </View>
        </View>
      </View>

      {isEditable && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btn} onPress={onScanPress}>
            <Maximize size={16} color="#fff" />
            <Text style={styles.btnText}>SCAN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnAlt} onPress={onAutoGeneratePress}>
            <Zap size={16} color="#fff" />
            <Text style={styles.btnText}>AUTO</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 18 },
  imageSection: { marginBottom: 20, alignItems: 'center' },
  sectionLabel: {
    fontFamily: 'PoppinsBold',
    fontSize: 14,
    color: '#1E293B',
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
  imageBoxActive: { borderStyle: 'solid', borderColor: COLORS.primary },
  previewImage: { width: '100%', height: '100%' },
  placeholderContainer: { alignItems: 'center' },
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
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  flex: { flex: 1 },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 55,
    marginBottom: 15,
    paddingHorizontal: 12,
  },
  dropdownIcon: { marginRight: 8 },
  dropdown: { flex: 1, height: '100%' },
  placeholderStyle: {
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: 'PoppinsRegular',
  },
  selectedTextStyle: {
    fontSize: 14,
    color: '#1E293B',
    fontFamily: 'PoppinsMedium',
  },
  inputSearchStyle: { height: 40, fontSize: 14, borderRadius: 8 },
  addCategoryBtn: {
    padding: 5,
    marginLeft: 5,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  btnAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FF8A65',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  btnText: { color: '#fff', fontFamily: 'PoppinsBold', fontSize: 12 },
  stockInputWrapper: { position: 'relative', justifyContent: 'center' },
  stockStepper: { position: 'absolute', right: 10, top: 10, gap: 4 },
  stepperBtn: {
    backgroundColor: '#EFF6FF',
    width: 20,
    height: 20,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minusIcon: {
    width: 8,
    height: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
  },
  opnameBtn: { marginTop: -10, marginBottom: 10, alignSelf: 'flex-start' },
  opnameText: {
    fontSize: 10,
    fontFamily: 'PoppinsMedium',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});
