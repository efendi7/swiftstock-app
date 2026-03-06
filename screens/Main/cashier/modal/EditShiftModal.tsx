/**
 * EditShiftModal.tsx
 * Modal untuk set/edit shift kasir.
 * Pilih tipe shift + hari aktif (multi-select).
 * Drawer dari kanan, animasi sama dengan AddCashierModal.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, ActivityIndicator, Animated, Dimensions,
  Pressable, Platform,
} from 'react-native';
import {
  X, Clock, Sun, Sunset, Moon, CalendarDays,
  CheckCircle2, Save, Trash2,
} from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import {
  Cashier, Shift, ShiftType,
  SHIFT_PRESETS, SHIFT_LABELS, DAY_LABELS,
  CashierService,
} from '@services/cashierService';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Platform.OS === 'web' ? Math.min(480, width * 0.32) : width * 0.92;

const SHIFT_ICONS: Record<ShiftType, any> = {
  pagi:  Sun,
  siang: Sunset,
  malam: Moon,
  full:  CalendarDays,
};

const SHIFT_COLORS: Record<ShiftType, { bg: string; active: string; border: string }> = {
  pagi:  { bg: '#FFFBEB', active: '#D97706', border: '#FDE68A' },
  siang: { bg: '#FFF7ED', active: '#EA580C', border: '#FED7AA' },
  malam: { bg: '#EFF6FF', active: '#3B82F6', border: '#BFDBFE' },
  full:  { bg: '#F0FDF4', active: '#10B981', border: '#A7F3D0' },
};

interface Props {
  visible:   boolean;
  cashier:   Cashier | null;
  tenantId:  string;
  onClose:   () => void;
  onSuccess: () => void;
}

export const EditShiftModal = ({ visible, cashier, tenantId, onClose, onSuccess }: Props) => {
  const [selectedShift, setSelectedShift] = useState<ShiftType | null>(null);
  const [selectedDays,  setSelectedDays]  = useState<number[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  const slideAnim   = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && cashier) {
      // Populate dari data kasir
      setSelectedShift(cashier.shift?.type ?? null);
      setSelectedDays(cashier.shift?.days ?? []);
      setError('');

      slideAnim.setValue(DRAWER_WIDTH);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim,   { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, cashier]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim,   { toValue: DRAWER_WIDTH, duration: 250, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0,            duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = async () => {
    if (!cashier) return;
    if (!selectedShift) { setError('Pilih tipe shift terlebih dahulu.'); return; }

    try {
      setLoading(true);
      setError('');
      const shift: Shift = {
        ...SHIFT_PRESETS[selectedShift],
        days: selectedDays,
      };
      await CashierService.updateShift(tenantId, cashier.id, shift);
      onSuccess();
      handleClose();
    } catch (e: any) {
      setError(e.message || 'Gagal menyimpan shift.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearShift = async () => {
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

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable onPress={handleClose} style={StyleSheet.absoluteFillObject}>
          <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />
        </Pressable>

        <Animated.View style={[styles.drawer, { width: DRAWER_WIDTH, transform: [{ translateX: slideAnim }] }]}>

          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <Clock size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Atur Shift</Text>
                <Text style={styles.headerSub}>{cashier.displayName}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose} disabled={loading}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

            {/* PILIH TIPE SHIFT */}
            <Text style={styles.sectionLabel}>TIPE SHIFT</Text>
            <View style={styles.shiftGrid}>
              {(Object.keys(SHIFT_PRESETS) as ShiftType[]).map(type => {
                const cfg     = SHIFT_COLORS[type];
                const Icon    = SHIFT_ICONS[type];
                const isActive = selectedShift === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.shiftCard,
                      { backgroundColor: isActive ? cfg.active : cfg.bg, borderColor: isActive ? cfg.active : cfg.border },
                    ]}
                    onPress={() => setSelectedShift(type)}
                  >
                    <Icon size={20} color={isActive ? '#FFF' : cfg.active} />
                    <Text style={[styles.shiftCardLabel, { color: isActive ? '#FFF' : cfg.active }]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                    <Text style={[styles.shiftCardTime, { color: isActive ? 'rgba(255,255,255,0.8)' : '#94A3B8' }]}>
                      {SHIFT_PRESETS[type].startTime}–{SHIFT_PRESETS[type].endTime}
                    </Text>
                    {isActive && (
                      <View style={styles.checkMark}>
                        <CheckCircle2 size={14} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* PILIH HARI AKTIF */}
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>HARI AKTIF</Text>
            <Text style={styles.sectionHint}>Kosongkan = semua hari aktif</Text>
            <View style={styles.daysRow}>
              {DAY_LABELS.map((label, idx) => {
                const isSelected = selectedDays.includes(idx);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.dayBtn, isSelected && styles.dayBtnActive]}
                    onPress={() => toggleDay(idx)}
                  >
                    <Text style={[styles.dayBtnText, isSelected && styles.dayBtnTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* PREVIEW */}
            {selectedShift && (
              <View style={styles.previewBox}>
                <Clock size={14} color={COLORS.secondary} />
                <Text style={styles.previewText}>
                  {SHIFT_LABELS[selectedShift]}
                  {selectedDays.length > 0
                    ? ' · ' + selectedDays.map(d => DAY_LABELS[d]).join(', ')
                    : ' · Semua hari'}
                </Text>
              </View>
            )}

            {/* ERROR */}
            {error !== '' && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footer}>
            {cashier.shift && (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClearShift} disabled={loading}>
                <Trash2 size={14} color="#EF4444" />
                <Text style={styles.clearBtnText}>Hapus Shift</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={loading}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, loading && { opacity: 0.65 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color="#FFF" />
                : <>
                    <Save size={14} color="#FFF" />
                    <Text style={styles.saveBtnText}>Simpan</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay:  { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.5)' },
  drawer:   { height: '100%', backgroundColor: '#F8FAFC', shadowColor: '#000', shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 20 },

  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerLeft:{ flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox:   { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(28,58,90,0.08)', justifyContent: 'center', alignItems: 'center' },
  headerTitle:{ fontSize: 18, fontFamily: 'MontserratBold', color: '#0F172A' },
  headerSub: { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 1 },
  closeBtn:  { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },

  scroll:        { flex: 1 },
  scrollContent: { padding: 24, gap: 4 },

  sectionLabel: { fontSize: 10, fontFamily: 'PoppinsSemiBold', color: '#94A3B8', letterSpacing: 1.2, marginBottom: 10 },
  sectionHint:  { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#CBD5E1', marginTop: -6, marginBottom: 10 },

  shiftGrid: { flexDirection: 'row', flexWrap: 'wrap' as any, gap: 10 },
  shiftCard: {
    width: '47%', borderRadius: 12, borderWidth: 1.5,
    padding: 14, alignItems: 'center', gap: 4,
    cursor: 'pointer' as any,
  },
  shiftCardLabel: { fontSize: 13, fontFamily: 'PoppinsBold', marginTop: 4 },
  shiftCardTime:  { fontSize: 10, fontFamily: 'PoppinsRegular' },
  checkMark:      { position: 'absolute', top: 8, right: 8 },

  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' as any },
  dayBtn:      { width: 42, height: 42, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' as any },
  dayBtnActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayBtnText:      { fontSize: 11, fontFamily: 'PoppinsBold', color: '#64748B' },
  dayBtnTextActive:{ color: '#FFF' },

  previewBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0F9FF', borderRadius: 10, borderWidth: 1, borderColor: '#BAE6FD', padding: 12, marginTop: 16 },
  previewText: { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#0369A1', flex: 1 },

  errorBox:  { backgroundColor: '#FEF2F2', borderRadius: 10, borderWidth: 1, borderColor: '#FECACA', padding: 12, marginTop: 8 },
  errorText: { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#991B1B' },

  footer:     { flexDirection: 'row', gap: 10, padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', alignItems: 'center' },
  clearBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FEF2F2', cursor: 'pointer' as any },
  clearBtnText:{ fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#EF4444' },
  cancelBtn:  { flex: 1, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  cancelBtnText:{ color: '#64748B', fontFamily: 'PoppinsSemiBold', fontSize: 14 },
  saveBtn:    { flex: 1.5, height: 46, borderRadius: 12, backgroundColor: COLORS.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  saveBtnText:{ color: '#FFF', fontFamily: 'PoppinsBold', fontSize: 14 },
});

export default EditShiftModal;