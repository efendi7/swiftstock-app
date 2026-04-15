/**
 * EditShiftModal.tsx
 * Drawer dari kanan — style konsisten dengan CashierDetailModal.
 * - Header: avatar kasir + nama + email (sama persis CashierDetailModal)
 * - Card pilih shift: warna per tipe, jam, checkmark aktif
 * - Hari aktif: chip compact
 * - Preview bar di bawah pilihan
 * - Footer: Hapus Shift (merah) | Batal | Simpan
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, ActivityIndicator, Animated, Platform,
} from 'react-native';
import {
  X, Clock, Sun, Sunset, Moon, CalendarDays,
  CheckCircle2, Save, Trash2, Calendar,
} from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import {
  Cashier, Shift, ShiftType,
  SHIFT_PRESETS, SHIFT_LABELS, DAY_LABELS,
  CashierService,
} from '@services/cashierService';

// ── Konstanta ──────────────────────────────────────────────
const PRIMARY      = '#1C3A5A';
// ── Config tipe shift ──────────────────────────────────────
const SHIFT_CFG: Record<ShiftType, {
  Icon: any; bg: string; active: string; border: string; textLight: string;
}> = {
  pagi:  { Icon: Sun,         bg: '#FFFBEB', active: '#D97706', border: '#FDE68A', textLight: '#FEF3C7' },
  siang: { Icon: Sunset,      bg: '#FFF7ED', active: '#EA580C', border: '#FED7AA', textLight: '#FFEDD5' },
  malam: { Icon: Moon,        bg: '#EFF6FF', active: '#3B82F6', border: '#BFDBFE', textLight: '#DBEAFE' },
  full:  { Icon: CalendarDays,bg: '#F0FDF4', active: '#10B981', border: '#A7F3D0', textLight: '#D1FAE5' },
};

// ── Props ──────────────────────────────────────────────────
interface Props {
  visible:   boolean;
  cashier:   Cashier | null;
  tenantId:  string;
  onClose:   () => void;
  onSuccess: () => void;
}

// ── Component ──────────────────────────────────────────────
export const EditShiftModal = ({ visible, cashier, tenantId, onClose, onSuccess }: Props) => {
  const [selectedShift, setSelectedShift] = useState<ShiftType | null>(null);
  const [selectedDays,  setSelectedDays]  = useState<number[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim   = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible && cashier) {
      setSelectedShift(cashier.shift?.type ?? null);
      setSelectedDays(cashier.shift?.days  ?? []);
      setError('');

      opacityAnim.setValue(0);
      scaleAnim.setValue(0.95);
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim,   { toValue: 1, useNativeDriver: true, tension: 70, friction: 11 }),
      ]).start();
    }
  }, [visible, cashier]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 0,    duration: 160, useNativeDriver: true }),
      Animated.timing(scaleAnim,   { toValue: 0.95, duration: 160, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const toggleDay = (day: number) =>
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );

  const handleSave = async () => {
    if (!cashier) return;
    if (!selectedShift) { setError('Pilih tipe shift terlebih dahulu.'); return; }
    try {
      setLoading(true); setError('');
      const shift: Shift = { ...SHIFT_PRESETS[selectedShift], days: selectedDays };
      await CashierService.updateShift(tenantId, cashier.id, shift);
      onSuccess();
      handleClose();
    } catch (e: any) {
      setError(e.message || 'Gagal menyimpan shift.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!cashier) return;
    try {
      setLoading(true);
      await CashierService.updateShift(tenantId, cashier.id, null);
      onSuccess();
      handleClose();
    } catch (e: any) {
      setError(e.message || 'Gagal menghapus shift.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible || !cashier) return null;

  const preset = selectedShift ? SHIFT_PRESETS[selectedShift] : null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[s.overlay, { opacity: opacityAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject as any} onPress={handleClose} activeOpacity={1} />

        <Animated.View style={[s.card, { transform: [{ scale: scaleAnim }] }]}>

        {/* ── Header — sama persis CashierDetailModal ── */}
        <View style={s.header}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{cashier.displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.headerTitleRow}>
              <Clock size={14} color={COLORS.secondary} />
              <Text style={s.headerLabel}>Atur Shift</Text>
            </View>
            <Text style={s.name}>{cashier.displayName}</Text>
            <Text style={s.email}>{cashier.email}</Text>
            {/* Shift saat ini */}
            {cashier.shift ? (
              <View style={s.currentShiftRow}>
                <Calendar size={11} color="#94A3B8" />
                <Text style={s.currentShiftText}>
                  Shift sekarang: {SHIFT_LABELS[cashier.shift.type]}
                </Text>
              </View>
            ) : (
              <View style={s.currentShiftRow}>
                <Calendar size={11} color="#CBD5E1" />
                <Text style={[s.currentShiftText, { color: '#CBD5E1' }]}>Belum ada shift</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={handleClose} disabled={loading}>
            <X size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* ── Body ── */}
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* Pilih tipe shift */}
          <Text style={s.sectionLabel}>TIPE SHIFT</Text>
          <View style={s.shiftGrid}>
            {(Object.keys(SHIFT_PRESETS) as ShiftType[]).map(type => {
              const cfg      = SHIFT_CFG[type];
              const isActive = selectedShift === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    s.shiftCard,
                    {
                      backgroundColor: isActive ? cfg.active    : cfg.bg,
                      borderColor:     isActive ? cfg.active    : cfg.border,
                    },
                  ]}
                  onPress={() => setSelectedShift(type)}
                  activeOpacity={0.82}
                >
                  {/* Checkmark pojok kanan atas */}
                  {isActive && (
                    <View style={s.checkMark}>
                      <CheckCircle2 size={14} color="#FFF" />
                    </View>
                  )}
                  <cfg.Icon size={22} color={isActive ? '#FFF' : cfg.active} />
                  <Text style={[s.shiftName, { color: isActive ? '#FFF' : cfg.active }]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                  <Text style={[s.shiftTime, { color: isActive ? cfg.textLight : '#94A3B8' }]}>
                    {SHIFT_PRESETS[type].startTime}–{SHIFT_PRESETS[type].endTime}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Pilih hari aktif */}
          <View style={s.sectionRow}>
            <Text style={s.sectionLabel}>HARI AKTIF</Text>
            <Text style={s.sectionHint}>Kosongkan = semua hari</Text>
          </View>
          <View style={s.daysRow}>
            {DAY_LABELS.map((label, idx) => {
              const isSelected = selectedDays.includes(idx);
              const isWknd     = idx === 0 || idx === 6;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    s.dayChip,
                    isSelected && s.dayChipActive,
                    isWknd && !isSelected && s.dayChipWeekend,
                  ]}
                  onPress={() => toggleDay(idx)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    s.dayChipText,
                    isSelected    && s.dayChipTextActive,
                    isWknd && !isSelected && { color: '#F59E0B' },
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Preview */}
          {selectedShift && (
            <View style={s.previewBox}>
              <Clock size={13} color={COLORS.secondary} />
              <Text style={s.previewText}>
                {SHIFT_LABELS[selectedShift]}
                {selectedDays.length > 0
                  ? ' · ' + selectedDays.map(d => DAY_LABELS[d]).join(', ')
                  : ' · Semua hari'}
              </Text>
            </View>
          )}

          {/* Error */}
          {error !== '' && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* ── Footer ── */}
        <View style={s.footer}>
          {cashier.shift && (
            <TouchableOpacity style={s.clearBtn} onPress={handleClear} disabled={loading}>
              <Trash2 size={13} color="#EF4444" />
              <Text style={s.clearBtnText}>Hapus</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.cancelBtn} onPress={handleClose} disabled={loading}>
            <Text style={s.cancelText}>Batal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.saveBtn, (!selectedShift || loading) && { opacity: 0.55 }]}
            onPress={handleSave}
            disabled={!selectedShift || loading}
          >
            {loading
              ? <ActivityIndicator size="small" color="#FFF" />
              : (
                <>
                  <Save size={14} color="#FFF" />
                  <Text style={s.saveText}>Simpan Shift</Text>
                </>
              )
            }
          </TouchableOpacity>
        </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ── Styles ─────────────────────────────────────────────────
const s = StyleSheet.create({
  // Overlay centered (sama dengan CashierDetailModal)
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Card centered
  card: {
    width: 520,
    maxWidth: '95%' as any,
    maxHeight: '92%' as any,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { boxShadow: '0 20px 60px rgba(0,0,0,0.18)' } as any : {
      shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18, shadowRadius: 24, elevation: 24,
    }),
  },

  // Header — konsisten dengan CashierDetailModal
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatar: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: PRIMARY + '18',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText:      { fontSize: 22, fontFamily: 'PoppinsBold', color: PRIMARY },
  headerTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  headerLabel:     { fontSize: 11, fontFamily: 'PoppinsSemiBold', color: COLORS.secondary, textTransform: 'uppercase' as any, letterSpacing: 0.6 },
  name:            { fontSize: 15, fontFamily: 'PoppinsBold', color: '#1E293B' },
  email:           { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#64748B', marginTop: 1 },
  currentShiftRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  currentShiftText:{ fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  closeBtn:        { width: 32, height: 32, borderRadius: 9, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },

  // Body
  scroll:        { flex: 1 },
  scrollContent: { padding: 20, gap: 6, paddingBottom: 16 },

  sectionLabel: { fontSize: 10, fontFamily: 'PoppinsBold', color: '#94A3B8', letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },
  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  sectionHint:  { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#CBD5E1', marginBottom: 8 },

  // Shift cards — 2 kolom
  shiftGrid: { flexDirection: 'row', flexWrap: 'wrap' as any, gap: 10 },
  shiftCard: {
    width: '47.5%',
    borderRadius: 14, borderWidth: 1.5,
    padding: 16, alignItems: 'center', gap: 5,
    position: 'relative' as any,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  checkMark:  { position: 'absolute' as any, top: 8, right: 8 },
  shiftName:  { fontSize: 14, fontFamily: 'PoppinsBold', marginTop: 2 },
  shiftTime:  { fontSize: 11, fontFamily: 'PoppinsRegular' },

  // Hari chips
  daysRow:  { flexDirection: 'row', gap: 7, flexWrap: 'wrap' as any },
  dayChip:  {
    width: 44, height: 44, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
  },
  dayChipActive:      { backgroundColor: PRIMARY, borderColor: PRIMARY },
  dayChipWeekend:     { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  dayChipText:        { fontSize: 11, fontFamily: 'PoppinsBold', color: '#64748B' },
  dayChipTextActive:  { color: '#FFF' },

  // Preview
  previewBox:  {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0F9FF', borderRadius: 12,
    borderWidth: 1, borderColor: '#BAE6FD',
    padding: 13, marginTop: 14,
  },
  previewText: { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#0369A1', flex: 1 },

  // Error
  errorBox:  { backgroundColor: '#FEF2F2', borderRadius: 10, borderWidth: 1, borderColor: '#FECACA', padding: 12, marginTop: 8 },
  errorText: { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#991B1B' },

  // Footer
  footer:      { flexDirection: 'row', gap: 8, padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', alignItems: 'center' },
  clearBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 11, borderWidth: 1.5, borderColor: '#FECACA', backgroundColor: '#FEF2F2', ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}) },
  clearBtnText:{ fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#EF4444' },
  cancelBtn:   { flex: 1, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  cancelText:  { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#64748B' },
  saveBtn:     { flex: 1.8, height: 46, borderRadius: 12, backgroundColor: PRIMARY, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 },
  saveText:    { fontSize: 13, fontFamily: 'PoppinsBold', color: '#FFF' },
});

export default EditShiftModal;