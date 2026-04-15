import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal,
  TouchableOpacity, ActivityIndicator, Animated,
} from 'react-native';
import { X, Save, Edit3, Lock, Box, Package, ClipboardList } from 'lucide-react-native';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { COLORS } from '@constants/colors';
import { db, auth } from '@services/firebaseConfig';
import { useProductForm } from '@hooks/useProductForm';
import { ProductFormFields } from '@components/addproduct/ProductFormFields';
import { AddCategoryModal } from './AddCategoryModal.web';
import { StockOpnameModal } from './StockOpnameModal.web';
import { ProductService } from '@services/productService';
import { Product } from '@/types/product.types';

const PRIMARY = '#1C3A5A';

interface Props {
  visible:   boolean;
  product:   Product | null;
  tenantId:  string | null;
  onClose:   () => void;
  onSuccess?: () => void;
  userRole:  'admin' | 'kasir';
}

const EditProductModalWeb: React.FC<Props> = ({
  visible, product, tenantId, onClose, onSuccess, userRole,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const [isEditable,        setIsEditable]        = useState(false);
  const [categories,        setCategories]        = useState<{ label: string; value: string }[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOpnameModal,   setShowOpnameModal]   = useState(false);
  const loadedId       = useRef<string | null>(null);
  const handleCloseRef = useRef<() => void>(() => {});

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim   = useRef(new Animated.Value(0.96)).current;

  const {
    formData, loading, imageUri, errorMsg,
    updateField, handleSubmit,
    pickImage, removeImage, resetForm, setInitialData,
  } = useProductForm(tenantId, () => { onSuccess?.(); handleCloseRef.current(); }, product?.id);

  const loadCategories = useCallback(async () => {
    if (!tenantId) return;
    try { setCategories(await ProductService.getCategories(tenantId)); }
    catch { setCategories([{ label: 'Umum', value: 'umum' }]); }
  }, [tenantId]);

  useEffect(() => {
    if (visible) {
      loadCategories();
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim,   { toValue: 1, friction: 8, tension: 100, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(scaleAnim,   { toValue: 0.96, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (visible && product && product.id !== loadedId.current) {
      setInitialData({
        name: product.name, price: product.price.toString(),
        purchasePrice: product.purchasePrice.toString(), stock: product.stock.toString(),
        barcode: product.barcode, supplier: product.supplier || '',
        category: product.category || '', imageUrl: product.imageUrl || '',
      }, product.imageUrl || null);
      loadedId.current = product.id;
    }
    if (!visible) { loadedId.current = null; setIsEditable(false); }
  }, [visible, product, setInitialData]);

  const handleSaveOpname = async (physicalStock: number, reason: string) => {
    if (!tenantId || !product?.id) return;
    const productRef  = doc(db, 'tenants', tenantId, 'products', product.id);
    const activityCol = collection(db, 'tenants', tenantId, 'activities');
    const systemStock = parseInt(formData.stock || '0');
    const diff        = physicalStock - systemStock;
    const user        = auth.currentUser;
    await updateDoc(productRef, { stock: physicalStock, lastOpname: serverTimestamp(), updatedAt: serverTimestamp() });
    await addDoc(activityCol, {
      type: 'UPDATE',
      message: `Stock Opname "${formData.name}": Sistem ${systemStock} → Fisik ${physicalStock} (Selisih: ${diff > 0 ? '+' : ''}${diff}). Alasan: ${reason || '-'}`,
      userName: user?.displayName || user?.email?.split('@')[0] || 'Admin',
      userId: user?.uid, createdAt: serverTimestamp(),
    });
    updateField('stock', physicalStock.toString());
    onSuccess?.();
  };

  const handleAddCategory = async (name: string) => {
    if (!tenantId) return;
    await ProductService.addCategory(tenantId, name);
    await loadCategories();
    updateField('category', name);
  };

  const resetToOriginal = () => {
    if (product) {
      setInitialData({
        name: product.name, price: product.price.toString(),
        purchasePrice: product.purchasePrice.toString(), stock: product.stock.toString(),
        barcode: product.barcode, supplier: product.supplier || '',
        category: product.category || '', imageUrl: product.imageUrl || '',
      }, product.imageUrl || null);
    }
    setIsEditable(false);
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(scaleAnim,   { toValue: 0.96, duration: 160, useNativeDriver: true }),
    ]).start(() => { resetForm(); setIsEditable(false); onClose(); });
  };
  handleCloseRef.current = handleClose;

  if (!visible) return null;

  return (
    <>
      <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
        <Animated.View style={[s.overlay, { opacity: opacityAnim }]}>
          <TouchableOpacity style={s.backdrop} onPress={handleClose} activeOpacity={1} />

          <Animated.View style={[s.container, { transform: [{ scale: scaleAnim }] }]}>

            {/* HEADER */}
            <View style={[s.header, isEditable && s.headerEdit]}>
              <View style={s.headerLeft}>
                <View style={s.headerIcon}>
                  {isEditable ? <Edit3 size={18} color="#FFF" /> : <Box size={18} color="#FFF" />}
                </View>
                <View>
                  <Text style={s.headerSub}>{isEditable ? 'Mode Edit' : 'Informasi Produk'}</Text>
                  <Text style={s.headerTitle} numberOfLines={1}>
                    {isEditable ? 'Edit Produk' : (product?.name || 'Detail Produk')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
                <X size={18} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* BODY — 2 kolom */}
            <View style={s.body}>

              {/* KIRI — form */}
              <View style={s.leftCol}>
                <View style={s.colHeader}>
                  <ClipboardList size={13} color={PRIMARY} />
                  <Text style={s.colHeaderText}>Data Produk</Text>
                </View>
                <ScrollView ref={scrollRef} style={s.formScroll} contentContainerStyle={s.formContent} showsVerticalScrollIndicator={false}>
                  <ProductFormFields
                    isEditable={isEditable}
                    name={formData.name}           price={formData.price}
                    purchasePrice={formData.purchasePrice} supplier={formData.supplier}
                    category={formData.category}   categories={categories}
                    stock={formData.stock}         barcode={formData.barcode}
                    imageUri={imageUri}
                    onChangeName={(v)          => updateField('name', v)}
                    onChangePrice={(v)         => updateField('price', v)}
                    onChangePurchasePrice={(v) => updateField('purchasePrice', v)}
                    onChangeSupplier={(v)      => updateField('supplier', v)}
                    onChangeCategory={(v)      => updateField('category', v)}
                    onChangeStock={(v)         => updateField('stock', v)}
                    onChangeBarcode={(v)       => updateField('barcode', v)}
                    onPickImage={pickImage}    onRemoveImage={removeImage}
                    onScanPress={() => {}}
                    onAutoGeneratePress={() => updateField('barcode', ProductService.generateUniqueBarcode('EAN13'))}
                    onAddCategoryPress={() => setShowCategoryModal(true)}
                    onStockOpname={() => setShowOpnameModal(true)}
                    onFieldFocus={(y) => scrollRef.current?.scrollTo({ y: y - 60, animated: true })}
                  />
                </ScrollView>
              </View>

              <View style={s.colDivider} />

              {/* KANAN — ringkasan saja, tanpa tombol Stock Opname (sudah ada di form) */}
              <View style={s.rightCol}>
                <View style={s.colHeader}>
                  <Package size={13} color={PRIMARY} />
                  <Text style={s.colHeaderText}>Ringkasan</Text>
                </View>

                <View style={s.infoCard}>
                  <InfoRow label="Nama"     value={formData.name     || '—'} />
                  <Sep />
                  <InfoRow label="Kategori" value={formData.category || '—'} />
                  <Sep />
                  <InfoRow label="Supplier" value={formData.supplier || '—'} />
                  <Sep />
                  <InfoRow label="Barcode"  value={formData.barcode  || '—'} />
                </View>

                <View style={s.infoCard}>
                  <InfoRow label="Harga Jual"
                    value={`Rp ${parseInt(formData.price || '0').toLocaleString('id-ID')}`}
                    valueColor={PRIMARY} bold
                  />
                  <Sep />
                  <InfoRow label="Harga Beli"
                    value={`Rp ${parseInt(formData.purchasePrice || '0').toLocaleString('id-ID')}`}
                  />
                  <Sep />
                  <InfoRow label="Stok"
                    value={`${formData.stock || '0'} unit`}
                    valueColor={parseInt(formData.stock || '0') <= 10 ? '#EF4444' : '#10B981'} bold
                  />
                </View>
              </View>
            </View>

            {/* FOOTER */}
            <View style={[s.footer, isEditable ? s.footerEdit : s.footerView]}>
              {errorMsg && isEditable && (
                <View style={s.errorBanner}>
                  <Text style={s.errorText}>⚠ {errorMsg}</Text>
                </View>
              )}
              {!isEditable ? (
                userRole === 'admin' ? (
                  <TouchableOpacity style={s.editBtn} onPress={() => setIsEditable(true)} activeOpacity={0.8}>
                    <Edit3 size={16} color="#FFF" />
                    <Text style={s.footerBtnText}>Edit Produk</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={s.readOnlyRow}>
                    <Lock size={14} color="#94A3B8" />
                    <Text style={s.readOnlyText}>Akses Terbatas (Kasir)</Text>
                  </View>
                )
              ) : (
                <View style={s.footerEditRow}>
                  <View>
                    <Text style={s.footerPriceLabel}>Harga Jual</Text>
                    <Text style={s.footerPriceValue}>
                      Rp {parseInt(formData.price || '0').toLocaleString('id-ID')}
                    </Text>
                  </View>
                  <View style={s.footerBtns}>
                    <TouchableOpacity style={s.cancelBtn} onPress={resetToOriginal}>
                      <Text style={s.cancelBtnText}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.saveBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
                      {loading
                        ? <ActivityIndicator color="#FFF" size="small" />
                        : <><Save size={15} color="#FFF" /><Text style={s.footerBtnText}>Simpan</Text></>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

          </Animated.View>
        </Animated.View>
      </Modal>

      <AddCategoryModal visible={showCategoryModal} onClose={() => setShowCategoryModal(false)} onAdd={handleAddCategory} />
      <StockOpnameModal visible={showOpnameModal} onClose={() => setShowOpnameModal(false)}
        currentStock={parseInt(formData.stock || '0')} productName={formData.name} onSave={handleSaveOpname} />
    </>
  );
};

const Sep = () => <View style={s.sep} />;
const InfoRow = ({ label, value, valueColor, bold }: { label: string; value: string; valueColor?: string; bold?: boolean }) => (
  <View style={s.infoRow}>
    <Text style={s.infoLabel}>{label}</Text>
    <Text style={[s.infoValue, valueColor ? { color: valueColor } : {}, bold ? { fontFamily: 'PoppinsBold' } : {}]} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

const s = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  backdrop:  { ...StyleSheet.absoluteFillObject },
  container: { width: 820, maxWidth: '94%' as any, maxHeight: '90%' as any, borderRadius: 20, overflow: 'hidden', backgroundColor: '#FFF', flexDirection: 'column' },

  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: PRIMARY },
  headerEdit: { backgroundColor: '#2C537A' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerSub:  { fontSize: 10, fontFamily: 'PoppinsMedium', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' as any, letterSpacing: 0.5 },
  headerTitle:{ fontSize: 15, fontFamily: 'PoppinsBold', color: '#FFF', marginTop: 1 },
  closeBtn:   { width: 32, height: 32, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  body:       { flex: 1, flexDirection: 'row', overflow: 'hidden' as any, minHeight: 0 as any },
  leftCol:    { flex: 1, flexDirection: 'column', padding: 16, overflow: 'hidden' as any },
  colDivider: { width: 1, backgroundColor: '#F1F5F9' },
  rightCol:   { width: 240, padding: 14, flexDirection: 'column', gap: 10 },

  colHeader:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  colHeaderText: { fontSize: 12, fontFamily: 'PoppinsBold', color: PRIMARY },
  formScroll:    { flex: 1 },
  formContent:   { paddingBottom: 8 },

  infoCard:  { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  sep:       { height: 1, backgroundColor: '#E2E8F0' },
  infoRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  infoLabel: { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#64748B' },
  infoValue: { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#1E293B', textAlign: 'right' as any, flex: 1, marginLeft: 8 },

  footer:     { paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  footerView: { backgroundColor: '#FFF' },
  footerEdit: { backgroundColor: PRIMARY },

  errorBanner: { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 10 },
  errorText:   { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#FCA5A5' },

  editBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: PRIMARY, paddingVertical: 10, borderRadius: 10 },
  readOnlyRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F1F5F9', paddingVertical: 10, borderRadius: 10 },
  readOnlyText: { fontSize: 13, fontFamily: 'PoppinsMedium', color: '#94A3B8' },

  footerEditRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  footerPriceLabel:{ fontSize: 11, fontFamily: 'PoppinsRegular', color: 'rgba(255,255,255,0.7)' },
  footerPriceValue:{ fontSize: 20, fontFamily: 'PoppinsBold', color: '#FFF' },
  footerBtns:      { flexDirection: 'row', gap: 8 },
  cancelBtn:       { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  cancelBtnText:   { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: 'rgba(255,255,255,0.85)' },
  saveBtn:         { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)' },
  footerBtnText:   { fontSize: 13, fontFamily: 'PoppinsBold', color: '#FFF' },
});

export default EditProductModalWeb;