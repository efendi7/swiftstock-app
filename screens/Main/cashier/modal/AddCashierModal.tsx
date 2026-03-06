import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  ScrollView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { X, Users, Mail, Lock, User as UserIcon, CheckCircle, AlertCircle } from 'lucide-react-native';

import { COLORS } from '@constants/colors';
import { CashierService } from '@services/cashierService';
import FloatingLabelInput from '@components/FloatingLabelInput';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Platform.OS === 'web' ? Math.min(520, width * 0.35) : width * 0.92;

type ToastType = 'success' | 'error' | null;

export const AddCashierModal = ({ visible, onClose, onSuccess, tenantId, storeName }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<{ type: ToastType; message: string }>({ type: null, message: '' });
  const toastAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(DRAWER_WIDTH);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.delay(2500),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast({ type: null, message: '' }));
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: DRAWER_WIDTH, duration: 250, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setName('');
      setEmail('');
      setPassword('');
      onClose();
    });
  };

  const handleSave = async () => {
    if (!name.trim()) { showToast('error', 'Nama kasir tidak boleh kosong'); return; }
    if (!email.trim()) { showToast('error', 'Email tidak boleh kosong'); return; }
    if (!password) { showToast('error', 'Password tidak boleh kosong'); return; }
    if (password.length < 6) { showToast('error', 'Password minimal 6 karakter'); return; }
    if (!tenantId) { showToast('error', 'Sesi tidak valid, silakan login ulang'); return; }

    try {
      setLoading(true);
      await CashierService.registerCashier({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        tenantId,
        storeName: storeName || '',
      });

      showToast('success', `Kasir "${name.trim()}" berhasil ditambahkan!`);
      onSuccess();
      setTimeout(() => handleClose(), 1800);
    } catch (error: any) {
      showToast('error', error.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Indikator kekuatan password
  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColor = ['#E2E8F0', '#EF4444', '#F59E0B', '#10B981'];
  const strengthLabel = ['', 'Lemah', 'Sedang', 'Kuat'];

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <Pressable onPress={handleClose} style={StyleSheet.absoluteFillObject}>
          <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />
        </Pressable>

        <Animated.View
          style={[
            styles.drawerContainer,
            { width: DRAWER_WIDTH, transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Toast Notification — mengganti Alert.alert */}
          {toast.type && (
            <Animated.View
              style={[
                styles.toast,
                toast.type === 'success' ? styles.toastSuccess : styles.toastError,
                {
                  opacity: toastAnim,
                  transform: [{
                    translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }),
                  }],
                },
              ]}
            >
              {toast.type === 'success'
                ? <CheckCircle size={16} color="#10B981" />
                : <AlertCircle size={16} color="#EF4444" />
              }
              <Text style={[styles.toastText, { color: toast.type === 'success' ? '#065F46' : '#7F1D1D' }]}>
                {toast.message}
              </Text>
            </Animated.View>
          )}

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <Users size={22} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Tambah Kasir</Text>
                <Text style={styles.headerSubtitle}>{storeName || 'Pengaturan Toko'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} disabled={loading}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Section Label */}
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionLabelText}>INFORMASI AKUN</Text>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <FloatingLabelInput
              label="Nama Lengkap Kasir"
              value={name}
              onChangeText={setName}
              icon={<UserIcon size={18} color="#94A3B8" />}
            />

            <FloatingLabelInput
              label="Email Login"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Mail size={18} color="#94A3B8" />}
            />

            <FloatingLabelInput
              label="Password Akun"
              value={password}
              onChangeText={setPassword}
              isPassword={true}
              icon={<Lock size={18} color="#94A3B8" />}
            />

            {/* Indikator kekuatan password */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3].map(i => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: i <= passwordStrength ? strengthColor[passwordStrength] : '#E2E8F0' },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthText, { color: strengthColor[passwordStrength] }]}>
                  {strengthLabel[passwordStrength]}
                </Text>
              </View>
            )}

            {/* Info box */}
            <View style={styles.infoBox}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoIconText}>ℹ</Text>
              </View>
              <Text style={styles.infoText}>
                Kasir akan menggunakan email dan password ini untuk login di aplikasi SwiftStock Mobile.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={loading}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.saveBtnText}>Menyimpan...</Text>
                </View>
              ) : (
                <Text style={styles.saveBtnText}>Simpan Kasir</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.5)' },

  drawerContainer: {
    height: '100%',
    backgroundColor: '#F8FAFC',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },

  // Toast
  toast: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  toastSuccess: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  toastError: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  toastText: { fontSize: 13, fontFamily: 'PoppinsMedium', flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(28, 58, 90, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: 'MontserratBold', color: '#0F172A' },
  headerSubtitle: { fontSize: 12, color: '#94A3B8', fontFamily: 'PoppinsRegular', marginTop: 1 },
  closeButton: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
  },

  // Section label
  sectionLabel: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  sectionLabelText: {
    fontSize: 10,
    fontFamily: 'PoppinsSemiBold',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24, gap: 4 },

  // Password strength
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    marginBottom: 4,
  },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthText: { fontSize: 11, fontFamily: 'PoppinsMedium', minWidth: 42, textAlign: 'right' },

  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoIcon: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#3B82F6',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 1,
  },
  infoIconText: { color: '#fff', fontSize: 11, fontFamily: 'PoppinsBold' },
  infoText: {
    flex: 1, fontSize: 12, color: '#1E40AF',
    fontFamily: 'PoppinsRegular', lineHeight: 18,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center',
  },
  cancelBtnText: { color: '#64748B', fontFamily: 'PoppinsSemiBold', fontSize: 14 },
  saveBtn: {
    flex: 2, height: 48, borderRadius: 12,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.65 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveBtnText: { color: '#fff', fontFamily: 'PoppinsBold', fontSize: 14 },
});

export default AddCashierModal;