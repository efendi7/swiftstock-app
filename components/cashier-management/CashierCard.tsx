import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Mail, ShieldCheck, Trash2, Calendar } from 'lucide-react-native';
import { COLORS } from '@constants/colors';

interface CashierCardProps {
  cashier: any;
  isAdmin: boolean;
}

const CashierCard = ({ cashier, isAdmin }: CashierCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {cashier.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.infoMain}>
          <Text style={styles.nameText}>{cashier.name}</Text>
          <View style={styles.roleBadge}>
            <ShieldCheck size={12} color={COLORS.secondary} />
            <Text style={styles.roleText}>Kasir Terverifikasi</Text>
          </View>
        </View>
        {isAdmin && (
          <TouchableOpacity style={styles.deleteBtn}>
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBody}>
        <View style={styles.detailItem}>
          <Mail size={16} color="#64748B" />
          <Text style={styles.detailText}>{cashier.email}</Text>
        </View>
        <View style={styles.detailItem}>
          <Calendar size={16} color="#64748B" />
          <Text style={styles.detailText}>
            Terdaftar: {cashier.createdAt?.toDate ? cashier.createdAt.toDate().toLocaleDateString('id-ID') : 'Baru'}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
         <Text style={styles.storeTag}>Toko: {cashier.storeName || '-'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flex: 1, // Penting untuk grid di web
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'MontserratBold',
  },
  infoMain: {
    flex: 1,
    marginLeft: 12,
  },
  nameText: {
    fontSize: 16,
    fontFamily: 'MontserratBold',
    color: '#1E293B',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    fontFamily: 'PoppinsMedium',
    color: COLORS.secondary,
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardBody: {
    gap: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 13,
    fontFamily: 'PoppinsRegular',
    color: '#64748B',
  },
  cardFooter: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  storeTag: {
    fontSize: 11,
    fontFamily: 'PoppinsSemiBold',
    color: '#94A3B8',
    textTransform: 'uppercase',
  }
});

export default CashierCard;