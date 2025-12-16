import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { db, auth } from '../../services/firebaseConfig';
import { collection, query, where, getDocs, doc, runTransaction } from 'firebase/firestore';
import BarcodeScannerScreen from './BarcodeScannerScreen';

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

const CashierScreen = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fungsi untuk mencari produk berdasarkan barcode
  const getProductByBarcode = async (barcode: string) => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'products'),
        where('barcode', '==', barcode)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('Error', 'Produk tidak ditemukan!');
        return;
      }

      const productDoc = querySnapshot.docs[0];
      const product = {
        id: productDoc.id,
        ...productDoc.data(),
      } as Product;

      addToCart(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Gagal mengambil data produk');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk menambahkan produk ke keranjang
  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      // Cek stok
      if (existingItem.qty + 1 > product.stock) {
        Alert.alert('Error', 'Stok tidak mencukupi!');
        return;
      }

      // Update qty
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, qty: item.qty + 1 }
          : item
      ));
    } else {
      // Tambah produk baru
      if (product.stock < 1) {
        Alert.alert('Error', 'Stok habis!');
        return;
      }

      setCart([...cart, { ...product, qty: 1 }]);
    }

    Alert.alert('Berhasil', `${product.name} ditambahkan ke keranjang`);
  };

  // Fungsi untuk mengubah qty item
  const updateQty = (productId: string, newQty: number) => {
    const item = cart.find(i => i.id === productId);
    
    if (!item) return;

    if (newQty < 1) {
      removeFromCart(productId);
      return;
    }

    if (newQty > item.stock) {
      Alert.alert('Error', 'Qty melebihi stok!');
      return;
    }

    setCart(cart.map(i =>
      i.id === productId ? { ...i, qty: newQty } : i
    ));
  };

  // Fungsi untuk menghapus item dari keranjang
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  // Fungsi untuk menghitung total
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  };

  // Fungsi checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Error', 'Keranjang masih kosong!');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'User tidak terautentikasi!');
      return;
    }

    try {
      setLoading(true);

      await runTransaction(db, async (transaction) => {
        // 1. Validasi Stok & Update
        for (const item of cart) {
          const productRef = doc(db, 'products', item.id);
          const productDoc = await transaction.get(productRef);

          if (!productDoc.exists()) {
            throw new Error(`Produk ${item.name} tidak ditemukan!`);
          }

          const currentStock = productDoc.data().stock;
          const newStock = currentStock - item.qty;

          if (newStock < 0) {
            throw new Error(`Stok ${item.name} tidak cukup!`);
          }

          // Update stok
          transaction.update(productRef, { stock: newStock });
        }

        // 2. Simpan Transaksi
        const transactionRef = doc(collection(db, 'transactions'));
        transaction.set(transactionRef, {
          cashierId: currentUser.uid,
          total: calculateTotal(),
          date: new Date(),
          items: cart.map(item => ({
            productId: item.id,
            name: item.name,
            qty: item.qty,
            price: item.price,
          })),
        });
      });

      Alert.alert('Sukses', 'Transaksi berhasil disimpan!', [
        {
          text: 'OK',
          onPress: () => {
            setCart([]); // Kosongkan keranjang
          },
        },
      ]);
    } catch (error: any) {
      console.error('Checkout error:', error);
      Alert.alert('Error', error.message || 'Checkout gagal!');
    } finally {
      setLoading(false);
    }
  };

  // Handle barcode scanned
  const handleBarcodeScanned = (barcode: string) => {
    console.log('Barcode scanned:', barcode);
    getProductByBarcode(barcode);
  };

  // Render cart item
  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>Rp {item.price.toLocaleString('id-ID')}</Text>
        <Text style={styles.stockText}>Stok: {item.stock}</Text>
      </View>

      <View style={styles.qtyContainer}>
        <TouchableOpacity
          style={styles.qtyButton}
          onPress={() => updateQty(item.id, item.qty - 1)}
        >
          <Text style={styles.qtyButtonText}>-</Text>
        </TouchableOpacity>

        <Text style={styles.qtyText}>{item.qty}</Text>

        <TouchableOpacity
          style={styles.qtyButton}
          onPress={() => updateQty(item.id, item.qty + 1)}
        >
          <Text style={styles.qtyButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromCart(item.id)}
      >
        <Text style={styles.removeButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kasir</Text>
        <Text style={styles.headerSubtitle}>
          {cart.length} item dalam keranjang
        </Text>
      </View>

      {/* Scan Button */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => setShowScanner(true)}
      >
        <Text style={styles.scanButtonText}>📷 Scan Barcode</Text>
      </TouchableOpacity>

      {/* Cart List */}
      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Keranjang kosong</Text>
          <Text style={styles.emptySubtext}>
            Scan barcode untuk menambah produk
          </Text>
        </View>
      ) : (
        <FlatList
          data={cart}
          renderItem={renderCartItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.cartList}
        />
      )}

      {/* Total & Checkout */}
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>
            Rp {calculateTotal().toLocaleString('id-ID')}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (cart.length === 0 || loading) && styles.checkoutButtonDisabled,
          ]}
          onPress={handleCheckout}
          disabled={cart.length === 0 || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.checkoutButtonText}>Checkout</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerScreen
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScanned}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8F5E9',
    marginTop: 4,
  },
  scanButton: {
    backgroundColor: '#2196F3',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
  },
  cartList: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cartItemInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 4,
  },
  stockText: {
    fontSize: 12,
    color: '#999',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  qtyButton: {
    width: 32,
    height: 32,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  qtyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    backgroundColor: '#f44336',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#CCC',
  },
  checkoutButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CashierScreen;