import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  Platform
} from 'react-native';
import { X, ChevronRight, ShoppingBag, User, CreditCard, Banknote } from 'lucide-react-native';
import { Transaction } from '../../types/transaction.type';
import { formatCurrency, getDisplayId, formatDate } from '../../utils/transactionsUtils';
import { COLORS } from '../../constants/colors'; // Gunakan konstanta warna yang sama

interface Props {
  transaction: Transaction;
  isAdmin: boolean;
  onPress?: () => void;
}

export const TransactionItemCard: React.FC<Props> = ({ transaction, isAdmin }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const displayId = getDisplayId(transaction);
  const itemCount = transaction.items.length;
  
  const getDate = () => {
    if (!transaction.date) {
      return transaction.createdAt?.toDate() || new Date();
    }
    return transaction.date.toDate ? transaction.date.toDate() : new Date();
  };
  
  const date = getDate();

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.idText}>{displayId}</Text>
            {isAdmin && transaction.cashierName && (
              <View style={styles.cashierBadge}>
                <User size={12} color={COLORS.primary} />
                <Text style={styles.cashierName}>{transaction.cashierName}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.dateText}>
            {date.toLocaleDateString('id-ID', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </Text>

          <View style={styles.footerRow}>
            <Text style={styles.totalText}>{formatCurrency(transaction.total)}</Text>
            <View style={styles.itemBadge}>
              <ShoppingBag size={12} color="#64748B" />
              <Text style={styles.itemCount}>{itemCount} item</Text>
            </View>
          </View>
        </View>

        <ChevronRight size={18} color="#CBD5E1" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Transaksi</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              <View style={styles.modalBody}>
                
                {/* Info Utama */}
                <View style={styles.infoCard}>
                  <InfoRow label="ID Transaksi" value={displayId} />
                  <View style={styles.divider} />
                  {transaction.cashierName && (
                    <>
                      <InfoRow label="Kasir" value={transaction.cashierName} icon={<User size={14} color="#64748B" />} />
                      <View style={styles.divider} />
                    </>
                  )}
                  <InfoRow label="Waktu" value={formatDate(transaction.date || transaction.createdAt)} />
                </View>

                {/* List Produk */}
                <Text style={styles.sectionTitle}>Produk Dibeli</Text>
                <View style={styles.itemsContainer}>
                  {transaction.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <View style={styles.itemLeft}>
                        <View style={styles.itemNumber}>
                          <Text style={styles.itemNumberText}>{index + 1}</Text>
                        </View>
                        <View style={styles.itemDetails}>
                          <Text style={styles.itemName}>{item.productName || 'Produk'}</Text>
                          <Text style={styles.itemQty}>{item.qty} x {formatCurrency(item.price)}</Text>
                        </View>
                      </View>
                      <Text style={styles.itemTotal}>
                        {formatCurrency(item.subtotal || (item.qty * item.price))}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Summary Pembayaran (Menyesuaikan CashierScreen) */}
                <View style={styles.paymentSummaryCard}>
                   <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total Tagihan</Text>
                      <Text style={styles.summaryValueBig}>{formatCurrency(transaction.total)}</Text>
                   </View>
                   
                   {/* Tampilkan Uang Tunai & Kembalian jika ada di database */}
                   {transaction.cashAmount && (
                     <>
                        <View style={styles.dividerLight} />
                        <View style={styles.summaryRow}>
                           <Text style={styles.summaryLabel}>Tunai</Text>
                           <Text style={styles.summaryValue}>{formatCurrency(transaction.cashAmount)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                           <Text style={styles.summaryLabel}>Kembalian</Text>
                           <Text style={styles.summaryValue}>{formatCurrency(transaction.changeAmount || 0)}</Text>
                        </View>
                     </>
                   )}
                </View>

              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

// Helper Component
const InfoRow = ({ label, value, icon }: any) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <View style={styles.infoValueContainer}>
      {icon}
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  content: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  idText: { fontSize: 10, fontFamily: 'PoppinsSemiBold', color: COLORS.primary, textTransform: 'uppercase' },
  cashierBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0F9FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  cashierName: { fontSize: 10, fontFamily: 'PoppinsSemiBold', color: COLORS.primary },
  dateText: { fontSize: 14, fontFamily: 'PoppinsBold', color: '#1E293B', marginBottom: 6 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 10 },
  totalText: { fontSize: 14, fontFamily: 'PoppinsBold', color: COLORS.secondary },
  itemBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  itemCount: { fontSize: 11, fontFamily: 'PoppinsSemiBold', color: '#64748B' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: 18, fontFamily: 'PoppinsBold', color: '#1E293B' },
  closeBtn: { backgroundColor: '#F1F5F9', padding: 8, borderRadius: 12 },
  scrollContent: { paddingBottom: 40 },
  modalBody: { padding: 24 },
  infoCard: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  infoLabel: { fontSize: 13, fontFamily: 'PoppinsRegular', color: '#64748B' },
  infoValueContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoValue: { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },
  sectionTitle: { fontSize: 16, fontFamily: 'PoppinsBold', color: '#1E293B', marginBottom: 12 },
  itemsContainer: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 20, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemNumber: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemNumberText: { fontSize: 12, fontFamily: 'PoppinsBold', color: COLORS.primary },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 14, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  itemQty: { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#64748B' },
  itemTotal: { fontSize: 14, fontFamily: 'PoppinsBold', color: '#1E293B' },
  
  paymentSummaryCard: { backgroundColor: COLORS.primary, borderRadius: 24, padding: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'PoppinsRegular' },
  summaryValue: { color: '#FFF', fontSize: 15, fontFamily: 'PoppinsSemiBold' },
  summaryValueBig: { color: '#FFF', fontSize: 22, fontFamily: 'PoppinsBold' },
  dividerLight: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 10 },
});