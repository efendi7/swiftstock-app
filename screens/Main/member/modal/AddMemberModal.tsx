import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, ScrollView,
} from 'react-native';
import { X, UserPlus, Phone, Mail, StickyNote } from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import { MemberService } from '@services/memberService';

interface Props {
  visible:   boolean;
  tenantId:  string;
  onClose:   () => void;
  onSuccess: () => void;
}

const AddMemberModal = ({ visible, tenantId, onClose, onSuccess }: Props) => {
  const [name,    setName]    = useState('');
  const [phone,   setPhone]   = useState('');
  const [email,   setEmail]   = useState('');
  const [notes,   setNotes]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const reset = () => { setName(''); setPhone(''); setEmail(''); setNotes(''); setError(''); };

  const handleSubmit = async () => {
    setError('');
    if (!name.trim() || !phone.trim()) {
      setError('Nama dan nomor HP wajib diisi'); return;
    }
    try {
      setLoading(true);
      await MemberService.addMember(tenantId, { name, phone, email, notes });
      reset();
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Gagal menambah member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <UserPlus size={20} color={COLORS.primary} />
              <Text style={styles.title}>Tambah Member Baru</Text>
            </View>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <X size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Field label="Nama Lengkap *" icon={<UserPlus size={15} color="#94A3B8" />}>
              <TextInput style={styles.input} placeholder="Contoh: Budi Santoso" value={name} onChangeText={setName} />
            </Field>
            <Field label="Nomor HP *" icon={<Phone size={15} color="#94A3B8" />}>
              <TextInput style={styles.input} placeholder="08xxxxxxxxxx" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            </Field>
            <Field label="Email (opsional)" icon={<Mail size={15} color="#94A3B8" />}>
              <TextInput style={styles.input} placeholder="email@contoh.com" keyboardType="email-address" value={email} onChangeText={setEmail} />
            </Field>
            <Field label="Catatan (opsional)" icon={<StickyNote size={15} color="#94A3B8" />}>
              <TextInput style={[styles.input, styles.textarea]} placeholder="Catatan khusus untuk member ini..." multiline numberOfLines={3} value={notes} onChangeText={setNotes} />
            </Field>

            {error !== '' && <Text style={styles.error}>{error}</Text>}

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Member baru akan masuk di tier <Text style={styles.infoBold}>Reguler</Text> dengan 0 poin.
                Poin akan bertambah otomatis setiap transaksi.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { reset(); onClose(); }}>
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitBtn, loading && styles.disabledBtn]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.submitText}>Simpan Member</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const Field = ({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.fieldRow}>
      <View style={styles.fieldIcon}>{icon}</View>
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card:        { backgroundColor: '#FFF', borderRadius: 20, width: '100%', maxWidth: 460, maxHeight: '90%' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title:       { fontSize: 16, fontFamily: 'PoppinsBold', color: '#1E293B' },
  body:        { padding: 20 },
  fieldWrap:   { marginBottom: 16 },
  fieldLabel:  { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#475569', marginBottom: 6 },
  fieldRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12 },
  fieldIcon:   { marginRight: 8 },
  input:       { flex: 1, height: 44, fontSize: 14, fontFamily: 'PoppinsRegular', color: '#1E293B', outlineStyle: 'none' as any },
  textarea:    { height: 80, paddingTop: 10, textAlignVertical: 'top' },
  error:       { fontSize: 13, fontFamily: 'PoppinsRegular', color: '#EF4444', marginBottom: 12, textAlign: 'center' },
  infoBox:     { backgroundColor: '#F0F9FF', padding: 12, borderRadius: 10, marginTop: 4 },
  infoText:    { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#0369A1', lineHeight: 18 },
  infoBold:    { fontFamily: 'PoppinsBold' },
  footer:      { flexDirection: 'row', gap: 10, padding: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  cancelBtn:   { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  cancelText:  { fontSize: 14, fontFamily: 'PoppinsSemiBold', color: '#64748B' },
  submitBtn:   { flex: 2, height: 44, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  submitText:  { fontSize: 14, fontFamily: 'PoppinsBold', color: '#FFF' },
  disabledBtn: { opacity: 0.6 },
});

export default AddMemberModal;