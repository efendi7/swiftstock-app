import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, ScrollView, Switch,
} from 'react-native';
import { X, Pencil, Phone, Mail, StickyNote, Percent } from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import { MemberService } from '@services/memberService';
import { Member, MemberTier } from '@/types/member.types';

interface Props {
  visible:   boolean;
  member:    Member | null;
  tenantId:  string;
  tiers:     MemberTier[];
  onClose:   () => void;
  onSuccess: () => void;
}

const EditMemberModal = ({ visible, member, tenantId, tiers, onClose, onSuccess }: Props) => {
  const [name,             setName]             = useState('');
  const [phone,            setPhone]            = useState('');
  const [email,            setEmail]            = useState('');
  const [notes,            setNotes]            = useState('');
  const [useOverride,      setUseOverride]      = useState(false);
  const [discountOverride, setDiscountOverride] = useState('');
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState('');

  useEffect(() => {
    if (member) {
      setName(member.name);
      setPhone(member.phone);
      setEmail(member.email || '');
      setNotes(member.notes || '');
      setUseOverride(member.discountOverride !== null && member.discountOverride !== undefined);
      setDiscountOverride(member.discountOverride?.toString() || '');
    }
  }, [member]);

  const handleSubmit = async () => {
    if (!member) return;
    setError('');
    if (!name.trim() || !phone.trim()) { setError('Nama dan nomor HP wajib diisi'); return; }
    try {
      setLoading(true);
      const override = useOverride ? parseFloat(discountOverride) || 0 : null;
      await MemberService.updateMember(tenantId, member.id, {
        name, phone, email, notes, discountOverride: override,
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Gagal menyimpan perubahan');
    } finally {
      setLoading(false);
    }
  };

  const currentTier = tiers.find(t => t.name === member?.tier);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pencil size={20} color={COLORS.primary} />
              <Text style={styles.title}>Edit Member</Text>
            </View>
            <TouchableOpacity onPress={onClose}><X size={22} color="#64748B" /></TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Tier info */}
            {currentTier && (
              <View style={[styles.tierBanner, { backgroundColor: currentTier.color + '15', borderColor: currentTier.color + '40' }]}>
                <Text style={[styles.tierBannerText, { color: currentTier.color }]}>
                  Tier saat ini: {currentTier.name} — Diskon {currentTier.discount}%
                  {member?.poin !== undefined && ` · ${member.poin} poin`}
                </Text>
              </View>
            )}

            <Field label="Nama Lengkap *" icon={<Pencil size={15} color="#94A3B8" />}>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nama member" />
            </Field>
            <Field label="Nomor HP *" icon={<Phone size={15} color="#94A3B8" />}>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="08xxxxxxxxxx" />
            </Field>
            <Field label="Email" icon={<Mail size={15} color="#94A3B8" />}>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="email@contoh.com" />
            </Field>
            <Field label="Catatan" icon={<StickyNote size={15} color="#94A3B8" />}>
              <TextInput style={[styles.input, styles.textarea]} value={notes} onChangeText={setNotes} multiline numberOfLines={3} placeholder="Catatan khusus..." />
            </Field>

            {/* Override diskon */}
            <View style={styles.overrideRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Override Diskon Manual</Text>
                <Text style={styles.overrideHint}>Aktifkan untuk set diskon khusus, abaikan tier</Text>
              </View>
              <Switch
                value={useOverride}
                onValueChange={setUseOverride}
                trackColor={{ false: '#E2E8F0', true: COLORS.secondary }}
                thumbColor="#FFF"
              />
            </View>
            {useOverride && (
              <Field label="Persentase Diskon (%)" icon={<Percent size={15} color="#94A3B8" />}>
                <TextInput
                  style={styles.input}
                  value={discountOverride}
                  onChangeText={setDiscountOverride}
                  keyboardType="numeric"
                  placeholder="Contoh: 15"
                />
              </Field>
            )}

            {error !== '' && <Text style={styles.error}>{error}</Text>}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitBtn, loading && styles.disabledBtn]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.submitText}>Simpan</Text>}
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
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card:         { backgroundColor: '#FFF', borderRadius: 20, width: '100%', maxWidth: 460, maxHeight: '90%' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title:        { fontSize: 16, fontFamily: 'PoppinsBold', color: '#1E293B' },
  body:         { padding: 20 },
  tierBanner:   { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  tierBannerText:{ fontSize: 13, fontFamily: 'PoppinsSemiBold' },
  fieldWrap:    { marginBottom: 16 },
  fieldLabel:   { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#475569', marginBottom: 6 },
  fieldRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12 },
  fieldIcon:    { marginRight: 8 },
  input:        { flex: 1, height: 44, fontSize: 14, fontFamily: 'PoppinsRegular', color: '#1E293B', outlineStyle: 'none' as any },
  textarea:     { height: 80, paddingTop: 10, textAlignVertical: 'top' },
  overrideRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  overrideHint: { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 2 },
  error:        { fontSize: 13, color: '#EF4444', fontFamily: 'PoppinsRegular', marginBottom: 12, textAlign: 'center' },
  footer:       { flexDirection: 'row', gap: 10, padding: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  cancelBtn:    { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  cancelText:   { fontSize: 14, fontFamily: 'PoppinsSemiBold', color: '#64748B' },
  submitBtn:    { flex: 2, height: 44, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  submitText:   { fontSize: 14, fontFamily: 'PoppinsBold', color: '#FFF' },
  disabledBtn:  { opacity: 0.6 },
});

export default EditMemberModal;