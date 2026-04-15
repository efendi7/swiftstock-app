/**
 * MemberCardDesignTab.tsx
 * Tab "Kartu Member" di dalam WebSettings.
 * Admin design kartu + preview real-time + setting biaya pendaftaran.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Switch, Alert,
  KeyboardTypeOptions,
} from 'react-native';
import { Save, CheckCircle, Upload, Palette, Eye } from 'lucide-react-native';

import { COLORS } from '@constants/colors';
import { useAuth } from '@hooks/auth/useAuth';
import { MemberCardService } from '@services/memberCardService';
import { SettingsService } from '@services/settingsService';
import { MemberCardDesign, DEFAULT_CARD_DESIGN } from '@/types/memberCard.types';
import MemberCardPreview from '@components/member/MemberCardPreview';
import { Member } from '@/types/member.types';

// Member dummy untuk preview
const PREVIEW_MEMBER: Member = {
  id:               'preview123',
  name:             'Budi Santoso',
  phone:            '08123456789',
  email:            'budi@email.com',
  poin:             350,
  tier:             'Gold',
  totalSpend:       1500000,
  totalVisits:      12,
  discountOverride: null,
  createdAt:        { toDate: () => new Date() } as any,
};

const COLOR_PRESETS = [
  '#1C3A5A', '#0F172A', '#7C3AED', '#059669',
  '#DC2626', '#D97706', '#0284C7', '#DB2777',
];

const MemberCardDesignTab = () => {
  const { tenantId, user } = useAuth();

  const [design,     setDesign]     = useState<MemberCardDesign>(DEFAULT_CARD_DESIGN);
  const [storeName,  setStoreName]  = useState('');
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [showPreview,setShowPreview]= useState(true);

  const load = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const [d, s] = await Promise.all([
        MemberCardService.getCardDesign(tenantId),
        SettingsService.getStoreProfile(tenantId),
      ]);
      setDesign(d);
      setStoreName(s.storeName || 'Nama Toko');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!tenantId) return;
    try {
      setSaving(true);
      await MemberCardService.saveCardDesign(tenantId, design);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      Alert.alert('Gagal', e.message);
    } finally { setSaving(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.secondary} /></View>;

  return (
    <View style={styles.root}>
      {/* ── PANEL KIRI: SETTINGS ───────────────────────── */}
      <ScrollView style={styles.settingsPanel} showsVerticalScrollIndicator={false}>

        {/* BACKGROUND */}
        <Section title="Background Kartu">
          <Text style={styles.fieldLabel}>Tipe Background</Text>
          <View style={styles.bgTypeRow}>
            {(['color', 'gradient', 'image'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.bgTypeBtn, design.backgroundType === t && styles.bgTypeBtnActive]}
                onPress={() => setDesign({ ...design, backgroundType: t })}
              >
                <Text style={[styles.bgTypeBtnText, design.backgroundType === t && { color: '#FFF' }]}>
                  {t === 'color' ? 'Warna' : t === 'gradient' ? 'Gradasi' : 'Gambar'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {design.backgroundType !== 'image' && (
            <>
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Pilih Warna</Text>
              <View style={styles.colorGrid}>
                {COLOR_PRESETS.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorDot, { backgroundColor: c },
                      design.backgroundColor === c && styles.colorDotActive]}
                    onPress={() => setDesign({ ...design, backgroundColor: c })}
                  />
                ))}
                {/* Custom hex input */}
                <View style={styles.hexInputWrap}>
                  <Text style={styles.hexHash}>#</Text>
                  <TextInput
                    style={styles.hexInput}
                    value={design.backgroundColor.replace('#', '')}
                    onChangeText={v => v.length <= 6 && setDesign({ ...design, backgroundColor: '#' + v })}
                    maxLength={6}
                    placeholder="1C3A5A"
                  />
                </View>
              </View>

              {design.backgroundType === 'gradient' && (
                <>
                  <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Warna Gradasi Kedua</Text>
                  <View style={styles.colorGrid}>
                    {COLOR_PRESETS.map(c => (
                      <TouchableOpacity
                        key={c}
                        style={[styles.colorDot, { backgroundColor: c },
                          design.gradientColors?.[1] === c && styles.colorDotActive]}
                        onPress={() => setDesign({ ...design, gradientColors: [design.backgroundColor, c] })}
                      />
                    ))}
                  </View>
                </>
              )}
            </>
          )}

          {design.backgroundType === 'image' && (
            <TouchableOpacity style={styles.uploadBtn}>
              <Upload size={16} color={COLORS.primary} />
              <Text style={styles.uploadBtnText}>Upload Background (Cloudinary)</Text>
            </TouchableOpacity>
          )}
        </Section>

        {/* TEKS */}
        <Section title="Warna Teks">
          <View style={styles.textColorRow}>
            {(['light', 'dark'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.textColorBtn,
                  t === 'light' ? styles.textColorLight : styles.textColorDark,
                  design.textColor === t && styles.textColorBtnActive]}
                onPress={() => setDesign({ ...design, textColor: t })}
              >
                <Text style={{ color: t === 'light' ? '#FFF' : '#1E293B', fontFamily: 'PoppinsBold', fontSize: 13 }}>
                  {t === 'light' ? 'Terang' : 'Gelap'}
                </Text>
                {design.textColor === t && <CheckCircle size={14} color={t === 'light' ? '#FFF' : '#1E293B'} />}
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* ELEMEN */}
        <Section title="Elemen yang Ditampilkan">
          <SwitchRow label="Logo toko"      value={design.showLogo}    onChange={v => setDesign({ ...design, showLogo: v })} />
          <SwitchRow label="Tier member"    value={design.showTier}    onChange={v => setDesign({ ...design, showTier: v })} />
          <SwitchRow label="Jumlah poin"    value={design.showPoints}  onChange={v => setDesign({ ...design, showPoints: v })} />
          <SwitchRow label="Nomor HP"       value={design.showPhone}   onChange={v => setDesign({ ...design, showPhone: v })} />
          <SwitchRow label="Masa berlaku"   value={design.showExpiry}  onChange={v => setDesign({ ...design, showExpiry: v })} />
          {design.showExpiry && (
            <FieldRow label="Berlaku berapa bulan? (0 = seumur hidup)">
              <NumInput
                value={design.expiryMonths.toString()}
                onChange={v => setDesign({ ...design, expiryMonths: parseInt(v) || 0 })}
                placeholder="0"
              />
            </FieldRow>
          )}
        </Section>

        {/* SAVE */}
        <View style={styles.saveRow}>
          {saved && (
            <View style={styles.savedBadge}>
              <CheckCircle size={14} color="#10B981" />
              <Text style={styles.savedText}>Tersimpan!</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.disabledBtn]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#FFF" size="small" />
              : <><Save size={15} color="#FFF" /><Text style={styles.saveBtnText}>Simpan Desain</Text></>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── PANEL KANAN: PREVIEW ───────────────────────── */}
      <View style={styles.previewPanel}>
        <View style={styles.previewHeader}>
          <Eye size={16} color={COLORS.primary} />
          <Text style={styles.previewTitle}>Preview Kartu</Text>
        </View>

        <View style={styles.previewCenter}>
          <MemberCardPreview
            member={PREVIEW_MEMBER}
            design={design}
            storeName={storeName || 'Nama Toko'}
            tenantId={tenantId || ''}
            previewMode={true}
          />
          <Text style={styles.previewHint}>
            Preview menggunakan data dummy. Kartu asli berisi data member sebenarnya.
          </Text>
        </View>

        {/* Info QR */}
        <View style={styles.qrInfo}>
          <Text style={styles.qrInfoTitle}>QR Code berisi:</Text>
          <Text style={styles.qrInfoText}>Link publik kartu member</Text>
          <Text style={styles.qrInfoText}>Kasir scan → langsung ketemu member</Text>
          <Text style={styles.qrInfoText}>Customer buka → lihat info & poin mereka</Text>
        </View>
      </View>
    </View>
  );
};

// ── SUB-COMPONENTS ────────────────────────────────────────

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
  </View>
);

const NumInput = ({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) => (
  <TextInput
    style={styles.numInput}
    value={value}
    onChangeText={onChange}
    keyboardType="numeric"
    placeholder={placeholder}
    placeholderTextColor="#CBD5E1"
  />
);

const SwitchRow = ({ label, hint, value, onChange }: {
  label: string; hint?: string; value: boolean; onChange: (v: boolean) => void;
}) => (
  <View style={styles.switchRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
    </View>
    <Switch value={value} onValueChange={onChange} trackColor={{ false: '#E2E8F0', true: COLORS.secondary }} thumbColor="#FFF" />
  </View>
);

const styles = StyleSheet.create({
  root:           { flex: 1, flexDirection: 'row', overflow: 'hidden' as any },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  settingsPanel:  { flex: 1, padding: 24, borderRightWidth: 1, borderRightColor: '#E2E8F0' },
  previewPanel:   { width: 400, padding: 24, backgroundColor: '#F8FAFC' },
  previewHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  previewTitle:   { fontSize: 14, fontFamily: 'PoppinsBold', color: COLORS.primary },
  previewCenter:  { alignItems: 'center', marginBottom: 20 },
  previewHint:    { marginTop: 12, fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', textAlign: 'center' },
  qrInfo:         { backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  qrInfoTitle:    { fontSize: 13, fontFamily: 'PoppinsBold', color: '#1E293B', marginBottom: 6 },
  qrInfoText:     { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#64748B', marginBottom: 3 },
  section:        { backgroundColor: '#FFF', borderRadius: 14, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  sectionTitle:   { fontSize: 14, fontFamily: 'PoppinsBold', color: '#1E293B', marginBottom: 12 },
  fieldLabel:     { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#475569', marginBottom: 6 },
  fieldHint:      { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 2 },
  fieldRow:       { marginTop: 10 },
  bgTypeRow:      { flexDirection: 'row', gap: 8 },
  bgTypeBtn:      { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  bgTypeBtnActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  bgTypeBtnText:  { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#64748B' },
  colorGrid:      { flexDirection: 'row', flexWrap: 'wrap' as any, gap: 8 },
  colorDot:       { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  hexInputWrap:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 8, height: 32 },
  hexHash:        { fontSize: 13, fontFamily: 'PoppinsBold', color: '#64748B' },
  hexInput:       { width: 60, fontSize: 12, fontFamily: 'PoppinsRegular', color: '#1E293B', outlineStyle: 'none' as any },
  textColorRow:   { flexDirection: 'row', gap: 10 },
  textColorBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 10, borderWidth: 2, borderColor: 'transparent' },
  textColorLight: { backgroundColor: '#1C3A5A' },
  textColorDark:  { backgroundColor: '#F1F5F9' },
  textColorBtnActive: { borderColor: COLORS.secondary },
  switchRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  numInput:       { backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, height: 40, fontSize: 14, fontFamily: 'PoppinsRegular', color: '#1E293B', outlineStyle: 'none' as any },
  uploadBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary, borderStyle: 'dashed' as any, marginTop: 10, justifyContent: 'center' },
  uploadBtnText:  { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: COLORS.primary },
  saveRow:        { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, paddingBottom: 40 },
  savedBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  savedText:      { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#10B981' },
  saveBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  saveBtnText:    { fontSize: 13, fontFamily: 'PoppinsBold', color: '#FFF' },
  disabledBtn:    { opacity: 0.6 },
});

export default MemberCardDesignTab;