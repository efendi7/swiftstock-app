/**
 * WebHeader.tsx — Responsive
 * Desktop/Tablet : hamburger + judul + subtitle + notif + profil lengkap
 * Mobile <768px  : hamburger + judul saja + notif + avatar (tanpa nama/subtitle)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { COLORS }    from '@constants/colors';
import { UserRole }  from '@navigation/types';
import { Bell, User, Menu } from 'lucide-react-native';
import { auth }      from '@services/firebaseConfig';
import { useRoute }  from '@react-navigation/native';
import { useWindowWidth } from '@hooks/useWindowWidth'; // ← hook yang sudah dibuat di WebLayout

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  Dashboard:               { title: 'Dashboard',         subtitle: 'Ringkasan aktivitas toko Anda'       },
  WebProducts:             { title: 'Daftar Produk',     subtitle: 'Kelola stok dan informasi produk'    },
  WebTransactions:         { title: 'Transaksi',         subtitle: 'Riwayat dan detail penjualan'        },
  WebReports:              { title: 'Laporan Stok',      subtitle: 'Riwayat pergerakan stok produk'      },
  WebCashierManagement:    { title: 'Manajemen Staf',    subtitle: 'Kelola akun kasir dan admin'         },
  WebAttendanceManagement: { title: 'Kehadiran Kasir',   subtitle: 'Rekap absensi dan jam kerja kasir'   },
  WebMemberManagement:     { title: 'Member',            subtitle: 'Kelola loyalitas dan poin pelanggan' },
  WebSubscription:         { title: 'Langganan',         subtitle: 'Informasi paket dan pembayaran'      },
  WebSettings:             { title: 'Pengaturan',        subtitle: 'Konfigurasi toko dan aplikasi'       },
  Tenants:                 { title: 'Semua Tenant',      subtitle: 'Manajemen seluruh toko'              },
  Users:                   { title: 'Semua Pengguna',    subtitle: 'Daftar akun pengguna sistem'         },
  Analytics:               { title: 'Analitik',          subtitle: 'Laporan dan statistik global'        },
  Settings:                { title: 'Pengaturan Sistem', subtitle: 'Konfigurasi level super admin'       },
};

const DEFAULT_META = { title: 'SwiftStock', subtitle: 'Panel manajemen' };
const BP_MOBILE    = 768;

interface Props {
  role?:             UserRole | null;
  tenantId?:         string | null;
  onToggleSidebar?:  () => void;
  sidebarCollapsed?: boolean;
}

const WebHeader: React.FC<Props> = ({ role, onToggleSidebar, sidebarCollapsed }) => {
  const route       = useRoute();
  const windowWidth = useWindowWidth();
  const isMobile    = windowWidth < BP_MOBILE;

  const user        = auth.currentUser;
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const meta        = PAGE_META[route.name] ?? DEFAULT_META;

  return (
    <View style={styles.container}>

      {/* ── KIRI: hamburger + judul ── */}
      <View style={styles.left}>
        {onToggleSidebar && (
          <TouchableOpacity style={styles.hamburgerBtn} onPress={onToggleSidebar}>
            <Menu size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        <View>
          <Text style={[styles.pageTitle, isMobile && styles.pageTitleMobile]}>
            {meta.title}
          </Text>
          {/* Subtitle disembunyikan di mobile — terlalu sempit */}
          {!isMobile && (
            <Text style={styles.pageSubtitle}>{meta.subtitle}</Text>
          )}
        </View>
      </View>

      {/* ── KANAN: notif + profil ── */}
      <View style={styles.right}>

        {/* Notifikasi — selalu tampil */}
        <TouchableOpacity style={styles.iconBtn}>
          <Bell size={isMobile ? 17 : 19} color={COLORS.textDark} />
          <View style={styles.notifBadge}>
            <Text style={styles.notifText}>3</Text>
          </View>
        </TouchableOpacity>

        {/* Profil — mobile: avatar saja; desktop: avatar + nama */}
        <TouchableOpacity style={styles.profileBtn}>
          <View style={[styles.avatar, isMobile && styles.avatarMobile]}>
            <User size={isMobile ? 15 : 17} color="#FFF" />
          </View>
          {!isMobile && (
            <View>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileRole}>
                {role === 'superadmin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Kasir'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    ...Platform.select({ web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.04)' } as any }),
  },

  left:         { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  hamburgerBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', cursor: 'pointer' as any, flexShrink: 0 },

  pageTitle:       { fontSize: 17, fontFamily: 'MontserratBold', color: '#1E293B' },
  pageTitleMobile: { fontSize: 15 },
  pageSubtitle:    { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 1 },

  right:       { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  iconBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', position: 'relative' as any },
  notifBadge:  { position: 'absolute', top: -3, right: -3, backgroundColor: '#EF4444', width: 15, height: 15, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  notifText:   { color: '#FFF', fontSize: 8, fontFamily: 'PoppinsBold' },

  profileBtn:  { flexDirection: 'row', alignItems: 'center', gap: 8, cursor: 'pointer' as any },
  avatar:      { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  avatarMobile:{ width: 32, height: 32, borderRadius: 9 },
  profileName: { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  profileRole: { fontSize: 11, fontFamily: 'PoppinsRegular',  color: '#94A3B8', marginTop: -1 },
});

export default WebHeader;