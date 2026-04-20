import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar } from 'react-native';
import { ChevronRight, User, Users } from 'lucide-react-native';
import { COLORS } from '../../../constants/colors';
import { DashboardService } from '../../../services/dashboardService';
import { useAuth } from '../../../hooks/auth/useAuth';

import { ScreenHeader } from '../../../components/common/ScreenHeader';
import SkeletonLoadingMobile from '../../../components/common/SkeletonLoadingMobile';
import { CashierDetailModal } from './modal/CashierDetailModal';

const CashierManagementScreen = ({ navigation }: any) => {
  const { tenantId } = useAuth();
  const [cashiers, setCashiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCashier, setSelectedCashier] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = async () => {
    if (!tenantId) return;
    setLoading(true);
    const data = await DashboardService.fetchCashierPerformance(tenantId);
    setCashiers(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [tenantId]);

  const handleCashierPress = (cashier: any) => {
    setSelectedCashier(cashier);
    setModalVisible(true);
  };

  const renderCashier = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.card, item.status === 'inactive' && styles.inactiveCard]}
      onPress={() => handleCashierPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}><User color="#94A3B8" size={24} /></View>
        )}
      </View>
      
      <View style={styles.cardCenter}>
        <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.emailText} numberOfLines={1}>{item.email || '-'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#ECFDF5' : '#FEF2F2' }]}>
          <Text style={[styles.statusText, { color: item.status === 'active' ? '#10B981' : '#EF4444' }]}>
            {item.status === 'active' ? 'Aktif' : 'Nonaktif'}
          </Text>
        </View>
      </View>

      <View style={styles.cardRight}>
        <ChevronRight size={20} color="#CBD5E1" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScreenHeader
        title="Daftar Kasir"
        subtitle="Manajemen Pegawai"
        icon={<Users size={24} color="#FFF" />}
        onBackPress={() => navigation.goBack()}
        backIcon="chevron"
      />

      <View style={styles.contentWrapper}>
        {loading ? (
          <View style={{ padding: 16 }}>
            <SkeletonLoadingMobile type="product-list" rows={6} />
          </View>
        ) : (
          <FlatList
            data={cashiers}
            renderItem={renderCashier}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>Belum ada kasir terdaftar.</Text>}
            showsVerticalScrollIndicator={false}
            onRefresh={loadData}
            refreshing={loading}
          />
        )}
      </View>

      <CashierDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        cashier={selectedCashier}
        onStatusChanged={loadData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  contentWrapper: { flex: 1 },
  list: { padding: 16, paddingBottom: 100 },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#F1F5F9' 
  },
  inactiveCard: { opacity: 0.6 },
  cardLeft: { marginRight: 14 },
  avatar: { width: 60, height: 60, borderRadius: 16 },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  cardCenter: { flex: 1, justifyContent: 'center' },
  nameText: { fontSize: 15, fontFamily: 'PoppinsBold', color: '#1E293B', marginBottom: 2 },
  emailText: { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#64748B', marginBottom: 6 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 10, fontFamily: 'PoppinsSemiBold' },
  cardRight: { paddingLeft: 10, justifyContent: 'center' },
  empty: { textAlign: 'center', marginTop: 50, color: '#94A3B8', fontFamily: 'PoppinsRegular' }
});

export default CashierManagementScreen;