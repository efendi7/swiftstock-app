import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import {
  Tag, HandCoins, Layers, Barcode, Coins,
  Truck, LayoutGrid, Maximize, Camera, X, Plus, Zap,
} from 'lucide-react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { COLORS } from '../../constants/colors';
import FloatingLabelInput from '../FloatingLabelInput';

export interface ProductFormFieldsProps {
  name: string; price: string; purchasePrice: string;
  supplier: string; category: string; stock: string; barcode: string;
  imageUri: string | null;
  categories: { label: string; value: string }[];
  onChangeName: (t: string) => void; onChangePrice: (t: string) => void;
  onChangePurchasePrice: (t: string) => void; onChangeSupplier: (t: string) => void;
  onChangeCategory: (t: string) => void; onChangeStock: (t: string) => void;
  onChangeBarcode: (t: string) => void;
  onPickImage: () => void; onRemoveImage: () => void;
  onScanPress: () => void; onAutoGeneratePress: () => void;
  onAddCategoryPress: () => void;
  onStockOpname: () => void;
  onFieldFocus?: (y: number) => void;
  isEditable?: boolean;
}

export const ProductFormFields: React.FC<ProductFormFieldsProps> = ({
  name, price, purchasePrice, supplier, category, stock, barcode,
  imageUri, categories,
  onChangeName, onChangePrice, onChangePurchasePrice, onChangeSupplier,
  onChangeCategory, onChangeStock, onChangeBarcode,
  onPickImage, onRemoveImage, onScanPress, onAutoGeneratePress,
  onAddCategoryPress, onStockOpname, onFieldFocus,
  isEditable = true,
}) => {
  const iconColor = isEditable ? COLORS.primary : '#94A3B8';
  const [isFocus, setIsFocus] = useState(false);

  return (
    <View style={s.root}>

      {/* ── Baris 1: Foto + Nama produk ── */}
      <View style={s.photoRow}>
        <TouchableOpacity
          style={[s.imageBox, imageUri && s.imageBoxActive, !isEditable && s.imageBoxDisabled]}
          onPress={isEditable ? onPickImage : undefined}
          activeOpacity={isEditable ? 0.7 : 1}
        >
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={s.previewImage} />
              {isEditable && (
                <TouchableOpacity style={s.removeImg} onPress={onRemoveImage}>
                  <X size={11} color="#fff" />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={s.imgPlaceholder}>
              <Camera size={16} color={iconColor} />
              <Text style={[s.imgLabel, !isEditable && { color: '#94A3B8' }]}>
                {isEditable ? 'Foto' : 'Kosong'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Nama Produk *"
            value={name}
            onChangeText={onChangeName}
            icon={<Tag size={14} color={iconColor} />}
            onFocusCallback={onFieldFocus}
            editable={isEditable}
          />
        </View>
      </View>

      {/* ── Grid 2: Harga Jual | Harga Beli ── */}
      <View style={s.row}>
        <View style={s.col}>
          <FloatingLabelInput
            label="Harga Jual *"
            value={price}
            onChangeText={onChangePrice}
            keyboardType="numeric"
            icon={<HandCoins size={14} color={iconColor} />}
            onFocusCallback={onFieldFocus}
            editable={isEditable}
          />
        </View>
        <View style={s.col}>
          <FloatingLabelInput
            label="Harga Beli *"
            value={purchasePrice}
            onChangeText={onChangePurchasePrice}
            keyboardType="numeric"
            icon={<Coins size={14} color={iconColor} />}
            onFocusCallback={onFieldFocus}
            editable={isEditable}
          />
        </View>
      </View>

      {/* ── Grid 2: Stok | Barcode ── */}
      <View style={s.row}>
        <View style={s.col}>
          <View style={s.stockWrap}>
            <FloatingLabelInput
              label="Stok *"
              value={stock}
              onChangeText={onChangeStock}
              keyboardType="numeric"
              icon={<Layers size={14} color={iconColor} />}
              onFocusCallback={onFieldFocus}
              editable={isEditable}
            />
            {isEditable && (
              <View style={s.stepper}>
                <TouchableOpacity style={s.stepBtn}
                  onPress={() => onChangeStock((parseInt(stock || '0') + 1).toString())}>
                  <Plus size={10} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={s.stepBtn}
                  onPress={() => onChangeStock(Math.max(0, parseInt(stock || '0') - 1).toString())}>
                  <View style={s.minusLine} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        <View style={s.col}>
          <FloatingLabelInput
            label="Barcode *"
            value={barcode}
            onChangeText={onChangeBarcode}
            icon={<Barcode size={14} color={iconColor} />}
            onFocusCallback={onFieldFocus}
            editable={isEditable}
          />
        </View>
      </View>

      {/* ── Grid 2: Kategori | Pemasok ── */}
      <View style={s.row}>
        <View style={s.col}>
          <View style={[s.dropWrap, isFocus && s.dropWrapFocus]}>
            <LayoutGrid size={14} color={isFocus ? COLORS.primary : iconColor} style={{ marginRight: 6 }} />
            <Dropdown
              style={s.drop}
              placeholderStyle={s.dropPlaceholder}
              selectedTextStyle={s.dropSelected}
              inputSearchStyle={s.dropSearch}
              data={categories}
              search
              maxHeight={240}
              labelField="label"
              valueField="value"
              placeholder="Kategori *"
              searchPlaceholder="Cari..."
              value={category}
              onFocus={() => setIsFocus(true)}
              onBlur={() => setIsFocus(false)}
              onChange={item => { onChangeCategory(item.value); setIsFocus(false); }}
              disable={!isEditable}
            />
            {isEditable && (
              <TouchableOpacity style={s.addCatBtn} onPress={onAddCategoryPress}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Plus size={14} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={s.col}>
          <FloatingLabelInput
            label="Pemasok"
            value={supplier}
            onChangeText={onChangeSupplier}
            icon={<Truck size={14} color={iconColor} />}
            onFocusCallback={onFieldFocus}
            editable={isEditable}
          />
        </View>
      </View>

      {/* ── Action row: Stock Opname (kiri) | Scan + Auto (kanan) ── */}
      {isEditable && (
        <View style={s.actions}>
          <TouchableOpacity style={s.btnOpname} onPress={onStockOpname}>
            <Text style={s.btnOpnameText}>Stock Opname</Text>
          </TouchableOpacity>
          <View style={s.actRight}>
            <TouchableOpacity style={s.btnScan} onPress={onScanPress}>
              <Maximize size={12} color="#fff" />
              <Text style={s.btnText}>Scan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnAuto} onPress={onAutoGeneratePress}>
              <Zap size={12} color="#fff" />
              <Text style={s.btnText}>Auto</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root: { gap: 0 },

  // Foto + nama
  photoRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  imageBox:       { width: 62, height: 62, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', flexShrink: 0 },
  imageBoxActive: { borderStyle: 'solid', borderColor: COLORS.primary },
  imageBoxDisabled:{ backgroundColor: '#F1F5F9' },
  previewImage:   { width: '100%', height: '100%' },
  imgPlaceholder: { alignItems: 'center', gap: 2 },
  imgLabel:       { fontSize: 9, fontFamily: 'PoppinsMedium', color: COLORS.primary },
  removeImg:      { position: 'absolute', top: 3, right: 3, backgroundColor: 'rgba(239,68,68,0.85)', padding: 3, borderRadius: 6 },

  // Grid
  row: { flexDirection: 'row', gap: 8 },
  col: { flex: 1 },

  // Stok stepper
  stockWrap: { position: 'relative' },
  stepper:   { position: 'absolute', right: 8, top: 8, gap: 3, zIndex: 1 },
  stepBtn:   { width: 17, height: 17, borderRadius: 5, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  minusLine: { width: 7, height: 1.5, backgroundColor: COLORS.primary, borderRadius: 1 },

  // Dropdown
  dropWrap:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', height: 44, marginBottom: 8, paddingHorizontal: 10 },
  dropWrapFocus: { borderColor: COLORS.primary },
  drop:          { flex: 1, height: '100%' },
  dropPlaceholder:{ fontSize: 12, color: '#94A3B8', fontFamily: 'PoppinsRegular' },
  dropSelected:  { fontSize: 12, color: '#1E293B', fontFamily: 'PoppinsMedium' },
  dropSearch:    { height: 34, fontSize: 12, borderRadius: 8 },
  addCatBtn:     { padding: 4, backgroundColor: '#EFF6FF', borderRadius: 7, marginLeft: 4 },

  // Actions
  actions:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, marginBottom: 4 },
  actRight:      { flexDirection: 'row', gap: 6 },
  btnOpname:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: `${COLORS.primary}30`, backgroundColor: `${COLORS.primary}08` },
  btnOpnameText: { fontSize: 11, fontFamily: 'PoppinsSemiBold', color: COLORS.primary },
  btnScan:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.secondary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  btnAuto:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FF8A65', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  btnText:       { color: '#fff', fontFamily: 'PoppinsBold', fontSize: 11 },
});