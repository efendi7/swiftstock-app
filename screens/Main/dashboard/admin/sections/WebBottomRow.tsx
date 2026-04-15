/**
 * WebActivityRow.tsx — Aktivitas Terbaru full-width (mandiri, tidak ada elemen di samping)
 *
 * Layout per item:
 *   [Icon] [Waktu]  [Teks aktivitas utama ─────────────────]  [Kategori rata kanan]
 *
 * Kategori (type) diposisikan rata kanan, terpisah dari teks utama.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import {
  Activity as ActivityIcon,
  ShoppingCart, Package, Users, Settings,
  Trash2, RefreshCw, LogIn, LogOut,
  ChevronRight, Zap,
} from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import { Activity } from '@/types/activity';
import { DashboardService } from '@services/dashboardService';

interface Props {
  activities:       Activity[];
  currentUserName:  string;
  tenantId:         string;
  isLoading?:       boolean;
  onSeeMore?:       () => void;
}

// ── Mapping type → icon + warna + label ─────────────────────
const TYPE_MAP: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  TRANSAKSI:      { icon: ShoppingCart, color: '#00A79D', bg: '#00A79D15', label: 'Transaksi' },
  TAMBAH_PRODUK:  { icon: Package,      color: '#3B82F6', bg: '#3B82F615', label: 'Tambah Produk' },
  EDIT_PRODUK:    { icon: Package,      color: '#F59E0B', bg: '#F59E0B15', label: 'Edit Produk' },
  HAPUS_PRODUK:   { icon: Trash2,       color: '#EF4444', bg: '#EF444415', label: 'Hapus Produk' },
  STOK_MASUK:     { icon: Package,      color: '#3B82F6', bg: '#3B82F615', label: 'Stok Masuk' },
  MEMBER:         { icon: Users,        color: '#8B5CF6', bg: '#8B5CF615', label: 'Member' },
  SETTINGS:       { icon: Settings,     color: '#64748B', bg: '#64748B15', label: 'Pengaturan' },
  LOGIN:          { icon: LogIn,        color: '#10B981', bg: '#10B98115', label: 'Login' },
  LOGOUT:         { icon: LogOut,       color: '#F59E0B', bg: '#F59E0B15', label: 'Logout' },
  REFRESH:        { icon: RefreshCw,    color: '#6366F1', bg: '#6366F115', label: 'Refresh' },
};
const DEFAULT_TYPE = { icon: Zap, color: '#94A3B8', bg: '#94A3B815', label: 'Aktivitas' };

const getTypeInfo = (type?: string) => {
  if (!type) return DEFAULT_TYPE;
  const key = Object.keys(TYPE_MAP).find(k => type.toUpperCase().includes(k));
  return key ? TYPE_MAP[key] : DEFAULT_TYPE;
};

// ── Single Activity Item ─────────────────────────────────────
interface ItemProps {
  activity:       Activity & { time?: string };
  currentUserName: string;
  isLast:         boolean;
}
const ActivityItemRow: React.FC<ItemProps> = ({ activity, currentUserName, isLast }) => {
  const typeInfo = getTypeInfo(activity.type);
  const Icon     = typeInfo.icon;
  const isMe     = activity.userName === currentUserName;

  return (
    <View style={[item.wrap, !isLast && item.border]}>
      {/* Icon */}
      <View style={[item.iconBox, { backgroundColor: typeInfo.bg }]}>
        <Icon size={13} color={typeInfo.color} />
      </View>

      {/* Waktu + teks utama */}
      <View style={item.main}>
        <View style={item.topRow}>
          <Text style={item.time}>{activity.time ?? 'Baru saja'}</Text>
          {isMe && <View style={item.meBadge}><Text style={item.meTxt}>Saya</Text></View>}
        </View>
        <Text style={item.message} numberOfLines={2}>{activity.message}</Text>
        {activity.userName && (
          <Text style={item.userName}>{activity.userName}</Text>
        )}
      </View>

      {/* Kategori — rata kanan */}
      <View style={[item.categoryBox, { backgroundColor: typeInfo.bg, borderColor: typeInfo.color + '40' }]}>
        <Text style={[item.categoryTxt, { color: typeInfo.color }]}>{typeInfo.label}</Text>
      </View>
    </View>
  );
};

const item = StyleSheet.create({
  wrap:        { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, gap: 12 },
  border:      { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  iconBox:     { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  main:        { flex: 1, gap: 2 },
  topRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time:        { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  meBadge:     { backgroundColor: COLORS.secondary + '18', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 },
  meTxt:       { fontSize: 9, fontFamily: 'PoppinsSemiBold', color: COLORS.secondary },
  message:     { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#334155', lineHeight: 17 },
  userName:    { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  // Kategori rata kanan — terpisah dari teks utama
  categoryBox: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0, alignSelf: 'center' },
  categoryTxt: { fontSize: 10, fontFamily: 'PoppinsSemiBold', textAlign: 'right' },
});

// ── Main Component ────────────────────────────────────────────
const _WebActivityRow: React.FC<Props> = ({
  activities, currentUserName, tenantId, isLoading, onSeeMore,
}) => {
  const [, setTick] = useState(0);

  // Auto-refresh timestamps tiap 60 detik
  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const handleClear = () => {
    Alert.alert('Hapus Riwayat', 'Hapus semua log aktivitas?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try {
            await DashboardService.clearAllActivities(tenantId);
          } catch {
            Alert.alert('Gagal', 'Terjadi kesalahan.');
          }
        },
      },
    ]);
  };

  const liveActivities = activities.map(a => ({
    ...a,
    time: a.createdAt
      ? DashboardService.formatRelativeTime(a.createdAt.toDate())
      : 'Baru saja',
  }));

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: COLORS.secondary + '18' }]}>
            <ActivityIcon size={14} color={COLORS.secondary} />
          </View>
          <Text style={styles.title}>Aktivitas Terbaru</Text>
          {liveActivities.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countTxt}>{liveActivities.length}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          {liveActivities.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Trash2 size={12} color="#EF4444" />
              <Text style={styles.clearTxt}>Hapus log</Text>
            </TouchableOpacity>
          )}
          {onSeeMore && (
            <TouchableOpacity style={styles.seeMoreBtn} onPress={onSeeMore}>
              <Text style={styles.seeMoreTxt}>Lihat semua</Text>
              <ChevronRight size={12} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Daftar aktivitas — grid 2 kolom agar lebih compact full-width */}
      {liveActivities.length === 0 ? (
        <View style={styles.empty}>
          <ActivityIcon size={24} color="#E2E8F0" strokeWidth={1.5} />
          <Text style={styles.emptyTxt}>Belum ada aktivitas periode ini</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {/* Kolom kiri */}
          <View style={styles.col}>
            {liveActivities
              .filter((_, i) => i % 2 === 0)
              .map((a, i, arr) => (
                <ActivityItemRow
                  key={a.id ?? i}
                  activity={a}
                  currentUserName={currentUserName}
                  isLast={i === arr.length - 1}
                />
              ))}
          </View>
          {/* Divider vertikal */}
          <View style={styles.vDivider} />
          {/* Kolom kanan */}
          <View style={styles.col}>
            {liveActivities
              .filter((_, i) => i % 2 === 1)
              .map((a, i, arr) => (
                <ActivityItemRow
                  key={a.id ?? i}
                  activity={a}
                  currentUserName={currentUserName}
                  isLast={i === arr.length - 1}
                />
              ))}
          </View>
        </View>
      )}
    </View>
  );
};

const shadow = Platform.select({
  web:     { boxShadow: '0px 4px 16px rgba(0,0,0,0.05)' } as any,
  default: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#EFF2F7', marginBottom: 0,
    ...shadow as any,
    ...Platform.select({ web: { contain: 'layout style', overflow: 'hidden' } as any }),
  },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox:     { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 14, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  countBadge:  { backgroundColor: COLORS.secondary + '20', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 },
  countTxt:    { fontSize: 10, fontFamily: 'PoppinsBold', color: COLORS.secondary },
  clearBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clearTxt:    { fontSize: 11, fontFamily: 'PoppinsMedium', color: '#EF4444' },
  seeMoreBtn:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeMoreTxt:  { fontSize: 11, fontFamily: 'PoppinsMedium', color: COLORS.primary },
  divider:     { height: 1, backgroundColor: '#F1F5F9', marginBottom: 4 },

  empty:    { paddingVertical: 28, alignItems: 'center', gap: 8 },
  emptyTxt: { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#94A3B8' },

  // 2-kolom layout
  grid:     { flexDirection: 'row', gap: 0 },
  col:      { flex: 1, paddingHorizontal: 4 },
  vDivider: { width: 1, backgroundColor: '#F1F5F9', marginHorizontal: 8 },
});

export const WebActivityRow = React.memo(_WebActivityRow);
export default WebActivityRow;