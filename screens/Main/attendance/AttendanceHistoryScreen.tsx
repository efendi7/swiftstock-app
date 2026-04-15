/**
 * AttendanceHistoryScreen.tsx
 * Riwayat kehadiran kasir dari awal — list kecil, bisa filter per bulan.
 * Bisa dipakai kasir (lihat miliknya) & admin (lihat semua / per kasir via params).
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import {
  ChevronLeft, CheckCircle2, AlertCircle, XCircle,
  Clock, LogIn, LogOut, CalendarDays,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '@constants/colors';
import { CashierService, AttendanceRecord, AttendanceStatus } from '@services/cashierService';
import { useAuth } from '@hooks/auth/useAuth';

const PRIMARY = COLORS.primary;

const STATUS_CFG: Record<AttendanceStatus, {
  label: string; color: string; bg: string; Icon: any;
}> = {
  hadir: { label: 'Hadir', color: '#10B981', bg: '#F0FDF4', Icon: CheckCircle2 },
  izin:  { label: 'Izin',  color: '#F59E0B', bg: '#FFFBEB', Icon: AlertCircle  },
  alpha: { label: 'Alpha', color: '#EF4444', bg: '#FEF2F2', Icon: XCircle      },
};

// Ambil list bulan dari createdAt sampai sekarang
const getMonthOptions = (startDate?: Date): { label: string; value: string }[] => {
  const months: { label: string; value: string }[] = [];
  const start = startDate ? new Date(startDate) : new Date();
  start.setDate(1);
  const now = new Date();
  now.setDate(1);
  while (start <= now) {
    const value = start.toISOString().slice(0, 7); // "2026-03"
    const label = start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    months.unshift({ label, value });
    start.setMonth(start.getMonth() + 1);
  }
  return months;
};

export const AttendanceHistoryScreen = () => {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { user, tenantId } = useAuth();

  // Bisa dipanggil dari admin dengan params cashierId & cashierName
  const targetId   = route.params?.cashierId   ?? user?.uid;
  const targetName = route.params?.cashierName ?? user?.displayName ?? 'Saya';

  const [records,      setRecords]      = useState<AttendanceRecord[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedMonth,setSelectedMonth]= useState<string>(new Date().toISOString().slice(0, 7));
  const [monthOptions, setMonthOptions] = useState<{ label: string; value: string }[]>([]);
  const [summary,      setSummary]      = useState({ hadir: 0, izin: 0, alpha: 0 });

  // Muat bulan yang tersedia berdasarkan joinDate kasir
  useEffect(() => {
    if (!tenantId || !targetId) return;
    CashierService.getCashierById(tenantId, targetId).then(c => {
      const joinDate = c?.createdAt?.toDate?.() ?? new Date();
      setMonthOptions(getMonthOptions(joinDate));
    });
  }, [tenantId, targetId]);

  const loadRecords = useCallback(async () => {
    if (!tenantId || !targetId) return;
    setLoading(true);
    try {
      // Ambil semua (max 365) lalu filter per bulan di client
      const all = await CashierService.getAttendanceHistory(tenantId, targetId, 365);
      const filtered = all.filter(r => r.date.startsWith(selectedMonth));
      setRecords(filtered);
      setSummary(filtered.reduce(
        (acc, r) => { acc[r.status]++; return acc; },
        { hadir: 0, izin: 0, alpha: 0 }
      ));
    } finally {
      setLoading(false);
    }
  }, [tenantId, targetId, selectedMonth]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label ?? selectedMonth;

  const renderItem = ({ item: r }: { item: AttendanceRecord }) => {
    const cfg = STATUS_CFG[r.status];
    const d   = new Date(r.date);
    const ci  = r.checkIn?.toDate().toLocaleTimeString('id-ID',  { hour: '2-digit', minute: '2-digit' });
    const co  = r.checkOut?.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // Durasi kerja
    const dur = (() => {
      if (!r.checkIn || !r.checkOut) return null;
      const mins = Math.floor((r.checkOut.toDate().getTime() - r.checkIn.toDate().getTime()) / 60000);
      return mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}j ${mins%60}m`;
    })();

    return (
      <View style={row.wrap}>
        {/* Tanggal */}
        <View style={row.dateCol}>
          <Text style={row.dayName}>{d.toLocaleDateString('id-ID', { weekday: 'short' })}</Text>
          <Text style={row.dateNum}>{d.getDate()}</Text>
        </View>

        {/* Status badge */}
        <View style={[row.badge, { backgroundColor: cfg.bg }]}>
          <cfg.Icon size={12} color={cfg.color} />
          <Text style={[row.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>

        {/* Waktu masuk–keluar */}
        <View style={row.timeCol}>
          {ci ? (
            <View style={row.timeRow}>
              <LogIn size={11} color="#10B981" />
              <Text style={row.timeText}>{ci}</Text>
              {co && <><LogOut size={11} color="#EF4444" /><Text style={row.timeText}>{co}</Text></>}
              {dur && <View style={row.durPill}><Text style={row.durText}>{dur}</Text></View>}
              {(r as any).earlyLeave && (
                <View style={row.earlyPill}><Text style={row.earlyText}>Pulang awal</Text></View>
              )}
            </View>
          ) : r.note ? (
            <Text style={row.noteText} numberOfLines={1}>"{r.note}"</Text>
          ) : (
            <Text style={row.emptyText}>—</Text>
          )}
          {ci && r.note ? <Text style={row.noteText} numberOfLines={1}>"{r.note}"</Text> : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Riwayat Kehadiran</Text>
          <Text style={s.headerSub}>{targetName}</Text>
        </View>
      </View>

      {/* Filter bulan — scroll horizontal */}
      <View style={s.monthBar}>
        <FlatList
          horizontal
          data={monthOptions}
          keyExtractor={m => m.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item: m }) => (
            <TouchableOpacity
              style={[s.monthChip, m.value === selectedMonth && s.monthChipActive]}
              onPress={() => setSelectedMonth(m.value)}
            >
              <Text style={[s.monthChipText, m.value === selectedMonth && s.monthChipTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Summary bar */}
      <View style={s.summaryBar}>
        {(['hadir','izin','alpha'] as AttendanceStatus[]).map(st => {
          const cfg = STATUS_CFG[st];
          return (
            <View key={st} style={[s.sumChip, { backgroundColor: cfg.bg }]}>
              <cfg.Icon size={13} color={cfg.color} />
              <Text style={[s.sumVal, { color: cfg.color }]}>{summary[st]}</Text>
              <Text style={[s.sumLabel, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          );
        })}
        <View style={s.sumChip}>
          <CalendarDays size={13} color="#64748B" />
          <Text style={[s.sumVal, { color: '#64748B' }]}>{records.length}</Text>
          <Text style={[s.sumLabel, { color: '#64748B' }]}>Tercatat</Text>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 60 }} />
      ) : records.length === 0 ? (
        <View style={s.empty}>
          <CalendarDays size={40} color="#CBD5E1" strokeWidth={1.5} />
          <Text style={s.emptyText}>Tidak ada catatan di {selectedMonthLabel}</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={r => r.date}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        />
      )}
    </SafeAreaView>
  );
};

// ── Row styles ─────────────────────────────────────────────
const row = StyleSheet.create({
  wrap:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  dateCol:  { width: 36, alignItems: 'center' },
  dayName:  { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  dateNum:  { fontSize: 15, fontFamily: 'PoppinsBold', color: '#1E293B' },
  badge:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, minWidth: 60, justifyContent: 'center' },
  badgeText:{ fontSize: 11, fontFamily: 'PoppinsBold' },
  timeCol:  { flex: 1, gap: 2 },
  timeRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' as any },
  timeText: { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#475569' },
  durPill:  { backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  durText:  { fontSize: 10, fontFamily: 'PoppinsBold', color: '#3B82F6' },
  noteText:  { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', fontStyle: 'italic' },
  earlyPill: { backgroundColor: '#FFFBEB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  earlyText: { fontSize: 10, fontFamily: 'PoppinsBold', color: '#D97706' },
  emptyText:{ fontSize: 12, color: '#CBD5E1', fontFamily: 'PoppinsRegular' },
});

// ── Screen styles ──────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F5F6FA' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: PRIMARY },
  backBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontFamily: 'PoppinsBold', color: '#FFF' },
  headerSub:   { fontSize: 12, fontFamily: 'PoppinsRegular', color: 'rgba(255,255,255,0.7)' },

  monthBar: { backgroundColor: PRIMARY, paddingBottom: 14 },
  monthChip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' },
  monthChipActive:   { backgroundColor: '#FFF' },
  monthChipText:     { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: 'rgba(255,255,255,0.8)' },
  monthChipTextActive:{ color: PRIMARY, fontFamily: 'PoppinsBold' },

  summaryBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F5F6FA', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  sumChip:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10, backgroundColor: '#FFF' },
  sumVal:     { fontSize: 14, fontFamily: 'PoppinsBold', color: '#1E293B' },
  sumLabel:   { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#64748B' },

  list:  { padding: 12, paddingBottom: 32 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80 },
  emptyText: { fontSize: 14, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
});

export default AttendanceHistoryScreen;