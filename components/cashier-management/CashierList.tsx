import React from 'react';
import { FlatList, Text, StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, UserPlus, ShieldAlert, BadgeCheck } from 'lucide-react-native';

// COMPONENTS & TYPES
import CashierCard from './CashierCard';
import { COLORS } from '@constants/colors';

interface Props {
  data: any[]; // Ganti dengan tipe Cashier Anda jika ada
  refreshing: boolean;
  onRefresh: () => void;
  isAdmin?: boolean;
}

const CashierList = ({ data, refreshing, onRefresh, isAdmin = false }: Props) => {
  const insets = useSafeAreaInsets();

  const renderEmptyComponent = () => {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.iconCircle, { backgroundColor: COLORS.primary + '15' }]}>
          <Users size={50} color={COLORS.primary} strokeWidth={1.5} />
        </View>
        <Text style={styles.emptyTitle}>Belum ada Kasir</Text>
        <Text style={styles.emptySubtitle}>
          Daftarkan kasir baru untuk membantu operasional toko Anda.
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => (
        <CashierCard 
          cashier={item} 
          isAdmin={isAdmin}
        />
      )}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
      // Khusus Web, FlatList butuh styling tambahan agar tidak kaku
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 100,
          paddingTop: 10,
        },
      ]}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={renderEmptyComponent}
      // Konfigurasi Grid untuk Web (Optional)
      numColumns={Platform.OS === 'web' ? 2 : 1}
      key={Platform.OS === 'web' ? 'web-grid' : 'mobile-list'}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'MontserratBold',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    fontFamily: 'PoppinsRegular',
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
  },
});

export default CashierList;