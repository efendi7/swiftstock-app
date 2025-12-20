import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import {
  X,
  ChevronRight,
  ShoppingBag,
  User,
  Banknote,
  QrCode,
} from 'lucide-react-native';
import { Transaction } from '../../types/transaction.type';
import {
  formatCurrency,
  getDisplayId,
  formatDate,
} from '../../utils/transactionsUtils';

interface Props {
  transaction: Transaction;
  isAdmin: boolean;
}

export const TransactionItemCard: React.FC<Props> = ({
  transaction,
  isAdmin,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const displayId = getDisplayId(transaction);
  const itemCount = transaction.items.length;

  const isQris = transaction.paymentMethod === 'qris';

  const COLOR_QRIS = '#F59E0B';
  const COLOR_CASH = '#16A34A';

  const themeColor = isQris ? COLOR_QRIS : COLOR_CASH;
  const themeBgSoft = isQris ? '#FFFBEB' : '#ECFDF5';

  const date =
    transaction.date?.toDate?.() ||
    transaction.createdAt?.toDate?.() ||
    new Date();

  return (
    <>
      {/* ================= CARD LIST ================= */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.idContainer}>
              <Text style={styles.idText}>{displayId}</Text>

              <View
                style={[
                  styles.methodBadge,
                  { backgroundColor: themeBgSoft },
                ]}
              >
                {isQris ? (
                  <QrCode size={10} color={themeColor} />
                ) : (
                  <Banknote size={10} color={themeColor} />
                )}
                <Text
                  style={[
                    styles.methodBadgeText,
                    { color: themeColor },
                  ]}
                >
                  {isQris ? 'QRIS' : 'TUNAI'}
                </Text>
              </View>
            </View>

            {isAdmin && transaction.cashierName && (
              <View style={styles.cashierBadge}>
                <User size={10} color="#64748B" />
                <Text style={styles.cashierName}>
                  {transaction.cashierName}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.dateText}>
            {date.toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>

          <View style={styles.footerRow}>
            <Text style={styles.totalText}>
              {formatCurrency(transaction.total)}
            </Text>

            <View style={styles.itemBadge}>
              <ShoppingBag size={12} color="#64748B" />
              <Text style={styles.itemCount}>
                {itemCount} item
              </Text>
            </View>
          </View>
        </View>

        <ChevronRight size={18} color="#CBD5E1" />
      </TouchableOpacity>

      {/* ================= MODAL ================= */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Detail Transaksi
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <X size={20} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.modalBody}>
                {/* INFO */}
                <View style={styles.infoCard}>
                  <InfoRow
                    label="ID Transaksi"
                    value={displayId}
                  />
                  <Divider />
                  <InfoRow
                    label="Metode Bayar"
                    value={isQris ? 'QRIS' : 'Tunai'}
                    icon={
                      isQris ? (
                        <QrCode size={14} color={themeColor} />
                      ) : (
                        <Banknote
                          size={14}
                          color={themeColor}
                        />
                      )
                    }
                  />
                  <Divider />
                  <InfoRow
                    label="Waktu"
                    value={formatDate(
                      transaction.date ||
                        transaction.createdAt
                    )}
                  />
                </View>

                {/* PRODUK */}
                <Text style={styles.sectionTitle}>
                  Produk Dibeli
                </Text>

                <View style={styles.itemsContainer}>
                  {transaction.items.map((item, index) => (
                    <View
                      key={index}
                      style={styles.productCard}
                    >
                      <View style={styles.productHeader}>
                        <Text style={styles.productIndex}>
                          {index + 1}.
                        </Text>
                        <Text style={styles.productName}>
                          {item.productName || 'Produk'}
                        </Text>
                      </View>

                      <View style={styles.productDetailRow}>
                        <Text style={styles.productDetailLabel}>
                          Jumlah
                        </Text>
                        <Text style={styles.productDetailValue}>
                          {item.qty} x{' '}
                          {formatCurrency(item.price)}
                        </Text>
                      </View>

                      <View style={styles.productSubtotalRow}>
                        <Text
                          style={styles.productSubtotalLabel}
                        >
                          Subtotal
                        </Text>
                        <Text
                          style={styles.productSubtotalValue}
                        >
                          {formatCurrency(
                            item.subtotal ??
                              item.qty * item.price
                          )}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* SUMMARY */}
                <View
                  style={[
                    styles.paymentSummaryCard,
                    { backgroundColor: themeColor },
                  ]}
                >
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Total Tagihan
                    </Text>
                    <Text style={styles.summaryValueBig}>
                      {formatCurrency(transaction.total)}
                    </Text>
                  </View>

                  <View style={styles.dividerLight} />

                  {!isQris ? (
                    <>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>
                          Uang Tunai
                        </Text>
                        <Text style={styles.summaryValue}>
                          {formatCurrency(
                            transaction.cashAmount || 0
                          )}
                        </Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>
                          Kembalian
                        </Text>
                        <Text style={styles.summaryValue}>
                          {formatCurrency(
                            transaction.changeAmount ||
                              0
                          )}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>
                        Status
                      </Text>
                      <Text style={styles.summaryValue}>
                        Lunas via QRIS
                      </Text>
                    </View>
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

/* ================= HELPER ================= */
const InfoRow = ({ label, value, icon }: any) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <View style={styles.infoValueContainer}>
      {icon}
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const Divider = () => <View style={styles.divider} />;

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  content: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  idContainer: { flexDirection: 'row', gap: 8 },
  idText: {
    fontSize: 10,
    fontFamily: 'PoppinsSemiBold',
    color: '#000',
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  methodBadgeText: {
    fontSize: 8,
    fontFamily: 'PoppinsBold',
  },
  cashierBadge: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  cashierName: {
    fontSize: 9,
    fontFamily: 'PoppinsSemiBold',
    color: '#64748B',
  },
  dateText: {
    fontSize: 14,
    fontFamily: 'PoppinsBold',
    color: '#1E293B',
    marginVertical: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalText: {
    fontSize: 14,
    fontFamily: 'PoppinsBold',
    color: '#000',
  },
  itemBadge: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  itemCount: {
    fontSize: 11,
    fontFamily: 'PoppinsSemiBold',
    color: '#64748B',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'PoppinsBold',
  },
  closeBtn: {
    backgroundColor: '#F1F5F9',
    padding: 8,
    borderRadius: 12,
  },
  scrollContent: { paddingBottom: 40 },
  modalBody: { padding: 24 },

  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: { color: '#64748B' },
  infoValueContainer: { flexDirection: 'row', gap: 6 },
  infoValue: { fontFamily: 'PoppinsSemiBold' },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily: 'PoppinsBold',
    marginBottom: 12,
  },

  itemsContainer: { marginBottom: 20 },

  productCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  productHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  productIndex: {
    fontFamily: 'PoppinsBold',
    color: '#64748B',
    marginRight: 6,
  },
  productName: {
    fontFamily: 'PoppinsSemiBold',
    flex: 1,
  },
  productDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  productDetailLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  productDetailValue: {
    fontSize: 12,
    fontFamily: 'PoppinsMedium',
  },
  productSubtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  productSubtotalLabel: {
    fontFamily: 'PoppinsSemiBold',
  },
  productSubtotalValue: {
    fontFamily: 'PoppinsBold',
  },

  paymentSummaryCard: {
    borderRadius: 24,
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
  },
  summaryValue: {
    color: '#FFF',
    fontFamily: 'PoppinsSemiBold',
  },
  summaryValueBig: {
    color: '#FFF',
    fontSize: 22,
    fontFamily: 'PoppinsBold',
  },
  dividerLight: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 10,
  },
});
