/**
 * WebActivityRow.tsx — Aktivitas Terbaru full-width
 *
 * Grid 2 kolom SEJAJAR: menggunakan pendekatan "pair rows" —
 * setiap baris adalah View flexDirection:'row' yang berisi
 * item kiri dan item kanan, sehingga tinggi baris selalu sama.
 *
 * Layout per item:
 *   [dot]  [waktu + pesan + userName]  [pill kategori rata kanan]
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import {
  ShoppingCart, Package, Users, Settings,
  Trash2, LogIn, LogOut, ChevronRight,
  Activity as ActivityIcon,
} from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import { Activity } from '@/types/activity';
import { DashboardService } from '@services/dashboardService';

interface Props {
  activities:      Activity[];
  currentUserName: string;
  tenantId:        string;
  isLoading?:      boolean;
  onSeeMore?:      () => void;
}

const TYPE_MAP: Record<string, { color: string; bg: string; label: string }> = {
  TRANSAKSI:     { color: '#00A79D', bg: '#E6F7F6', label: 'Transaksi' },
  TAMBAH_PRODUK: { color: '#3B82F6', bg: '#EFF6FF', label: 'Produk Baru' },
  EDIT_PRODUK:   { color: '#F59E0B', bg: '#FFFBEB', label: 'Edit Produk' },
  HAPUS_PRODUK:  { color: '#EF4444', bg: '#FEF2F2', label: 'Hapus Produk' },
  STOK_MASUK:    { color: '#3B82F6', bg: '#EFF6FF', label: 'Stok Masuk' },
  MEMBER:        { color: '#8B5CF6', bg: '#F5F3FF', label: 'Member' },
  SETTINGS:      { color: '#64748B', bg: '#F1F5F9', label: 'Pengaturan' },
  LOGIN:         { color: '#10B981', bg: '#ECFDF5', label: 'Login' },
  LOGOUT:        { color: '#F59E0B', bg: '#FFFBEB', label: 'Logout' },
};
const DEFAULT_TYPE = { color: '#94A3B8', bg: '#F8FAFC', label: 'Aktivitas' };
const getType = (t?: string) => {
  if (!t) return DEFAULT_TYPE;
  const k = Object.keys(TYPE_MAP).find(k => t.toUpperCase().includes(k));
  return k ? TYPE_MAP[k] : DEFAULT_TYPE;
};

// ── Single item — fixed height agar pair row sejajar ────────
interface ItemProps {
  activity: Activity & { time?: string };
  currentUserName: string;
}
const Item: React.FC<ItemProps> = ({ activity, currentUserName }) => {
  const ti   = getType(activity.type);
  const isMe = activity.userName === currentUserName;
  return (
    <View style={item.wrap}>
      {/* Dot */}
      <View style={[item.dot, { backgroundColor: ti.color }]} />
      {/* Teks */}
      <View style={item.main}>
        <View style={item.topRow}>
          <Text style={item.time}>{activity.time ?? 'Baru saja'}</Text>
          {isMe && <View style={item.me}><Text style={item.meTxt}>Saya</Text></View>}
        </View>
        <Text style={item.msg} numberOfLines={2}>{activity.message}</Text>
        {activity.userName
          ? <Text style={item.user} numberOfLines={1}>{activity.userName}</Text>
          : null}
      </View>
      {/* Pill kategori — lebar tetap, teks rata kanan */}
      <View style={[item.pill, { backgroundColor: ti.bg, borderColor: ti.color + '55' }]}>
        <Text style={[item.pillTxt, { color: ti.color }]} numberOfLines={1}>{ti.label}</Text>
      </View>
    </View>
  );
};

// Item kosong — placeholder agar kolom kanan tidak kosong-melompong
const EmptyItem: React.FC = () => <View style={item.empty} />;

const item = StyleSheet.create({
  wrap:    {
    flex: 1,                        // ambil setengah lebar row
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 9,
    minHeight: 60,                  // tinggi minimum konsisten
  },
  empty:   { flex: 1, minHeight: 60 },   // placeholder tinggi sama
  dot:     { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  main:    { flex: 1, gap: 1 },
  topRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  time:    { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  me:      { backgroundColor: COLORS.secondary + '18', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6 },
  meTxt:   { fontSize: 9, fontFamily: 'PoppinsSemiBold', color: COLORS.secondary },
  msg:     { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#334155', lineHeight: 16 },
  user:    { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  pill:    { width: 82, borderWidth: 1, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, alignItems: 'center', flexShrink: 0, marginTop: 3 },
  pillTxt: { fontSize: 10, fontFamily: 'PoppinsSemiBold', textAlign: 'center' },
});

// ── Main ─────────────────────────────────────────────────────
const _WebActivityRow: React.FC<Props> = ({
  activities, currentUserName, tenantId, isLoading, onSeeMore,
}) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const handleClear = () => {
    Alert.alert('Hapus Riwayat', 'Hapus semua log aktivitas?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try { await DashboardService.clearAllActivities(tenantId); }
          catch { Alert.alert('Gagal', 'Terjadi kesalahan.'); }
        }},
    ]);
  };

  const live = activities.map(a => ({
    ...a,
    time: a.createdAt
      ? DashboardService.formatRelativeTime(a.createdAt.toDate())
      : 'Baru saja',
  }));

  // Susun data sebagai pasangan [kiri, kanan?]
  // Setiap "pair row" adalah View row yang berisi 2 item sejajar
  const pairs: Array<[typeof live[0], typeof live[0] | null]> = [];
  for (let i = 0; i < live.length; i += 2) {
    pairs.push([live[i], live[i + 1] ?? null]);
  }

  return (
    <View style={st.card}>
      {/* Header */}
      <View style={st.header}>
        <View style={st.hLeft}>
          <View style={[st.hIcon, { backgroundColor: COLORS.secondary + '18' }]}>
            <ActivityIcon size={14} color={COLORS.secondary} />
          </View>
          <Text style={st.title}>Aktivitas Terbaru</Text>
          {live.length > 0 && (
            <View style={st.badge}><Text style={st.badgeTxt}>{live.length}</Text></View>
          )}
        </View>
        <View style={st.hRight}>
          {live.length > 0 && (
            <TouchableOpacity style={st.clearBtn} onPress={handleClear}>
              <Trash2 size={12} color="#EF4444" />
              <Text style={st.clearTxt}>Hapus log</Text>
            </TouchableOpacity>
          )}
          {onSeeMore && (
            <TouchableOpacity style={st.moreBtn} onPress={onSeeMore}>
              <Text style={st.moreTxt}>Lihat semua</Text>
              <ChevronRight size={12} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={st.divider} />

      {live.length === 0 ? (
        <View style={st.empty}>
          <ActivityIcon size={24} color="#E2E8F0" strokeWidth={1.5} />
          <Text style={st.emptyTxt}>Belum ada aktivitas periode ini</Text>
        </View>
      ) : (
        <View style={st.list}>
          {pairs.map(([left, right], idx) => (
            <View
              key={idx}
              style={[
                st.pairRow,
                idx < pairs.length - 1 && st.pairBorder,
              ]}
            >
              {/* Item kiri */}
              <Item activity={left} currentUserName={currentUserName} />

              {/* Divider vertikal */}
              <View style={st.vDiv} />

              {/* Item kanan — atau placeholder kosong */}
              {right
                ? <Item activity={right} currentUserName={currentUserName} />
                : <EmptyItem />
              }
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const shadow = Platform.select({
  web:     { boxShadow: '0px 4px 16px rgba(0,0,0,0.05)' } as any,
  default: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
});
const st = StyleSheet.create({
  card:      { backgroundColor: '#FFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#EFF2F7', ...shadow as any, ...Platform.select({ web: { contain: 'layout style', overflow: 'hidden' } as any }) },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  hLeft:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hRight:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hIcon:     { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: 14, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  badge:     { backgroundColor: COLORS.secondary + '20', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 },
  badgeTxt:  { fontSize: 10, fontFamily: 'PoppinsBold', color: COLORS.secondary },
  clearBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clearTxt:  { fontSize: 11, fontFamily: 'PoppinsMedium', color: '#EF4444' },
  moreBtn:   { flexDirection: 'row', alignItems: 'center', gap: 2 },
  moreTxt:   { fontSize: 11, fontFamily: 'PoppinsMedium', color: COLORS.primary },
  divider:   { height: 1, backgroundColor: '#F1F5F9', marginBottom: 2 },
  empty:     { paddingVertical: 28, alignItems: 'center', gap: 8 },
  emptyTxt:  { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
  list:      {},
  // Setiap baris adalah pasangan kiri+kanan dalam satu View row
  pairRow:   { flexDirection: 'row', alignItems: 'stretch' },
  pairBorder:{ borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  vDiv:      { width: 1, backgroundColor: '#F1F5F9', marginVertical: 6 },
});

export const WebActivityRow = React.memo(_WebActivityRow);
export default WebActivityRow;