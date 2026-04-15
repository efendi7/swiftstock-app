/**
 * CashierDetailModal.tsx — Web admin
 * - Hapus jam duplikat di atas tombol catat
 * - Koreksi manual collapsible (toggle show/hide)
 * - Riwayat 30 hari: grid compact 4 kolom
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Alert,
  ScrollView, ActivityIndicator, Animated, TextInput, Platform,
} from 'react-native';
import {
  X, Calendar, ShoppingCart, TrendingUp,
  History, ChevronRight, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, XCircle, Edit3, RotateCcw,
} from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import {
  CashierService, Cashier, AttendanceRecord,
  CashierStats, AttendanceStatus, toDateKey,
} from '@services/cashierService';
import { AttendanceService } from '@services/attendanceService';
import { useAuth } from '@hooks/auth/useAuth';

const PRIMARY = '#1C3A5A';

const STATUS_CONFIG: Record<AttendanceStatus, {
  label: string; color: string; bg: string; Icon: any;
}> = {
  hadir: { label: 'Hadir', color: '#10B981', bg: '#F0FDF4', Icon: CheckCircle2 },
  izin:  { label: 'Izin',  color: '#F59E0B', bg: '#FFFBEB', Icon: AlertCircle  },
  alpha: { label: 'Alpha', color: '#EF4444', bg: '#FEF2F2', Icon: XCircle      },
};

interface Props {
  visible:        boolean;
  cashier:        Cashier | null;
  tenantId:       string;
  onClose:        () => void;
  onViewHistory?: (cashier: Cashier) => void;
}

export const CashierDetailModal: React.FC<Props> = ({
  visible, cashier, tenantId, onClose, onViewHistory,
}) => {
  const { user } = useAuth();

  const [stats,         setStats]         = useState<CashierStats | null>(null);
  const [history,       setHistory]       = useState<AttendanceRecord[]>([]);
  const [today,         setToday]         = useState<AttendanceRecord | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [resetting,     setResetting]     = useState(false);

  // Koreksi manual — collapsible, hanya muncul jika kasir belum absen
  const [showKoreksi,  setShowKoreksi]  = useState(false);
  const [selStatus,    setSelStatus]    = useState<AttendanceStatus>('hadir');
  const [note,         setNote]         = useState('');
  const [noteFocus,    setNoteFocus]    = useState(false);

  const scaleAnim   = React.useRef(new Animated.Value(0.95)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  const handleViewHistory = () => {
    if (cashier) onViewHistory?.(cashier);
    onClose();
  };

  const load = useCallback(async () => {
    if (!cashier || !tenantId) return;
    setLoading(true);
    try {
      const [s, h, t] = await Promise.all([
        CashierService.getCashierStats(tenantId, cashier.id),
        CashierService.getAttendanceHistory(tenantId, cashier.id, 30),
        CashierService.getAttendance(tenantId, cashier.id, toDateKey()),
      ]);
      setStats(s);
      setHistory(h);
      setToday(t);
      setSelStatus(t?.status ?? 'hadir');
      setNote(t?.note ?? '');
      setShowKoreksi(false);
    } finally {
      setLoading(false);
    }
  }, [cashier, tenantId]);

  useEffect(() => {
    if (visible) {
      load();
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scaleAnim,   { toValue: 1, friction: 8, tension: 100, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim,   { toValue: 0.95, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleResetAttendance = async () => {
    if (!cashier) return;
    setResetting(true);
    try {
      await AttendanceService.resetAttendance(tenantId, cashier.id, toDateKey(), user?.uid || 'admin');
      await load();
      setShowKoreksi(false);
    } finally {
      setResetting(false);
    }
  };

  const handleSyncUser = async () => {
    if (!cashier) return;
    try {
      await CashierService.syncUserDoc(tenantId, cashier.id);
      Alert.alert('Sukses', 'Data kasir berhasil disinkronkan ke /users');
    } catch (e: any) {
      Alert.alert('Gagal', e.message);
    }
  };

  const handleSaveKoreksi = async () => {
    if (!cashier) return;
    if (selStatus !== 'hadir' && !note.trim()) return;
    setSaving(true);
    try {
      await CashierService.saveAttendance(tenantId, cashier.id, {
        date:       toDateKey(),
        status:     selStatus,
        checkIn:    today?.checkIn  ?? null,
        checkOut:   today?.checkOut ?? null,
        note:       note.trim(),
        recordedBy: user?.uid || 'admin',
      });
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (!visible || !cashier) return null;

  const joinDate = stats?.joinDate?.toDate
    ? stats.joinDate.toDate().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  // Status hari ini
  const todayCfg   = today?.status ? STATUS_CONFIG[today.status] : null;
  const todayCheckin  = today?.checkIn?.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const todayCheckout = today?.checkOut?.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[s.overlay, { opacity: opacityAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject as any} onPress={onClose} activeOpacity={1} />

        <Animated.View style={[s.card, { transform: [{ scale: scaleAnim }] }]}>

          {/* ── Header ── */}
          <View style={s.header}>
            <View style={s.avatarBig}>
              <Text style={s.avatarBigText}>{cashier.displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{cashier.displayName}</Text>
              <Text style={s.email}>{cashier.email}</Text>
              <View style={s.joinRow}>
                <Calendar size={11} color="#94A3B8" />
                <Text style={s.joinText}>Bergabung {joinDate}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
              {/* Tombol sync — untuk fix data /users yang tidak sinkron */}
              <TouchableOpacity
                style={s.syncBtn}
                onPress={handleSyncUser}
              >
                <Text style={s.syncBtnText}>Sync</Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.secondary} style={{ margin: 40 }} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>

              {/* ── Stat cards ── */}
              <View style={s.statRow}>
                <StatCard
                  icon={<ShoppingCart size={16} color={PRIMARY} />}
                  label="Total Transaksi"
                  value={stats?.totalTransactions?.toLocaleString('id-ID') ?? '0'}
                  bg="rgba(28,58,90,0.06)"
                />
                <StatCard
                  icon={<TrendingUp size={16} color="#10B981" />}
                  label="Total Omset"
                  value={`Rp ${(stats?.totalRevenue ?? 0).toLocaleString('id-ID')}`}
                  bg="#F0FDF4"
                  valueColor="#10B981"
                />
              </View>

              {/* ── Absensi bulan ini ── */}
              <SectionTitle title="Absensi Bulan Ini" />
              <View style={s.attRow}>
                {(['hadir','izin','alpha'] as AttendanceStatus[]).map(st => {
                  const cfg = STATUS_CONFIG[st];
                  const val = stats?.attendance[st] ?? 0;
                  return (
                    <View key={st} style={[s.attCard, { backgroundColor: cfg.bg }]}>
                      <cfg.Icon size={18} color={cfg.color} />
                      <Text style={[s.attVal, { color: cfg.color }]}>{val}</Text>
                      <Text style={[s.attLabel, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  );
                })}
              </View>

              {/* ── Kehadiran hari ini ── */}
              <SectionTitle title={`Kehadiran Hari Ini — ${todayStr}`} />
              <View style={s.todayCard}>

                {/* Status hari ini — satu baris ringkas */}
                <View style={s.todayStatusRow}>
                  {todayCfg ? (
                    <>
                      <View style={[s.todayBadge, { backgroundColor: todayCfg.bg }]}>
                        <todayCfg.Icon size={13} color={todayCfg.color} />
                        <Text style={[s.todayBadgeText, { color: todayCfg.color }]}>
                          {todayCfg.label}
                        </Text>
                      </View>
                      {todayCheckin && (
                        <Text style={s.todayTime}>
                          {todayCheckin}{todayCheckout ? ` → ${todayCheckout}` : ' →  ...'}
                        </Text>
                      )}
                      {today?.note ? (
                        <Text style={s.todayNote} numberOfLines={1}>"{today.note}"</Text>
                      ) : null}
                    </>
                  ) : (
                    <Text style={s.todayEmpty}>Belum ada catatan hari ini</Text>
                  )}

                  {/* Tombol koreksi — toggle collapsible */}
                  <TouchableOpacity
                    style={s.koreksiToggle}
                    onPress={() => setShowKoreksi(v => !v)}
                  >
                    <Edit3 size={13} color={PRIMARY} />
                    <Text style={s.koreksiToggleText}>Koreksi</Text>
                    {showKoreksi
                      ? <ChevronUp size={13} color={PRIMARY} />
                      : <ChevronDown size={13} color={PRIMARY} />
                    }
                  </TouchableOpacity>

                  {/* Tombol reset — hanya tampil jika sudah check-in */}
                  {today?.checkIn && (
                    <TouchableOpacity
                      style={s.resetBtn}
                      onPress={handleResetAttendance}
                      disabled={resetting}
                    >
                      {resetting
                        ? <ActivityIndicator size="small" color="#EF4444" />
                        : <>
                            <RotateCcw size={13} color="#EF4444" />
                            <Text style={s.resetBtnText}>Reset</Text>
                          </>
                      }
                    </TouchableOpacity>
                  )}
                </View>

                {/* Form koreksi — collapsible */}
                {showKoreksi && (
                  <View style={s.koreksiBox}>
                    <View style={s.statusRow}>
                      {(['hadir','izin','alpha'] as AttendanceStatus[]).map(st => {
                        const cfg    = STATUS_CONFIG[st];
                        const active = selStatus === st;
                        return (
                          <TouchableOpacity
                            key={st}
                            style={[s.statusBtn, active && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                            onPress={() => setSelStatus(st)}
                          >
                            <cfg.Icon size={12} color={active ? '#FFF' : cfg.color} />
                            <Text style={[s.statusBtnText, { color: active ? '#FFF' : cfg.color }]}>
                              {cfg.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {selStatus !== 'hadir' && (
                      <View style={[s.noteWrap, noteFocus && s.noteWrapFocus]}>
                        <TextInput
                          style={[s.noteInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                          placeholder={selStatus === 'izin' ? 'Alasan izin...' : 'Keterangan alpha...'}
                          placeholderTextColor="#94A3B8"
                          value={note}
                          onChangeText={setNote}
                          multiline numberOfLines={2}
                          onFocus={() => setNoteFocus(true)}
                          onBlur={() => setNoteFocus(false)}
                        />
                      </View>
                    )}

                    <TouchableOpacity
                      style={[s.saveBtn, (saving || (selStatus !== 'hadir' && !note.trim())) && { opacity: 0.5 }]}
                      onPress={handleSaveKoreksi}
                      disabled={saving || (selStatus !== 'hadir' && !note.trim())}
                    >
                      {saving
                        ? <ActivityIndicator size="small" color="#FFF" />
                        : <Text style={s.saveBtnText}>Simpan Koreksi</Text>
                      }
                    </TouchableOpacity>
                  </View>
                )}

                {/* Lihat riwayat lengkap */}
                <TouchableOpacity style={s.historyBtn} onPress={handleViewHistory}>
                  <History size={13} color={PRIMARY} />
                  <Text style={s.historyBtnText}>Lihat Riwayat Lengkap</Text>
                  <ChevronRight size={13} color={PRIMARY} />
                </TouchableOpacity>
              </View>

              {/* ── Riwayat 30 hari — grid 4 kolom compact ── */}
              {history.length > 0 && (
                <>
                  <SectionTitle title="Riwayat 30 Hari Terakhir" />
                  <View style={s.gridWrap}>
                    {history.map(r => {
                      const cfg = STATUS_CONFIG[r.status];
                      const d   = new Date(r.date);
                      const ci  = r.checkIn?.toDate().toLocaleTimeString('id-ID',  { hour: '2-digit', minute: '2-digit' });
                      const co  = r.checkOut?.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <View key={r.date} style={[s.gridCell, { backgroundColor: cfg.bg }]}>
                          {/* Tanggal */}
                          <Text style={s.gridDate}>
                            {d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </Text>
                          {/* Badge status */}
                          <View style={s.gridBadge}>
                            <cfg.Icon size={10} color={cfg.color} />
                            <Text style={[s.gridStatus, { color: cfg.color }]}>{cfg.label}</Text>
                          </View>
                          {/* Jam */}
                          {ci ? (
                            <Text style={s.gridTime}>{ci}{co ? `\n${co}` : ''}</Text>
                          ) : r.note ? (
                            <Text style={s.gridNote} numberOfLines={2}>{r.note}</Text>
                          ) : null}
                          {/* Pulang awal indicator */}
                          {(r as any).earlyLeave && (
                            <View style={s.earlyDot} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                  {/* Legend pulang awal */}
                  <View style={s.legendRow}>
                    <View style={s.earlyDot} />
                    <Text style={s.legendText}>Pulang sebelum shift selesai</Text>
                  </View>
                </>
              )}

            </ScrollView>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ── Sub-components ─────────────────────────────────────────

const SectionTitle = ({ title }: { title: string }) => (
  <Text style={s.sectionTitle}>{title}</Text>
);

const StatCard = ({ icon, label, value, bg, valueColor }: {
  icon: React.ReactNode; label: string; value: string; bg: string; valueColor?: string;
}) => (
  <View style={[s.statCard, { backgroundColor: bg }]}>
    {icon}
    <Text style={[s.statVal, valueColor && { color: valueColor }]}>{value}</Text>
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

// ── Styles ─────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  card:     { width: 560, maxWidth: '95%' as any, maxHeight: '90%' as any, borderRadius: 20, backgroundColor: '#FFF', overflow: 'hidden' },

  header:        { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#FAFBFC' },
  avatarBig:     { width: 52, height: 52, borderRadius: 16, backgroundColor: PRIMARY + '18', alignItems: 'center', justifyContent: 'center' },
  avatarBigText: { fontSize: 22, fontFamily: 'PoppinsBold', color: PRIMARY },
  name:          { fontSize: 15, fontFamily: 'PoppinsBold', color: '#1E293B' },
  email:         { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#64748B', marginTop: 1 },
  joinRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  joinText:      { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  closeBtn:      { width: 32, height: 32, borderRadius: 9, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },

  body: { padding: 18, gap: 4, paddingBottom: 28 },

  statRow:   { flexDirection: 'row', gap: 10, marginBottom: 6 },
  statCard:  { flex: 1, borderRadius: 12, padding: 14, alignItems: 'flex-start', gap: 4 },
  statVal:   { fontSize: 16, fontFamily: 'PoppinsBold', color: PRIMARY, marginTop: 2 },
  statLabel: { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#64748B' },

  sectionTitle: { fontSize: 11, fontFamily: 'PoppinsBold', color: '#94A3B8', textTransform: 'uppercase' as any, letterSpacing: 0.6, marginTop: 12, marginBottom: 8 },

  attRow:   { flexDirection: 'row', gap: 8, marginBottom: 4 },
  attCard:  { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  attVal:   { fontSize: 22, fontFamily: 'PoppinsBold' },
  attLabel: { fontSize: 11, fontFamily: 'PoppinsSemiBold' },

  // Today card
  todayCard:       { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
  todayStatusRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' as any },
  todayBadge:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  todayBadgeText:  { fontSize: 12, fontFamily: 'PoppinsBold' },
  todayTime:       { fontSize: 13, fontFamily: 'PoppinsMedium', color: '#475569', flex: 1 },
  todayNote:       { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', fontStyle: 'italic', flex: 1 },
  todayEmpty:      { fontSize: 13, fontFamily: 'PoppinsRegular', color: '#94A3B8', flex: 1 },

  koreksiToggle:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: PRIMARY + '0D', borderWidth: 1, borderColor: PRIMARY + '20', cursor: 'pointer' as any },
  koreksiToggleText: { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: PRIMARY },

  koreksiBox:  { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12, gap: 10 },
  statusRow:   { flexDirection: 'row', gap: 8 },
  statusBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
  statusBtnText:{ fontSize: 12, fontFamily: 'PoppinsSemiBold' },
  noteWrap:    { backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8 },
  noteWrapFocus:{ borderColor: PRIMARY },
  noteInput:   { fontSize: 13, fontFamily: 'PoppinsRegular', color: '#1E293B', minHeight: 48 },
  saveBtn:     { backgroundColor: PRIMARY, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { fontSize: 13, fontFamily: 'PoppinsBold', color: '#FFF' },

  syncBtn:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  syncBtnText:    { fontSize: 9, fontFamily: 'PoppinsSemiBold', color: '#94A3B8' },
  resetBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', cursor: 'pointer' as any },
  resetBtnText:    { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#EF4444' },
  historyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: PRIMARY + '08', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: PRIMARY + '20', cursor: 'pointer' as any },
  historyBtnText: { flex: 1, fontSize: 13, fontFamily: 'PoppinsSemiBold', color: PRIMARY },

  // Grid riwayat 4 kolom
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap' as any, gap: 6 },
  gridCell: {
    width: '23%' as any, borderRadius: 10, padding: 9, gap: 3,
    minWidth: 80, position: 'relative' as any,
  },
  gridDate:   { fontSize: 11, fontFamily: 'PoppinsBold', color: '#475569' },
  gridBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  gridStatus: { fontSize: 10, fontFamily: 'PoppinsSemiBold' },
  gridTime:   { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#64748B', lineHeight: 14 },
  gridNote:   { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8', fontStyle: 'italic', lineHeight: 13 },
  earlyDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B', position: 'absolute' as any, top: 6, right: 6 },

  legendRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  legendText:  { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
});

export default CashierDetailModal;