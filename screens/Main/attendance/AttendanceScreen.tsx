/**
 * AttendanceScreen.tsx — mobile kasir
 * Check-in/out hanya bisa sesuai jam shift. Admin tidak ada tombol aksi.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, StatusBar, ActivityIndicator, TextInput,
  Modal, Platform, Animated,
} from 'react-native';
import {
  LogIn, LogOut, Calendar, Clock, CheckCircle2,
  AlertCircle, XCircle, FileText, ChevronRight,
  ShoppingCart, Info, History,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '@constants/colors';
import { useAttendance } from '@hooks/useAttendance';
import { useAuth } from '@hooks/auth/useAuth';
import {
  CashierService, AttendanceRecord,
  CashierStats, toDateKey,
} from '@services/cashierService';

const PRIMARY = COLORS.primary;

export const AttendanceScreen = () => {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, tenantId } = useAuth();

  const {
    cashier, today, loading, actionLoading, error,
    validation, hasCheckedIn, hasCheckedOut, isOnLeave,
    checkIn, checkOut, submitIzin, reload, dateKey,
  } = useAttendance();

  const [stats,        setStats]        = useState<CashierStats | null>(null);
  const [showIzinModal,setShowIzinModal]= useState(false);
  const [izinNote,     setIzinNote]     = useState('');
  const [noteFocus,    setNoteFocus]    = useState(false);

  // Pulse animasi pada tombol check-in saat belum check-in
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (hasCheckedIn || isOnLeave) return;
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.05, duration: 900, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [hasCheckedIn, isOnLeave]);

  useEffect(() => {
    if (!user?.uid || !tenantId) return;
    CashierService.getCashierStats(tenantId, user.uid).then(setStats).catch(() => {});
  }, [user?.uid, tenantId]);

  const handleIzin = async () => {
    if (!izinNote.trim()) return;
    await submitIzin(izinNote);
    setShowIzinModal(false);
    setIzinNote('');
  };

  const checkInTime  = today?.checkIn?.toDate().toLocaleTimeString('id-ID',  { hour: '2-digit', minute: '2-digit' });
  const checkOutTime = today?.checkOut?.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const workDuration = (() => {
    if (!today?.checkIn) return null;
    const end  = today.checkOut?.toDate() ?? new Date();
    const mins = Math.floor((end.getTime() - today.checkIn.toDate().getTime()) / 60000);
    return mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}j ${mins%60}m`;
  })();

  const todayFmt = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  // Pesan error / info berdasarkan validasi shift
  const shiftInfoMsg = (() => {
    if (!cashier?.shift) return 'Shift belum diatur. Hubungi admin.';
    const { minutesUntilShift, shiftStartStr, shiftEndStr, checkInError } = validation;
    if (checkInError === 'too_early') {
      const h = Math.floor(minutesUntilShift / 60);
      const m = minutesUntilShift % 60;
      const durStr = h > 0 ? `${h}j ${m}m` : `${m} menit`;
      return `Shift dimulai ${shiftStartStr} · Bisa check-in ${durStr} lagi`;
    }
    if (validation.isLate) return `Terlambat · Shift ${shiftStartStr}–${shiftEndStr}`;
    return `Shift ${shiftStartStr}–${shiftEndStr}`;
  })();

  return (
    <SafeAreaView style={[s.safe, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>Selamat datang,</Text>
          <Text style={s.headerName} numberOfLines={1}>{user?.displayName || 'Kasir'}</Text>
        </View>
        {/* Tombol ke riwayat kehadiran */}
        <TouchableOpacity
          style={s.historyBtn}
          onPress={() => navigation.navigate('AttendanceHistory')}
        >
          <History size={16} color="#FFF" />
          <Text style={s.historyBtnText}>Riwayat</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* ── Kartu status hari ini ── */}
            <View style={s.statusCard}>
              <View style={s.statusCardTop}>
                <View>
                  <Text style={s.todayLabel}>{todayFmt}</Text>
                  {/* Info shift */}
                  <View style={s.shiftInfoRow}>
                    <Clock size={12} color={validation.isLate ? '#EF4444' : '#94A3B8'} />
                    <Text style={[s.shiftInfoText, validation.isLate && { color: '#EF4444' }]}>
                      {shiftInfoMsg}
                    </Text>
                  </View>
                </View>
                {/* Badge status */}
                <StatusBadge today={today} isOnLeave={isOnLeave} hasCheckedIn={hasCheckedIn} hasCheckedOut={hasCheckedOut} />
              </View>

              {/* Waktu masuk & keluar */}
              {(hasCheckedIn || hasCheckedOut) && (
                <View style={s.timeRow}>
                  <TimeBox icon={<LogIn  size={14} color="#10B981" />} label="Masuk"  value={checkInTime  ?? '—'} />
                  {workDuration && (
                    <View style={s.durationPill}>
                      <Clock size={12} color="#3B82F6" />
                      <Text style={s.durationText}>{workDuration}</Text>
                    </View>
                  )}
                  <TimeBox icon={<LogOut size={14} color="#EF4444" />} label="Keluar" value={checkOutTime ?? '—'} />
                </View>
              )}

              {/* Warning telat / early */}
              {validation.isLate && hasCheckedIn && !hasCheckedOut && (
                <View style={s.warnBox}>
                  <AlertCircle size={13} color="#EF4444" />
                  <Text style={s.warnText}>Kamu terlambat masuk shift</Text>
                </View>
              )}
              {validation.isEarly && hasCheckedIn && !hasCheckedOut && (
                <View style={[s.warnBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                  <AlertCircle size={13} color="#F59E0B" />
                  <Text style={[s.warnText, { color: '#B45309' }]}>
                    {'Shift selesai ' + validation.shiftEndStr + ' · Pulang awal akan tercatat'}
                  </Text>
                </View>
              )}
            </View>

            {/* ── Error ── */}
            {!!error && (
              <View style={s.errorBox}>
                <XCircle size={14} color="#EF4444" />
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            {/* ── Tombol Check In / Check Out ── */}
            {!isOnLeave && cashier?.shift && (
              <View style={s.actionRow}>
                <Animated.View style={[{ flex: 1 }, !hasCheckedIn && { transform: [{ scale: pulseAnim }] }]}>
                  <TouchableOpacity
                    style={[s.actionBtn, s.checkInBtn,
                      (!validation.canCheckIn) && s.btnDisabled]}
                    onPress={checkIn}
                    disabled={!validation.canCheckIn || actionLoading}
                    activeOpacity={0.8}
                  >
                    {actionLoading && !hasCheckedIn
                      ? <ActivityIndicator color="#FFF" size="small" />
                      : <>
                          <LogIn size={24} color="#FFF" />
                          <Text style={s.actionBtnText}>Check In</Text>
                          <Text style={s.actionBtnSub}>
                            {hasCheckedIn ? checkInTime : validation.shiftStartStr}
                          </Text>
                        </>
                    }
                  </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity
                  style={[s.actionBtn, s.checkOutBtn,
                    (!validation.canCheckOut) && s.btnDisabled]}
                  onPress={checkOut}
                  disabled={!validation.canCheckOut || actionLoading}
                  activeOpacity={0.8}
                >
                  {actionLoading && hasCheckedIn && !hasCheckedOut
                    ? <ActivityIndicator color="#FFF" size="small" />
                    : <>
                        <LogOut size={24} color="#FFF" />
                        <Text style={s.actionBtnText}>Check Out</Text>
                        <Text style={s.actionBtnSub}>
                          {hasCheckedOut ? checkOutTime : validation.shiftEndStr}
                        </Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            )}

            {/* Tidak ada shift */}
            {!cashier?.shift && (
              <View style={s.noShiftCard}>
                <Info size={18} color="#94A3B8" />
                <Text style={s.noShiftText}>Kamu belum memiliki jadwal shift.</Text>
                <Text style={s.noShiftSub}>Hubungi admin untuk mengatur jadwal.</Text>
              </View>
            )}

            {/* ── Ajukan Izin ── */}
            {!hasCheckedIn && !isOnLeave && (
              <TouchableOpacity style={s.izinBtn} onPress={() => setShowIzinModal(true)}>
                <FileText size={15} color="#F59E0B" />
                <Text style={s.izinBtnText}>Ajukan Izin Hari Ini</Text>
                <ChevronRight size={15} color="#F59E0B" />
              </TouchableOpacity>
            )}

            {/* ── Mini stats ── */}
            {stats && (
              <View style={s.miniStats}>
                <MiniStat icon={<ShoppingCart size={15} color={PRIMARY} />}     label="Transaksi"      value={stats.totalTransactions.toLocaleString('id-ID')} bg="rgba(28,58,90,0.06)" />
                <MiniStat icon={<CheckCircle2 size={15} color="#10B981" />}     label="Hadir bln ini"  value={`${stats.attendance.hadir}x`}                    bg="#F0FDF4" valueColor="#10B981" />
                <MiniStat icon={<AlertCircle  size={15} color="#F59E0B" />}     label="Izin bln ini"   value={`${stats.attendance.izin}x`}                     bg="#FFFBEB" valueColor="#F59E0B" />
              </View>
            )}

          </>
        )}
      </ScrollView>

      {/* ── Modal Izin ── */}
      <Modal visible={showIzinModal} transparent animationType="slide" onRequestClose={() => setShowIzinModal(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject as any} onPress={() => setShowIzinModal(false)} />
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Ajukan Izin</Text>
            <Text style={s.modalSub}>Isi alasan izin. Admin akan menerima keterangan ini.</Text>
            <View style={[s.noteWrap, noteFocus && s.noteWrapFocus]}>
              <TextInput
                style={[s.noteInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                placeholder="Contoh: Sakit, urusan keluarga..."
                placeholderTextColor="#94A3B8"
                value={izinNote}
                onChangeText={setIzinNote}
                multiline numberOfLines={3}
                onFocus={() => setNoteFocus(true)}
                onBlur={() => setNoteFocus(false)}
                autoFocus
              />
            </View>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalCancelBtn} onPress={() => setShowIzinModal(false)}>
                <Text style={s.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalSubmitBtn, !izinNote.trim() && { opacity: 0.5 }]}
                onPress={handleIzin}
                disabled={!izinNote.trim() || actionLoading}
              >
                {actionLoading
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={s.modalSubmitText}>Kirim Izin</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ── Sub-components ─────────────────────────────────────────

const StatusBadge = ({ today, isOnLeave, hasCheckedIn, hasCheckedOut }: any) => {
  if (isOnLeave)     return <View style={[sb.badge, sb.izin]}><AlertCircle size={12} color="#F59E0B" /><Text style={[sb.text, { color: '#F59E0B' }]}>Izin</Text></View>;
  if (hasCheckedOut) return <View style={[sb.badge, sb.done]}><CheckCircle2 size={12} color="#10B981" /><Text style={[sb.text, { color: '#10B981' }]}>Selesai</Text></View>;
  if (hasCheckedIn)  return <View style={[sb.badge, sb.active]}><Clock size={12} color="#3B82F6" /><Text style={[sb.text, { color: '#3B82F6' }]}>Bertugas</Text></View>;
  return <View style={[sb.badge, sb.absent]}><XCircle size={12} color="#94A3B8" /><Text style={[sb.text, { color: '#94A3B8' }]}>Belum</Text></View>;
};

const sb = StyleSheet.create({
  badge:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  text:   { fontSize: 12, fontFamily: 'PoppinsBold' },
  izin:   { backgroundColor: '#FFFBEB' },
  done:   { backgroundColor: '#F0FDF4' },
  active: { backgroundColor: '#EFF6FF' },
  absent: { backgroundColor: '#F8FAFC' },
});

const TimeBox = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <View style={tb.box}>
    {icon}
    <Text style={tb.label}>{label}</Text>
    <Text style={tb.value}>{value}</Text>
  </View>
);
const tb = StyleSheet.create({
  box:   { flex: 1, alignItems: 'center', gap: 2 },
  label: { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  value: { fontSize: 17, fontFamily: 'PoppinsBold', color: '#1E293B' },
});

const MiniStat = ({ icon, label, value, bg, valueColor }: {
  icon: React.ReactNode; label: string; value: string; bg: string; valueColor?: string;
}) => (
  <View style={[ms.card, { backgroundColor: bg }]}>
    {icon}
    <Text style={[ms.val, valueColor && { color: valueColor }]}>{value}</Text>
    <Text style={ms.label}>{label}</Text>
  </View>
);
const ms = StyleSheet.create({
  card:  { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  val:   { fontSize: 17, fontFamily: 'PoppinsBold', color: PRIMARY },
  label: { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#64748B', textAlign: 'center' },
});

// ── Styles ─────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: PRIMARY },

  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: PRIMARY },
  headerSub:     { fontSize: 12, fontFamily: 'PoppinsRegular', color: 'rgba(255,255,255,0.7)' },
  headerName:    { fontSize: 18, fontFamily: 'PoppinsBold', color: '#FFF' },
  historyBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  historyBtnText:{ fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#FFF' },

  scroll:  { flex: 1, backgroundColor: '#F5F6FA' },
  content: { padding: 16, gap: 12 },

  // Status card
  statusCard:    { backgroundColor: '#FFF', borderRadius: 18, padding: 18, gap: 14 },
  statusCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  todayLabel:    { fontSize: 14, fontFamily: 'PoppinsSemiBold', color: '#1E293B', marginBottom: 3 },
  shiftInfoRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  shiftInfoText: { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#94A3B8' },

  timeRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  durationPill: { alignItems: 'center', gap: 3, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  durationText: { fontSize: 12, fontFamily: 'PoppinsBold', color: '#3B82F6' },

  warnBox:  { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#FECACA' },
  warnText: { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#B91C1C', flex: 1, flexWrap: 'wrap' },

  errorBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12 },
  errorText: { fontSize: 13, fontFamily: 'PoppinsMedium', color: '#EF4444', flex: 1 },

  // Action buttons
  actionRow:    { flexDirection: 'row', gap: 12 },
  actionBtn:    { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 22, borderRadius: 18 },
  checkInBtn:   { backgroundColor: '#10B981' },
  checkOutBtn:  { backgroundColor: '#EF4444' },
  btnDisabled:  { opacity: 0.35 },
  actionBtnText:{ fontSize: 17, fontFamily: 'PoppinsBold', color: '#FFF' },
  actionBtnSub: { fontSize: 12, fontFamily: 'PoppinsRegular', color: 'rgba(255,255,255,0.75)' },

  // No shift
  noShiftCard:  { backgroundColor: '#FFF', borderRadius: 14, padding: 20, alignItems: 'center', gap: 8 },
  noShiftText:  { fontSize: 14, fontFamily: 'PoppinsSemiBold', color: '#475569' },
  noShiftSub:   { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#94A3B8' },

  // Izin button
  izinBtn:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFBEB', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#FDE68A' },
  izinBtnText: { flex: 1, fontSize: 14, fontFamily: 'PoppinsSemiBold', color: '#F59E0B' },

  miniStats: { flexDirection: 'row', gap: 8 },

  // Modal Izin
  modalOverlay:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet:     { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalHandle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 4 },
  modalTitle:     { fontSize: 17, fontFamily: 'PoppinsBold', color: '#1E293B' },
  modalSub:       { fontSize: 13, fontFamily: 'PoppinsRegular', color: '#64748B' },
  noteWrap:       { backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', padding: 12 },
  noteWrapFocus:  { borderColor: PRIMARY },
  noteInput:      { fontSize: 14, fontFamily: 'PoppinsRegular', color: '#1E293B', minHeight: 72 },
  modalBtns:      { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  modalCancelText:{ fontSize: 14, fontFamily: 'PoppinsSemiBold', color: '#64748B' },
  modalSubmitBtn: { flex: 2, paddingVertical: 13, borderRadius: 12, backgroundColor: '#F59E0B', alignItems: 'center' },
  modalSubmitText:{ fontSize: 14, fontFamily: 'PoppinsBold', color: '#FFF' },
});

export default AttendanceScreen;