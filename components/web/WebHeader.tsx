import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { COLORS } from '@constants/colors';
import { UserRole } from '@navigation/types';
import { Bell, User, Menu } from 'lucide-react-native';
import { auth } from '@services/firebaseConfig';
import { useRoute } from '@react-navigation/native';

interface Props {
  role?:             UserRole | null;
  tenantId?:         string | null;
  onToggleSidebar?:  () => void;
  sidebarCollapsed?: boolean;
}

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  Dashboard:               { title: 'Dashboard',           subtitle: 'Ringkasan aktivitas toko Anda' },
  WebProducts:             { title: 'Daftar Produk',       subtitle: 'Kelola stok dan informasi produk' },
  WebTransactions:         { title: 'Transaksi',           subtitle: 'Riwayat dan detail penjualan' },
  WebCashierManagement:    { title: 'Manajemen Staf',      subtitle: 'Kelola akun kasir dan admin' },
  WebAttendanceManagement: { title: 'Kehadiran Kasir',     subtitle: 'Rekap absensi dan jam kerja kasir' },
  WebMemberManagement:     { title: 'Member',              subtitle: 'Kelola loyalitas dan poin pelanggan' },
  WebSubscription:         { title: 'Langganan',           subtitle: 'Informasi paket dan pembayaran' },
  WebSettings:             { title: 'Pengaturan',          subtitle: 'Konfigurasi toko dan aplikasi' },
  Tenants:                 { title: 'Semua Tenant',        subtitle: 'Manajemen seluruh toko' },
  Users:                   { title: 'Semua Pengguna',      subtitle: 'Daftar akun pengguna sistem' },
  Analytics:               { title: 'Analitik',            subtitle: 'Laporan dan statistik global' },
  Settings:                { title: 'Pengaturan Sistem',   subtitle: 'Konfigurasi level super admin' },
};

const DEFAULT_META = { title: 'SwiftStock', subtitle: 'Panel manajemen' };

const WebHeader: React.FC<Props> = ({ role, onToggleSidebar, sidebarCollapsed }) => {
  const route       = useRoute();
  const user        = auth.currentUser;
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const meta        = PAGE_META[route.name] ?? DEFAULT_META;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {onToggleSidebar && (
          <TouchableOpacity style={styles.hamburgerBtn} onPress={onToggleSidebar}>
            <Menu size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.pageTitle}>{meta.title}</Text>
          <Text style={styles.pageSubtitle}>{meta.subtitle}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <TouchableOpacity style={styles.iconBtn}>
          <Bell size={19} color={COLORS.textDark} />
          <View style={styles.notifBadge}>
            <Text style={styles.notifText}>3</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.profileBtn}>
          <View style={styles.avatar}>
            <User size={17} color="#FFF" />
          </View>
          <View>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileRole}>
              {role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Kasir'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', ...Platform.select({ web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.04)' } as any }) },
  left:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hamburgerBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', cursor: 'pointer' as any },
  pageTitle:    { fontSize: 18, fontFamily: 'MontserratBold', color: '#1E293B' },
  pageSubtitle: { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 1 },
  right:        { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBtn:      { width: 38, height: 38, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  notifBadge:   { position: 'absolute', top: -3, right: -3, backgroundColor: '#EF4444', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  notifText:    { color: '#FFF', fontSize: 9, fontFamily: 'PoppinsBold' },
  profileBtn:   { flexDirection: 'row', alignItems: 'center', gap: 10, cursor: 'pointer' as any },
  avatar:       { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  profileName:  { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  profileRole:  { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: -1 },
});

export default WebHeader;