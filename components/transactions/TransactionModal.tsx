import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { X, QrCode, Banknote } from 'lucide-react-native';
import { Transaction } from '../../types/transaction.type';
import { formatCurrency, formatDate, getDisplayId } from '../../utils/transactionsUtils';
import { InfoRow, Divider } from './TransactionInfoSection';
import { TransactionProductItem } from './TransactionProductItem';
import { styles } from './transactionStyles';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction;
  themeColor: string;
}

export const TransactionModal: React.FC<ModalProps> = ({ visible, onClose, transaction, themeColor }) => {
  const isQris = transaction.paymentMethod === 'qris';

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detail Transaksi</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#1E293B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.modalBody}>
              <View style={styles.infoCard}>
                <InfoRow label="ID Transaksi" value={getDisplayId(transaction)} />
                <Divider />
                <InfoRow 
                  label="Metode Bayar" 
                  value={isQris ? 'QRIS' : 'Tunai'} 
                  icon={isQris ? <QrCode size={14} color={themeColor} /> : <Banknote size={14} color={themeColor} />}
                />
                <Divider />
                <InfoRow label="Waktu" value={formatDate(transaction.date || transaction.createdAt)} />
              </View>

              <Text style={styles.sectionTitle}>Produk Dibeli</Text>
              <View style={styles.itemsContainer}>
                {transaction.items.map((item, index) => (
                  <TransactionProductItem key={index} item={item} index={index} />
                ))}
              </View>

              <View style={[styles.paymentSummaryCard, { backgroundColor: themeColor }]}>
                <View style={styles.summaryRow}>
                   <Text style={styles.summaryLabel}>Total Tagihan</Text>
                   <Text style={styles.summaryValueBig}>{formatCurrency(transaction.total)}</Text>
                </View>
                {isQris ? (
                  <>
                    <View style={styles.dividerLight} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Status</Text>
                      <Text style={styles.summaryValue}>LUNAS VIA QRIS</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.dividerLight} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Uang Tunai</Text>
                      <Text style={styles.summaryValue}>{formatCurrency(transaction.cashAmount || 0)}</Text>
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
  );
};