import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Animated,
  Pressable,
  Clipboard,
} from 'react-native';
import {
  X, Users, Mail, Lock, User as UserIcon,
  CheckCircle, AlertCircle, Info, Copy,
  RefreshCw, ShieldCheck, Receipt,
} from 'lucide-react-native';

import { COLORS } from '@constants/colors';
import { CashierService } from '@services/cashierService';
import FloatingLabelInput from '@components/FloatingLabelInput';

type ToastType = 'success' | 'error' | null;

// ── Password generator ─────────────────────────────────────────────────
const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#!';
const generatePassword = () =>
  Array.from({ length: 10 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');

// ── Password strength ──────────────────────────────────────────────────
const getStrength = (pw: string) => {
  if (!pw) return { score: 0, label: '', color: '#E2E8F0' };
  let score = 0;
  if (pw.length >= 6)         score++;
  if (pw.length >= 10)        score++;
  if (/[A-Z]/.test(pw))      score++;
  if (/[0-9]/.test(pw))      score++;
  if (/[@#!$%^&*]/.test(pw)) score++;
  const map = [
    { label: '',            color: '#E2E8F0' },
    { label: 'Sangat Lemah', color: '#EF4444' },
    { label: 'Lemah',        color: '#F97316' },
    { label: 'Sedang',       color: '#F59E0B' },
    { label: 'Kuat',         color: '#10B981' },
    { label: 'Sangat Kuat',  color: '#059669' },
  ];
  return { score, ...map[Math.min(score, 5)] };
};

// ── Shared helpers ─────────────────────────────────────────────────────
const Sep      = () => <View style={s.sep} />;
const DashLine = () => <View style={s.dashLine} />;

const InfoRow = ({
  label, value, icon, valueColor,
}: {
  label: string; value: string; icon?: React.ReactNode; valueColor?: string;
}) => (
  <View style={s.infoRow}>
    <View style={s.infoLabelWrap}>
      {icon && <View style={{ marginRight: 5 }}>{icon}</View>}
      <Text style={s.infoLabel}>{label}</Text>
    </View>
    <Text style={[s.infoValue, valueColor ? { color: valueColor } : {}]} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

// ── Left col: form ─────────────────────────────────────────────────────
const FormColumn = ({
  name, setName, email, setEmail, password, setPassword,
  themeColor, onGenerate,
}: any) => {
  const strength = getStrength(password);
  return (
    <View style={s.formCol}>
      <View style={s.colHeader}>
        <Users size={13} color={themeColor} />
        <Text style={[s.colTitle, { color: themeColor }]}>Data Kasir</Text>
      </View>
      <DashLine />

      <View style={s.inputGroup}>
        <FloatingLabelInput
          label="Nama Lengkap"
          value={name}
          onChangeText={setName}
          icon={<UserIcon size={16} color="#94A3B8" />}
          placeholder="Cth: Budi Santoso"
        />
      </View>

      <View style={s.inputGroup}>
        <FloatingLabelInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          icon={<Mail size={16} color="#94A3B8" />}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Cth: budi@toko.com"
        />
      </View>

      <View style={s.inputGroup}>
        <FloatingLabelInput
          label="Password Sementara"
          value={password}
          onChangeText={setPassword}
          isPassword
          icon={<Lock size={16} color="#94A3B8" />}
          placeholder="Min. 6 karakter"
        />
        <TouchableOpacity style={s.genBtn} onPress={onGenerate} activeOpacity={0.7}>
          <RefreshCw size={12} color={themeColor} />
          <Text style={[s.genText, { color: themeColor }]}>Generate otomatis</Text>
        </TouchableOpacity>
      </View>

      {password.length > 0 && (
        <View style={s.strengthWrap}>
          <View style={s.strengthBars}>
            {[1,2,3,4,5].map(i => (
              <View
                key={i}
                style={[s.strengthBar, { backgroundColor: i <= strength.score ? strength.color : '#E2E8F0' }]}
              />
            ))}
          </View>
          <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
        </View>
      )}

      <View style={{ flex: 1 }} />
    </View>
  );
};

// ── Left col: credential card (post-success) ───────────────────────────
const CredentialCard = ({
  name, email, password, themeColor,
}: {
  name: string; email: string; password: string; themeColor: string;
}) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    Clipboard.setString(
      `Akun Kasir\nNama: ${name}\nEmail: ${email}\nPassword: ${password}\n\nSilakan login dan ganti password Anda.`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={s.formCol}>
      <View style={s.colHeader}>
        <CheckCircle size={13} color="#10B981" />
        <Text style={[s.colTitle, { color: '#10B981' }]}>Akun Berhasil Dibuat</Text>
      </View>
      <DashLine />

      <InfoRow label="Nama"     value={name}  />
      <Sep />
      <InfoRow label="Email"    value={email} />
      <Sep />
      <InfoRow label="Password" value={password} valueColor={themeColor} />

      <DashLine />

      <TouchableOpacity
        style={[s.copyBtn, { borderColor: themeColor + '50' }]}
        onPress={handleCopy}
        activeOpacity={0.8}
      >
        {copied
          ? <CheckCircle size={14} color="#10B981" />
          : <Copy size={14} color={themeColor} />}
        <Text style={[s.copyText, { color: copied ? '#10B981' : themeColor }]}>
          {copied ? 'Tersalin!' : 'Salin Kredensial'}
        </Text>
      </TouchableOpacity>

      <Text style={s.credNote}>Minta kasir ganti password setelah login pertama.</Text>
      <View style={{ flex: 1 }} />
    </View>
  );
};

// ── Right col: tips & info ─────────────────────────────────────────────
const InfoColumn = ({ themeColor, storeName }: { themeColor: string; storeName: string }) => (
  <View style={s.infoCol}>

    <View style={s.block}>
      <View style={s.blockHeader}>
        <Info size={13} color={themeColor} />
        <Text style={s.blockTitle}>Cara Kerja Akun</Text>
      </View>
      {[
        { step: '1', text: 'Buat akun dengan email & password sementara.' },
        { step: '2', text: 'Bagikan kredensial ke kasir.' },
        { step: '3', text: 'Kasir login & ganti password sendiri.' },
        { step: '4', text: 'Akun aktif & siap dipakai.' },
      ].map((item, idx, arr) => (
        <View key={item.step}>
          <View style={s.stepRow}>
            <View style={[s.stepBadge, { backgroundColor: themeColor }]}>
              <Text style={s.stepNum}>{item.step}</Text>
            </View>
            <Text style={s.stepText}>{item.text}</Text>
          </View>
          {idx < arr.length - 1 && (
            <View style={[s.stepConnector, { borderColor: themeColor + '35' }]} />
          )}
        </View>
      ))}
    </View>

    <View style={s.block}>
      <View style={s.blockHeader}>
        <ShieldCheck size={13} color={themeColor} />
        <Text style={s.blockTitle}>Tips Password</Text>
      </View>
      {[
        'Min. 8 karakter',
        'Huruf besar & kecil',
        'Tambahkan angka / simbol',
        'Hindari nama / tanggal lahir',
      ].map(tip => (
        <View key={tip} style={s.tipRow}>
          <View style={[s.dot, { backgroundColor: themeColor }]} />
          <Text style={s.tipText}>{tip}</Text>
        </View>
      ))}
    </View>

    <View style={s.block}>
      <View style={s.blockHeader}>
        <Receipt size={13} color={themeColor} />
        <Text style={s.blockTitle}>Info Toko</Text>
      </View>
      <InfoRow
        label="Toko"
        value={storeName || '–'}
        icon={<Receipt size={12} color="#94A3B8" />}
      />
    </View>

    <View style={{ flex: 1 }} />
  </View>
);

// ── Main Modal ─────────────────────────────────────────────────────────
export const AddCashierModal = ({
  visible, onClose, onSuccess, tenantId, storeName, themeColor,
}: any) => {
  const color = themeColor || COLORS.primary;

  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [loading,     setLoading]     = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedCreds,  setSavedCreds]  = useState({ name: '', email: '', password: '' });
  const [toast, setToast] = useState<{ type: ToastType; message: string }>({ type: null, message: '' });

  const toastAnim   = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim   = useRef(new Animated.Value(0.97)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim,   { toValue: 1, friction: 8, tension: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.spring(toastAnim, { toValue: 1, useNativeDriver: true, friction: 7 }),
      Animated.delay(2500),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast({ type: null, message: '' }));
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(scaleAnim,   { toValue: 0.97, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setName(''); setEmail(''); setPassword('');
      setShowSuccess(false);
      setSavedCreds({ name: '', email: '', password: '' });
      onClose();
    });
  };

  const handleSave = async () => {
    if (!name.trim())                  return showToast('error', 'Nama kasir tidak boleh kosong');
    if (!email.trim())                 return showToast('error', 'Email tidak boleh kosong');
    if (!/\S+@\S+\.\S+/.test(email))  return showToast('error', 'Format email tidak valid');
    if (!password)                     return showToast('error', 'Password tidak boleh kosong');
    if (password.length < 6)           return showToast('error', 'Password minimal 6 karakter');
    if (!tenantId)                     return showToast('error', 'Sesi tidak valid');

    try {
      setLoading(true);
      await CashierService.registerCashier({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        tenantId,
        storeName: storeName || '',
      });
      setSavedCreds({ name: name.trim(), email: email.trim().toLowerCase(), password });
      onSuccess();
      setShowSuccess(true);
    } catch (e: any) {
      showToast('error', e.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <View style={[s.overlay, s.overlayCenter]}>

        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose}>
          <Animated.View style={[s.backdrop, { opacity: opacityAnim }]} />
        </Pressable>

        <Animated.View
          style={[s.container, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}
        >
          {/* Toast */}
          {toast.type && (
            <Animated.View
              style={[
                s.toast,
                {
                  opacity: toastAnim,
                  borderLeftColor: toast.type === 'success' ? '#10B981' : '#EF4444',
                  transform: [{
                    translateY: toastAnim.interpolate({ inputRange: [0,1], outputRange: [-14, 0] }),
                  }],
                },
              ]}
            >
              {toast.type === 'success'
                ? <CheckCircle size={15} color="#10B981" />
                : <AlertCircle size={15} color="#EF4444" />}
              <Text style={s.toastText}>{toast.message}</Text>
            </Animated.View>
          )}

          {/* Header — dark themeColor bg, mirrors AddProductModal */}
          <View style={[s.header, { backgroundColor: color }]}>
            <View style={s.headerLeft}>
              <View style={s.headerIcon}>
                <Users size={18} color="#FFF" />
              </View>
              <View>
                <Text style={s.headerSub}>{storeName || 'Manajemen Kasir'}</Text>
                <Text style={s.headerTitle}>Tambah Kasir Baru</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={s.closeBtn} hitSlop={8}>
              <X size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* 2-column body — fixed height, nothing overflows screen */}
          <View style={s.body}>
            {showSuccess
              ? <CredentialCard
                  name={savedCreds.name}
                  email={savedCreds.email}
                  password={savedCreds.password}
                  themeColor={color}
                />
              : <FormColumn
                  name={name}        setName={setName}
                  email={email}      setEmail={setEmail}
                  password={password} setPassword={setPassword}
                  themeColor={color}
                  onGenerate={() => setPassword(generatePassword())}
                />
            }
            <View style={s.colDivider} />
            <InfoColumn themeColor={color} storeName={storeName || ''} />
          </View>

          {/* Footer — themeColor fill, buttons match AddProductModal */}
          <View style={[s.footer, { backgroundColor: color }]}>
            {showSuccess ? (
              <View style={s.footerRow}>
                <TouchableOpacity onPress={handleClose} style={s.footerBtnFull}>
                  <CheckCircle size={14} color="#fff" />
                  <Text style={s.footerBtnText}>Selesai</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.footerRow}>
                <TouchableOpacity onPress={handleClose} style={s.footerBtnCancel}>
                  <Text style={s.footerCancelText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  style={[s.footerBtnSave, loading && { opacity: 0.5 }]}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <>
                        <Users size={15} color="#fff" />
                        <Text style={s.footerBtnText}>Buat Akun Kasir</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            )}
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  overlayCenter: { justifyContent: 'center', alignItems: 'center' },
  backdrop:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },

  container: {
    width: 820,
    maxWidth: '95%' as any,
    maxHeight: '88%' as any,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },

  // Header — dark themeColor bg, mirrors AddProductModal
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontFamily: 'PoppinsBold', color: '#FFF', marginTop: 1 },
  headerMeta:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  headerSub:   { fontSize: 10, fontFamily: 'PoppinsMedium', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' as any, letterSpacing: 0.5 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  badge:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 11, fontFamily: 'PoppinsBold' },

  // 2-col body — fixed height so nothing overflows
  body: {
    flexDirection: 'row',
    height: 400,
    overflow: 'hidden' as any,
  },
  colDivider: { width: 1, backgroundColor: '#F1F5F9' },

  // Left col
  formCol: { flex: 1, padding: 18, flexDirection: 'column' },
  colHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  colTitle:  { fontSize: 13, fontFamily: 'PoppinsBold', flex: 1 },

  inputGroup: { marginBottom: 12 },

  genBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  genText: { fontSize: 12, fontFamily: 'PoppinsMedium' },

  strengthWrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  strengthBars:  { flexDirection: 'row', gap: 3, flex: 1 },
  strengthBar:   { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontFamily: 'PoppinsBold', minWidth: 72, textAlign: 'right' as any },

  copyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, borderRadius: 10, padding: 10,
    borderWidth: 1, backgroundColor: '#F8FAFC', marginBottom: 8,
  },
  copyText:  { fontSize: 13, fontFamily: 'PoppinsMedium' },
  credNote:  { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', textAlign: 'center' as any, lineHeight: 16 },

  // Right col — light bg, same as TransactionModal RightColumn
  infoCol: {
    width: 230,
    padding: 14,
    flexDirection: 'column',
    backgroundColor: '#FAFBFC',
  },

  // Block
  block: {
    backgroundColor: '#F8FAFC', borderRadius: 12,
    padding: 10, borderWidth: 1, borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  blockTitle:  { fontSize: 12, fontFamily: 'PoppinsBold', color: '#1E293B', flex: 1 },

  // Step flow
  stepRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  stepBadge:    { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  stepNum:      { fontSize: 10, fontFamily: 'PoppinsBold', color: '#fff' },
  stepText:     { fontSize: 11.5, fontFamily: 'PoppinsRegular', color: '#475569', flex: 1, lineHeight: 17 },
  stepConnector:{ width: 1, height: 7, borderLeftWidth: 1, borderStyle: 'dashed' as any, marginLeft: 8, marginVertical: 1 },

  // Tip rows
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 2 },
  dot:    { width: 5, height: 5, borderRadius: 3 },
  tipText:{ fontSize: 11.5, fontFamily: 'PoppinsRegular', color: '#64748B' },

  // InfoRow — identical to TransactionModal
  infoRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 },
  infoLabelWrap:{ flexDirection: 'row', alignItems: 'center' },
  infoLabel:    { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#64748B' },
  infoValue:    { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#1E293B', textAlign: 'right' as any, flex: 1, marginLeft: 8 },

  // Sep / dash
  sep:     { height: 1, backgroundColor: '#E2E8F0' },
  dashLine:{ borderBottomWidth: 1, borderStyle: 'dashed' as any, borderColor: '#CBD5E1', marginVertical: 8 },

  // Toast
  toast: {
    position: 'absolute',
    top: 62, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, backgroundColor: '#fff', borderRadius: 10,
    elevation: 10, zIndex: 99, borderLeftWidth: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6,
  },
  toastText: { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#334155', flex: 1 },

  // Footer — themeColor fill, buttons mirror AddProductModal
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  footerRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  footerBtnCancel: {
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  footerCancelText: { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: 'rgba(255,255,255,0.85)' },
  footerBtnSave: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 18, paddingVertical: 9, gap: 7,
    borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)',
  },
  footerBtnFull: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 18, paddingVertical: 9, gap: 7,
    borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)',
  },
  footerBtnText: { fontSize: 13, fontFamily: 'PoppinsBold', color: '#fff' },
});

export default AddCashierModal;