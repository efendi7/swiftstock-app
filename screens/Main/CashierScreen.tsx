import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput,
  Alert, ActivityIndicator, SafeAreaView, StatusBar, Platform, Modal, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../../services/firebaseConfig';
import { handleCheckoutProcess } from '../../services/transactionService';
import { 
  Scan, Trash2, Plus, Minus, CreditCard, PackageOpen, Lightbulb, X, Banknote, QrCode 
} from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { RoundedContentScreen } from '../../components/common/RoundedContentScreen';
import BarcodeScannerScreen from './BarcodeScannerScreen';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  stock: number;
}

interface CartItem extends Product {
  qty: number;
}

type PaymentMethod = 'cash' | 'qris';

const CashierScreen = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  // State untuk Modal Pembayaran
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [changeAmount, setChangeAmount] = useState(0);

  const calculateTotal = () => cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const getProductByBarcode = async (barcode: string) => {
    try {
      setLoading(true);
      const q = query(collection(db, 'products'), where('barcode', '==', barcode));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        Alert.alert('Produk Tidak Ada', 'Barcode tidak terdaftar.');
        return;
      }
      const docSnap = snapshot.docs[0];
      const product = { id: docSnap.id, ...docSnap.data() } as Product;
      addToCart(product);
    } catch (e) {
      Alert.alert('Error', 'Gagal memindai.');
    } finally {
      setLoading(false);
      setShowScanner(false);
    }
  };

  const addToCart = (product: Product) => {
    const exist = cart.find(i => i.id === product.id);
    if (exist) {
      if (exist.qty + 1 > product.stock) {
        Alert.alert('Stok Terbatas', `Sisa: ${product.stock}`);
        return;
      }
      setCart(cart.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      if (product.stock < 1) {
        Alert.alert('Stok Habis', 'Tidak tersedia.');
        return;
      }
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id: string, qty: number) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    if (qty > item.qty && qty > item.stock) {
      Alert.alert('Stok Tidak Cukup', `Maks: ${item.stock}`);
      return;
    }
    if (qty < 1) {
      Alert.alert('Hapus?', 'Hapus dari keranjang?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => setCart(cart.filter(i => i.id !== id)) }
      ]);
      return;
    }
    setCart(cart.map(i => i.id === id ? { ...i, qty } : i));
  };

  const handleCashChange = (text: string) => {
    const amount = parseInt(text.replace(/[^0-9]/g, '')) || 0;
    setCashAmount(text);
    setChangeAmount(amount - calculateTotal());
  };

  // ✅ FIXED: Mengirim 5 argumen ke service
  const onCheckout = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setLoading(true);

      // Konversi input tunai ke number
      const rawCash = parseInt(cashAmount.replace(/[^0-9]/g, '')) || 0;
      
      // Jika QRIS, otomatis uang pas (cash = total, kembalian = 0)
      const finalCash = paymentMethod === 'qris' ? calculateTotal() : rawCash;
      const finalChange = paymentMethod === 'qris' ? 0 : changeAmount;

      // Panggil handleCheckoutProcess dengan 5 argumen
      const result = await handleCheckoutProcess(
        cart, 
        calculateTotal(), 
        user, 
        finalCash, 
        finalChange,
        paymentMethod // Kirim metode pembayaran sebagai argumen ke-6 (opsional di service)
      );
      
      Alert.alert('Sukses', `Transaksi ${result.transactionNumber} berhasil!`, [
        { text: 'Selesai', onPress: () => {
          setCart([]);
          setShowPaymentModal(false);
          setCashAmount('');
          setChangeAmount(0);
          setPaymentMethod('cash');
        }}
      ]);
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Terjadi kesalahan transaksi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScreenHeader title="Kasir Digital" subtitle="Scan barcode untuk mulai transaksi" />

      <RoundedContentScreen>
        <View style={styles.mainActionRow}>
          <TouchableOpacity style={styles.scanButton} onPress={() => setShowScanner(true)}>
            <Scan size={24} color="#FFF" />
            <Text style={styles.scanButtonText}>Scan Produk</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBar}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Jenis Produk</Text>
            <Text style={styles.infoValue}>{cart.length}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Total Qty</Text>
            <Text style={styles.infoValue}>
              {cart.reduce((total, item) => total + item.qty, 0)}
            </Text>
          </View>
        </View>

        <FlatList
          data={cart}
          keyExtractor={i => i.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: cart.length > 0 ? 300 : 100 }]}
          renderItem={({ item }) => (
            <View style={styles.cartCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>Rp {item.price.toLocaleString('id-ID')}</Text>
              </View>
              <View style={styles.qtyContainer}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, item.qty - 1)}>
                  {item.qty === 1 ? <Trash2 size={16} color={COLORS.danger} /> : <Minus size={16} color={COLORS.primary} />}
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, item.qty + 1)}>
                  <Plus size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <PackageOpen size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>Keranjang masih kosong</Text>
            </View>
          }
        />

        {cart.length > 0 && (
          <View style={[
            styles.summaryContainer, 
            { paddingBottom: Math.max(insets.bottom, 20) }
          ]}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Pembayaran</Text>
              <Text style={styles.totalAmount}>Rp {calculateTotal().toLocaleString('id-ID')}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.checkoutButton, loading && styles.disabledBtn]} 
              onPress={() => setShowPaymentModal(true)}
              disabled={loading}
            >
              <View style={styles.btnContent}>
                <CreditCard size={20} color="#FFF" />
                <Text style={styles.checkoutText}>Bayar Sekarang</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.tipContainer}>
              <View style={styles.tipHeader}>
                <Lightbulb size={16} color={COLORS.secondary} />
                <Text style={styles.tipTitle}>Tips Kasir</Text>
              </View>
              <Text style={styles.tipText}>
                Pastikan jumlah barang sesuai dengan fisik sebelum menekan bayar.
              </Text>
            </View>
          </View>
        )}
      </RoundedContentScreen>

      {/* ================= PAYMENT MODAL ================= */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Metode Pembayaran</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Tipe Pembayaran Selector */}
              <View style={styles.methodSelector}>
                <TouchableOpacity 
                  style={[styles.methodBtn, paymentMethod === 'cash' && styles.methodBtnActive]}
                  onPress={() => setPaymentMethod('cash')}
                >
                  <Banknote size={20} color={paymentMethod === 'cash' ? '#FFF' : '#64748B'} />
                  <Text style={[styles.methodText, paymentMethod === 'cash' && styles.methodTextActive]}>Tunai</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.methodBtn, paymentMethod === 'qris' && styles.methodBtnActive]}
                  onPress={() => setPaymentMethod('qris')}
                >
                  <QrCode size={20} color={paymentMethod === 'qris' ? '#FFF' : '#64748B'} />
                  <Text style={[styles.methodText, paymentMethod === 'qris' && styles.methodTextActive]}>QRIS</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Total Tagihan</Text>
              <Text style={styles.bigTotal}>Rp {calculateTotal().toLocaleString('id-ID')}</Text>

              {paymentMethod === 'cash' ? (
                <>
                  <View style={styles.inputSection}>
                    <Text style={styles.label}>Uang Diterima (Cash)</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.currencyPrefix}>Rp</Text>
                      <TextInput
                        style={styles.cashInput}
                        keyboardType="numeric"
                        placeholder="0"
                        value={cashAmount}
                        onChangeText={handleCashChange}
                        autoFocus
                      />
                    </View>
                  </View>

                  <View style={styles.changeSection}>
                    <Text style={styles.label}>Kembalian</Text>
                    <Text style={[styles.changeValue, changeAmount < 0 && { color: COLORS.danger }]}>
                      Rp {changeAmount.toLocaleString('id-ID')}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.qrisContainer}>
                  <Image 
                    source={require('../../assets/images/qris.png')} // Pastikan file tersedia
                    style={styles.qrisImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.qrisHint}>Pelanggan silakan scan kode di atas</Text>
                </View>
              )}

              <TouchableOpacity 
                style={[
                    styles.confirmButton, 
                    paymentMethod === 'cash' && (changeAmount < 0 || !cashAmount) && styles.disabledBtn
                ]}
                onPress={onCheckout}
                disabled={loading || (paymentMethod === 'cash' && (changeAmount < 0 || !cashAmount))}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmButtonText}>Konfirmasi Pembayaran</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BarcodeScannerScreen
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={getProductByBarcode}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },
  mainActionRow: { paddingHorizontal: 20, paddingTop: 10, marginBottom: 15 },
  scanButton: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 15,
    elevation: 4,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 5,
  },
  scanButtonText: { color: '#FFF', fontSize: 16, fontFamily: 'PoppinsBold', marginLeft: 10 },
  listContent: { paddingHorizontal: 20 },
  cartCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontFamily: 'PoppinsBold', color: '#1E293B' },
  itemPrice: { fontSize: 13, color: COLORS.primary, fontFamily: 'PoppinsSemiBold' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 4 },
  qtyBtn: { padding: 8, backgroundColor: '#FFF', borderRadius: 8, elevation: 1 },
  qtyText: { fontSize: 15, fontFamily: 'PoppinsBold', color: '#1E293B', marginHorizontal: 15, minWidth: 20, textAlign: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 10, color: '#94A3B8', fontFamily: 'PoppinsMedium', fontSize: 16 },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  infoItem: { alignItems: 'center' },
  infoLabel: { fontSize: 10, color: '#64748B', fontFamily: 'PoppinsRegular' },
  infoValue: { fontSize: 14, color: COLORS.primary, fontFamily: 'PoppinsBold' },
  summaryContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 20,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    elevation: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalLabel: { fontSize: 14, color: '#64748B', fontFamily: 'PoppinsMedium' },
  totalAmount: { fontSize: 20, color: COLORS.secondary, fontFamily: 'PoppinsBold' },
  checkoutButton: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 16 },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  disabledBtn: { backgroundColor: '#CBD5E1' },
  checkoutText: { color: '#FFF', fontSize: 16, fontFamily: 'PoppinsBold' },
  tipContainer: {
    marginTop: 16,
    backgroundColor: '#F0FDF4', 
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    flexDirection: 'column',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tipTitle: {
    fontSize: 11,
    fontFamily: 'PoppinsBold',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipText: {
    fontSize: 11,
    fontFamily: 'PoppinsRegular',
    color: '#15803D',
    lineHeight: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  paymentModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'PoppinsBold',
    color: '#1E293B',
  },
  modalBody: {
    padding: 24,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  methodBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  methodText: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#64748B',
  },
  methodTextActive: {
    color: '#FFF',
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'PoppinsMedium',
    marginBottom: 4,
  },
  bigTotal: {
    fontSize: 28,
    fontFamily: 'PoppinsBold',
    color: COLORS.primary,
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 15,
  },
  currencyPrefix: {
    fontSize: 18,
    fontFamily: 'PoppinsBold',
    color: '#1E293B',
    marginRight: 5,
  },
  cashInput: {
    flex: 1,
    height: 56,
    fontSize: 20,
    fontFamily: 'PoppinsBold',
    color: '#1E293B',
  },
  changeSection: {
    backgroundColor: '#F0F9FF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 24,
  },
  changeValue: {
    fontSize: 22,
    fontFamily: 'PoppinsBold',
    color: COLORS.secondary,
  },
  qrisContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
  },
  qrisImage: {
    width: 200,
    height: 200,
  },
  qrisHint: {
    marginTop: 10,
    fontSize: 12,
    fontFamily: 'PoppinsMedium',
    color: '#64748B',
  },
  confirmButton: {
    backgroundColor: COLORS.secondary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'PoppinsBold',
  },
});

export default CashierScreen;