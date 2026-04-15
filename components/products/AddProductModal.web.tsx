/**
 * AddProductModal.web.tsx — web only
 * Logic (state form, submit, barcode, image) via useProductForm.
 * Komponen ini hanya render layout 2 kolom + animasi.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal,
  TouchableOpacity, ActivityIndicator, Animated,
} from 'react-native';
import { X, Save, Plus, Package, ClipboardList } from 'lucide-react-native';
import { ProductFormFields }  from '@components/addproduct/ProductFormFields';
import { AddCategoryModal }   from './AddCategoryModal.web';
import { ProductService }     from '@services/productService';
import { useProductForm }     from '@hooks/useProductForm';

const PRIMARY = '#1C3A5A';

interface Props {
  visible: boolean; onClose: () => void; onSuccess: () => void;
  categories: { label: string; value: string }[]; tenantId: string | null;
}

export const AddProductModalWeb: React.FC<Props> = ({
  visible, onClose, onSuccess, categories: initCats, tenantId,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [localCats,    setLocalCats]    = useState(initCats);

  const {
    formData, loading, errorMsg,
    updateField, generateBarcode, pickImage, removeImage,
    handleSubmit, resetForm,
  } = useProductForm(tenantId, () => { handleClose(); onSuccess(); });

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim   = useRef(new Animated.Value(0.96)).current;

  useEffect(() => { setLocalCats(initCats); }, [initCats]);

  useEffect(() => {
    const toValue = visible ? 1 : 0;
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue, duration: visible ? 200 : 160, useNativeDriver: true }),
      Animated.spring(scaleAnim,   { toValue: visible ? 1 : 0.96, friction: 8, tension: 100, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(scaleAnim,   { toValue: 0.96, duration: 160, useNativeDriver: true }),
    ]).start(() => { resetForm(); onClose(); });
  };

  const handleAddCategory = async (catName: string) => {
    if (!tenantId) return;
    await ProductService.addCategory(tenantId, catName);
    const updated = await ProductService.getCategories(tenantId);
    setLocalCats(updated);
    updateField('category', catName);
  };

  if (!visible) return null;

  const { name, price, purchasePrice, supplier, category, stock, barcode, imageUrl } = formData;
  const isFormFilled = name && price && purchasePrice && barcode && category;

  return (
    <>
      <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
        <Animated.View style={[s.overlay, { opacity: opacityAnim }]}>
          <TouchableOpacity style={s.backdrop} onPress={handleClose} activeOpacity={1} />

          <Animated.View style={[s.container, { transform: [{ scale: scaleAnim }] }]}>

            {/* Header */}
            <View style={s.header}>
              <View style={s.headerLeft}>
                <View style={s.headerIcon}><Plus size={18} color="#FFF" /></View>
                <View>
                  <Text style={s.headerSub}>Manajemen Produk</Text>
                  <Text style={s.headerTitle}>Tambah Produk Baru</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleClose} style={s.closeBtn}><X size={18} color="#FFF" /></TouchableOpacity>
            </View>

            {/* Error banner */}
            {!!errorMsg && (
              <View style={s.errorBanner}><Text style={s.errorBannerText}>{errorMsg}</Text></View>
            )}

            {/* Body — 2 kolom */}
            <View style={s.body}>

              {/* Kiri — form */}
              <View style={s.leftCol}>
                <View style={s.colHeader}>
                  <ClipboardList size={13} color={PRIMARY} />
                  <Text style={s.colHeaderText}>Data Produk</Text>
                </View>
                <ScrollView ref={scrollRef} style={s.formScroll} contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
                  <ProductFormFields
                    isEditable
                    name={name}               price={price}
                    purchasePrice={purchasePrice} supplier={supplier}
                    category={category}       categories={localCats}
                    stock={stock}             barcode={barcode}
                    imageUri={imageUrl || null}
                    onChangeName={v => updateField('name', v)}
                    onChangePrice={v => updateField('price', v)}
                    onChangePurchasePrice={v => updateField('purchasePrice', v)}
                    onChangeSupplier={v => updateField('supplier', v)}
                    onChangeCategory={v => updateField('category', v)}
                    onChangeStock={v => updateField('stock', v)}
                    onChangeBarcode={v => updateField('barcode', v)}
                    onPickImage={pickImage}
                    onRemoveImage={removeImage}
                    onScanPress={() => {}}
                    onAutoGeneratePress={() => generateBarcode('EAN13')}
                    onAddCategoryPress={() => setShowCatModal(true)}
                    onStockOpname={() => {}}
                    onFieldFocus={y => scrollRef.current?.scrollTo({ y: y - 60, animated: true })}
                  />
                </ScrollView>
              </View>

              <View style={s.colDivider} />

              {/* Kanan — preview */}
              <View style={s.rightCol}>
                <View style={s.colHeader}>
                  <Package size={13} color={PRIMARY} />
                  <Text style={s.colHeaderText}>Preview</Text>
                </View>

                <View style={s.infoCard}>
                  <InfoRow label="Nama"     value={name     || '—'} />
                  <Sep />
                  <InfoRow label="Kategori" value={category || '—'} />
                  <Sep />
                  <InfoRow label="Supplier" value={supplier || '—'} />
                  <Sep />
                  <InfoRow label="Barcode"  value={barcode  || '—'} />
                </View>

                <View style={s.infoCard}>
                  <InfoRow label="Harga Jual" value={price ? `Rp ${parseInt(price).toLocaleString('id-ID')}` : '—'} valueColor={price ? PRIMARY : undefined} bold={!!price} />
                  <Sep />
                  <InfoRow label="Harga Beli" value={purchasePrice ? `Rp ${parseInt(purchasePrice).toLocaleString('id-ID')}` : '—'} />
                  <Sep />
                  <InfoRow label="Stok Awal"  value={`${stock || '0'} unit`} valueColor="#10B981" bold />
                </View>

                {price && purchasePrice && (
                  <View style={s.marginCard}>
                    <Text style={s.marginLabel}>Estimasi Margin</Text>
                    <Text style={s.marginValue}>
                      {(((parseInt(price) - parseInt(purchasePrice)) / parseInt(price)) * 100).toFixed(1)}%
                    </Text>
                    <Text style={s.marginSub}>
                      Rp {(parseInt(price) - parseInt(purchasePrice)).toLocaleString('id-ID')} / produk
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Footer */}
            <View style={[s.footer, isFormFilled ? s.footerFilled : s.footerEmpty]}>
              <View style={s.footerRow}>
                <View>
                  <Text style={s.footerPriceLabel}>Harga Jual</Text>
                  <Text style={[s.footerPriceValue, !price && { color: 'rgba(255,255,255,0.4)' }]}>
                    {price ? `Rp ${parseInt(price).toLocaleString('id-ID')}` : 'Belum diisi'}
                  </Text>
                </View>
                <View style={s.footerBtns}>
                  <TouchableOpacity style={s.cancelBtn} onPress={handleClose}>
                    <Text style={s.cancelBtnText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.saveBtn, (!isFormFilled || loading) && { opacity: 0.5 }]}
                    onPress={handleSubmit}
                    disabled={!isFormFilled || loading}
                  >
                    {loading
                      ? <ActivityIndicator color="#FFF" size="small" />
                      : <><Save size={15} color="#FFF" /><Text style={s.footerBtnText}>Simpan Produk</Text></>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            </View>

          </Animated.View>
        </Animated.View>
      </Modal>

      <AddCategoryModal visible={showCatModal} onClose={() => setShowCatModal(false)} onAdd={handleAddCategory} />
    </>
  );
};

// ── Sub-components ────────────────────────────────────────

const Sep     = () => <View style={s.sep} />;
const InfoRow = ({ label, value, valueColor, bold }: { label: string; value: string; valueColor?: string; bold?: boolean }) => (
  <View style={s.infoRow}>
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={[s.infoValue, valueColor ? { color: valueColor } : {}, bold ? { fontFamily: 'PoppinsBold' } : {}]} numberOfLines={2}>{value}</Text>
  </View>
);

// ── Styles ────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  backdrop:  { ...StyleSheet.absoluteFillObject },
  container: { width: 820, maxWidth: '94%' as any, maxHeight: '90%' as any, borderRadius: 20, overflow: 'hidden', backgroundColor: '#FFF', flexDirection: 'column' },
  errorBanner:    { backgroundColor: '#FEE2E2', padding: 10, paddingHorizontal: 20 },
  errorBannerText:{ fontSize: 12, fontFamily: 'PoppinsMedium', color: '#DC2626' },

  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: PRIMARY },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerSub:  { fontSize: 10, fontFamily: 'PoppinsMedium', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' as any, letterSpacing: 0.5 },
  headerTitle:{ fontSize: 15, fontFamily: 'PoppinsBold', color: '#FFF', marginTop: 1 },
  closeBtn:   { width: 32, height: 32, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  body:       { flex: 1, flexDirection: 'row', overflow: 'hidden' as any, minHeight: 0 as any },
  leftCol:    { flex: 1, flexDirection: 'column', padding: 16, overflow: 'hidden' as any },
  colDivider: { width: 1, backgroundColor: '#F1F5F9' },
  rightCol:   { width: 256, padding: 14, flexDirection: 'column', gap: 10 },
  colHeader:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  colHeaderText: { fontSize: 12, fontFamily: 'PoppinsBold', color: PRIMARY },
  formScroll:    { flex: 1 },

  infoCard:  { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  sep:       { height: 1, backgroundColor: '#E2E8F0' },
  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  infoLabel: { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#64748B' },
  infoValue: { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#1E293B', textAlign: 'right' as any, flex: 1, marginLeft: 8 },

  marginCard:  { backgroundColor: `${PRIMARY}08`, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: `${PRIMARY}20`, alignItems: 'center' },
  marginLabel: { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#64748B', marginBottom: 4 },
  marginValue: { fontSize: 28, fontFamily: 'PoppinsBold', color: PRIMARY },
  marginSub:   { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 2 },

  footer:          { paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  footerFilled:    { backgroundColor: PRIMARY },
  footerEmpty:     { backgroundColor: '#475569' },
  footerRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  footerPriceLabel:{ fontSize: 11, fontFamily: 'PoppinsRegular', color: 'rgba(255,255,255,0.7)' },
  footerPriceValue:{ fontSize: 20, fontFamily: 'PoppinsBold', color: '#FFF' },
  footerBtns:      { flexDirection: 'row', gap: 8 },
  cancelBtn:       { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  cancelBtnText:   { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: 'rgba(255,255,255,0.85)' },
  saveBtn:         { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)' },
  footerBtnText:   { fontSize: 13, fontFamily: 'PoppinsBold', color: '#FFF' },
});

export default AddProductModalWeb;