import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { X, Power, User, TrendingUp, ShoppingBag, Package } from 'lucide-react-native';
import { doc, updateDoc } from 'firebase/firestore';

import { db } from '../../../../services/firebaseConfig';
import { COLORS } from '../../../../constants/colors';

interface Cashier {
  id: string;
  name: string;
  email?: string;
  photoURL?: string;
  status: string;
  todayRevenue: number;
  transactionCount: number;
  todayOut?: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  cashier: Cashier | null;
  onStatusChanged: () => void;
}

export const CashierDetailModal: React.FC<Props> = ({ visible, onClose, cashier, onStatusChanged }) => {
  const [loading, setLoading] = useState(false);

  if (!cashier) return null;

  const isActive = cashier.status === 'active';

  const toggleStatus = async () => {
    const newStatus = isActive ? 'inactive' : 'active';
    
    Alert.alert(
      newStatus === 'inactive' ? 'Nonaktifkan Kasir' : 'Aktifkan Kasir',
      `Apakah Anda yakin ingin mengubah status akses ${cashier.name}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Ya, Ubah', 
          style: newStatus === 'inactive' ? 'destructive' : 'default',
          onPress: async () => {
            setLoading(true);
            try {
              await updateDoc(doc(db, 'users', cashier.id), { status: newStatus });
              onStatusChanged(); // Refresh daftar parent & trigger UI update
              onClose(); 
            } catch (err) {
              Alert.alert('Error', 'Gagal memperbarui status.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Detail Pegawai</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            {cashier.photoURL ? (
              <Image source={{ uri: cashier.photoURL }} style={styles.avatarLarge} />
            ) : (
              <View style={styles.avatarPlaceholderLarge}>
                <User size={36} color="#A0AEC0" />
              </View>
            )}
            <Text style={styles.nameText}>{cashier.name}</Text>
            <Text style={styles.emailText}>{cashier.email || '-'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: isActive ? '#ECFDF5' : '#FEF2F2' }]}>
              <Text style={[styles.statusText, { color: isActive ? '#10B981' : '#EF4444' }]}>
                {isActive ? 'Akun Aktif' : 'Dinonaktifkan'}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Performa Hari Ini</Text>

          {/* Stats Grid */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <View style={[styles.statIconWrap, { backgroundColor: '#F0FDF4' }]}>
                <TrendingUp size={20} color="#10B981" />
              </View>
              <Text style={styles.statValue}>Rp {cashier.todayRevenue.toLocaleString('id-ID')}</Text>
              <Text style={styles.statLabel}>Total Omzet</Text>
            </View>

            <View style={styles.statBox}>
              <View style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <ShoppingBag size={20} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>{cashier.transactionCount}</Text>
              <Text style={styles.statLabel}>Sesi Transaksi</Text>
            </View>

            <View style={styles.statBox}>
              <View style={[styles.statIconWrap, { backgroundColor: '#F5F3FF' }]}>
                <Package size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.statValue}>{cashier.todayOut || 0}</Text>
              <Text style={styles.statLabel}>Total Item</Text>
            </View>
          </View>

          {/* Action Area */}
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: isActive ? '#FEF2F2' : '#F0FDF4' }]} 
              onPress={toggleStatus}
              disabled={loading}
            >
              <Power size={20} color={isActive ? '#EF4444' : '#10B981'} />
              <Text style={[styles.actionBtnText, { color: isActive ? '#EF4444' : '#10B981' }]}>
                {loading ? 'Memproses...' : (isActive ? 'Nonaktifkan Akses Kasir' : 'Aktifkan Akses Kasir')}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  headerTitle: { fontSize: 18, fontFamily: 'PoppinsBold', color: COLORS.textDark },
  closeBtn: {
    padding: 8, backgroundColor: '#F1F5F9', borderRadius: 20,
  },
  profileSection: {
    alignItems: 'center', marginBottom: 24,
  },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40, marginBottom: 12,
  },
  avatarPlaceholderLarge: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#EDF2F7', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  nameText: { fontSize: 18, fontFamily: 'PoppinsBold', color: COLORS.textDark, marginBottom: 4 },
  emailText: { fontSize: 13, fontFamily: 'PoppinsRegular', color: COLORS.textLight, marginBottom: 10 },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  statusText: { fontSize: 11, fontFamily: 'PoppinsSemiBold' },
  sectionLabel: { fontSize: 15, fontFamily: 'PoppinsSemiBold', color: COLORS.textDark, marginBottom: 12 },
  statsContainer: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 30,
  },
  statBox: {
    flex: 1, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9',
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  statValue: { fontSize: 14, fontFamily: 'PoppinsBold', color: COLORS.textDark, marginBottom: 2 },
  statLabel: { fontSize: 10, fontFamily: 'PoppinsMedium', color: COLORS.textLight, textAlign: 'center' },
  footer: {
    flexDirection: 'column', gap: 12,
  },
  actionBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  actionBtnText: {
    fontSize: 14, fontFamily: 'PoppinsBold',
  },
});
