/**
 * WebSettings.tsx
 * Halaman pengaturan web — sidebar tab + konten per tab.
 * Logic: load/save via SettingsService.
 * UI: Section, Field, SwitchRow, CounterRow sebagai sub-components.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Switch, Alert, KeyboardTypeOptions,
} from 'react-native';
import {
  Store, Crown, Printer, Bell, Save, Plus, Trash2, ChevronRight, ClipboardList,
  CheckCircle, CreditCard, Hand, Zap, Target, Upload, X,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
  AlignLeft, AlignCenter, AlignRight, Image as ImageIcon,
} from 'lucide-react-native';
import MemberCardDesignTab  from '@components/member/MemberCardDesignTab';
import FloatingLabelInput   from '@components/FloatingLabelInput';
import { COLORS }           from '@constants/colors';
import { useAuth }          from '@hooks/auth/useAuth';
import { SettingsService, DEFAULT_MEMBER_SETTINGS } from '@services/settingsService';
import {
  StoreProfile, MemberSettings, PrinterSettings,
  NotificationSettings, TierSetting, LogoShape, LogoPosition, LogoAlign,
  RedeemCooldownPeriod,
} from '@/types/settings.types';

// ── Types ─────────────────────────────────────────────────

type TabId = 'store' | 'member' | 'membercard' | 'printer' | 'notification' | 'attendance';

// ── Constants ─────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'store',        label: 'Profil Toko',     icon: <Store      size={16} color="inherit" /> },
  { id: 'member',       label: 'Member',          icon: <Crown      size={16} color="inherit" /> },
  { id: 'membercard',   label: 'Kartu Member',    icon: <CreditCard size={16} color="inherit" /> },
  { id: 'printer',      label: 'Struk & Printer', icon: <Printer    size={16} color="inherit" /> },
  { id: 'notification', label: 'Notifikasi',      icon: <Bell       size={16} color="inherit" /> },
  { id: 'attendance',   label: 'Kehadiran',       icon: <ClipboardList size={16} color="inherit" /> },
];

const LOGO_THUMB = {
  square:    { width: 64, height: 64 },
  portrait:  { width: 48, height: 68 },
  landscape: { width: 96, height: 54 },
};

const STORE_DEFAULT: StoreProfile = {
  storeName: '', ownerName: '', address: '', phone: '', email: '',
  logoUrl: '', city: '', postalCode: '',
  logoShape: 'square', logoPosition: 'left', logoAlign: 'flex-start',
};
const PRINTER_DEFAULT: PrinterSettings = {
  receiptHeader: '', receiptFooter: 'Terima kasih telah berbelanja!',
  showLogo: true, showAddress: true, showPhone: true,
  paperSize: '80mm', printCopies: 1,
};
const NOTIF_DEFAULT: NotificationSettings = {
  lowStockAlert: true, lowStockThreshold: 10,
  dailyReportEnabled: false, dailyReportTime: '08:00',
};

export interface AttendanceSettings {
  lateToleranceMinutes:   number;  // menit toleransi terlambat (default 5)
  earlyLeaveToleranceMinutes: number; // menit toleransi pulang awal (default 5)
  checkInWindowBefore:    number;  // menit boleh check-in sebelum shift (default 30)
  checkInWindowAfter:     number;  // menit boleh check-in setelah shift mulai (default 120)
  autoAlphaEnabled:       boolean; // otomatis tandai alpha jika tidak check-in
  autoAlphaAfterMinutes:  number;  // berapa menit setelah shift mulai baru ditandai alpha
}

export const DEFAULT_ATTENDANCE_SETTINGS: AttendanceSettings = {
  lateToleranceMinutes:       5,
  earlyLeaveToleranceMinutes: 5,
  checkInWindowBefore:        30,
  checkInWindowAfter:         120,
  autoAlphaEnabled:           false,
  autoAlphaAfterMinutes:      60,
};

// ── Helpers ───────────────────────────────────────────────

const fmtRp = (n: number) => {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toLocaleString('id-ID')}`;
};

// ── Sub-components ────────────────────────────────────────

// Stepper +/- untuk nilai menit
const MinuteStepper = ({ label, hint, value, onChange, min = 0, max = 999, step = 5 }: {
  label: string; hint?: string; value: number;
  onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) => (
  <View style={s.switchRow}>
    <View style={{ flex: 1 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      {hint && <Text style={s.fieldHint}>{hint}</Text>}
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <TouchableOpacity
        style={s.stepBtn}
        onPress={() => onChange(Math.max(min, value - step))}
      >
        <Text style={s.stepBtnText}>−</Text>
      </TouchableOpacity>
      <View style={s.stepValueBox}>
        <Text style={s.stepValue}>{value}</Text>
        <Text style={s.stepUnit}>menit</Text>
      </View>
      <TouchableOpacity
        style={s.stepBtn}
        onPress={() => onChange(Math.min(max, value + step))}
      >
        <Text style={s.stepBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const Section = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
  <View style={s.section}>
    <Text style={s.sectionTitle}>{title}</Text>
    <Text style={s.sectionSubtitle}>{subtitle}</Text>
    <View style={s.sectionBody}>{children}</View>
  </View>
);

const Field = ({ label, value, onChange, placeholder, multiline, keyboardType }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; keyboardType?: KeyboardTypeOptions;
}) => (
  <FloatingLabelInput
    label={label} value={value} onChangeText={onChange}
    multiline={multiline} keyboardType={keyboardType}
    inputStyle={multiline ? { height: 70, textAlignVertical: 'top' } : undefined}
  />
);

const SwitchRow = ({ label, hint, value, onChange }: {
  label: string; hint?: string; value: boolean; onChange: (v: boolean) => void;
}) => (
  <View style={s.switchRow}>
    <View style={{ flex: 1 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      {hint && <Text style={s.fieldHint}>{hint}</Text>}
    </View>
    <Switch value={value} onValueChange={onChange} trackColor={{ false: '#E2E8F0', true: COLORS.secondary }} thumbColor="#FFF" />
  </View>
);

const CounterRow = ({ options, value, onChange }: {
  options: { label: string; value: string | number }[];
  value: string | number;
  onChange: (v: any) => void;
}) => (
  <View style={s.counterRow}>
    {options.map(opt => (
      <TouchableOpacity
        key={String(opt.value)}
        style={[s.counterBtn, value === opt.value && s.counterBtnActive]}
        onPress={() => onChange(opt.value)}
      >
        <Text style={[s.counterBtnText, value === opt.value && s.counterBtnTextActive]}>{opt.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ── Main Component ────────────────────────────────────────

const WebSettings = () => {
  const { tenantId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('store');
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [store,        setStore]        = useState<StoreProfile>(STORE_DEFAULT);
  const [member,       setMember]       = useState<MemberSettings>(DEFAULT_MEMBER_SETTINGS);
  const [printer,      setPrinter]      = useState<PrinterSettings>(PRINTER_DEFAULT);
  const [notification, setNotification] = useState<NotificationSettings>(NOTIF_DEFAULT);
  const [attendance,   setAttendance]   = useState<AttendanceSettings>(DEFAULT_ATTENDANCE_SETTINGS);

  // ── Load ─────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      setLoading(true);
      const all = await SettingsService.getAllSettings(tenantId);
      setStore(all.store);
      setMember(all.member);
      setPrinter(all.printer);
      setNotification(all.notification);
      const attSnap = await SettingsService.getAttendanceSettings(tenantId);
      if (attSnap) setAttendance(attSnap);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  // ── Save ─────────────────────────────────────────────────

  const handleSave = async () => {
    if (!tenantId) return;
    try {
      setSaving(true);
      if (activeTab === 'store')        await SettingsService.saveStoreProfile(tenantId, store);
      if (activeTab === 'member')       await SettingsService.saveMemberSettings(tenantId, member);
      if (activeTab === 'printer')      await SettingsService.savePrinterSettings(tenantId, printer);
      if (activeTab === 'notification') await SettingsService.saveNotificationSettings(tenantId, notification);
      if (activeTab === 'attendance')   await SettingsService.saveAttendanceSettings(tenantId, attendance);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      Alert.alert('Gagal', e.message || 'Gagal menyimpan pengaturan');
    } finally { setSaving(false); }
  };

  // ── Logo upload ───────────────────────────────────────────

  const handleLogoUpload = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingLogo(true);
        try {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('upload_preset', 'expo_products');
          fd.append('cloud_name', 'dlkrdbabo');
          const res  = await fetch('https://api.cloudinary.com/v1_1/dlkrdbabo/upload', { method: 'POST', body: fd });
          const json = await res.json();
          if (json.secure_url) setStore(prev => ({ ...prev, logoUrl: json.secure_url }));
        } catch { Alert.alert('Gagal', 'Upload logo gagal. Coba lagi.'); }
        finally   { setUploadingLogo(false); }
      };
      input.click();
    } catch { setUploadingLogo(false); }
  };

  // ── Tier helpers ──────────────────────────────────────────

  const addCustomTier = () => {
    const tiers = member.customTiers ?? [];
    setMember({ ...member, useCustomTiers: true, customTiers: [...tiers, { name: 'Tier Baru', minPoin: 0, discount: 0, color: '#94A3B8' }] });
  };

  const updateTier = (i: number, field: keyof TierSetting, value: any) => {
    const tiers = [...(member.customTiers ?? [])];
    tiers[i] = { ...tiers[i], [field]: value };
    setMember({ ...member, customTiers: tiers });
  };

  const removeTier = (i: number) => {
    setMember({ ...member, customTiers: (member.customTiers ?? []).filter((_, idx) => idx !== i) });
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={COLORS.secondary} /></View>;

  return (
    <View style={s.root}>

      {/* Sidebar */}
      <View style={s.sidebar}>
        <Text style={s.sidebarTitle}>Pengaturan</Text>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <TouchableOpacity key={tab.id} style={[s.tabItem, active && s.tabItemActive]} onPress={() => setActiveTab(tab.id)}>
              <View style={{ opacity: active ? 1 : 0.45 }}>{tab.icon}</View>
              <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
              {active && <ChevronRight size={14} color="#FFF" style={{ marginLeft: 'auto' as any }} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <View style={s.content}>
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── STORE ─────────────────────────────────────── */}
          {activeTab === 'store' && (
            <>
              <Section title="Profil Toko" subtitle="Informasi toko yang tampil di struk dan dashboard">
                <Field label="Nama Toko *"           value={store.storeName}   onChange={v => setStore({ ...store, storeName: v })}   placeholder="Contoh: Toko Maju Jaya" />
                <Field label="Nama Pemilik"          value={store.ownerName}   onChange={v => setStore({ ...store, ownerName: v })}   placeholder="Nama pemilik toko" />
                <Field label="Nomor HP / WhatsApp"   value={store.phone}       onChange={v => setStore({ ...store, phone: v })}       keyboardType="phone-pad" />
                <Field label="Email"                 value={store.email}       onChange={v => setStore({ ...store, email: v })}       keyboardType="email-address" />
                <Field label="Alamat Lengkap"        value={store.address}     onChange={v => setStore({ ...store, address: v })}     multiline />
                <View style={s.rowDouble}>
                  <View style={{ flex: 1 }}><Field label="Kota"     value={store.city}       onChange={v => setStore({ ...store, city: v })} /></View>
                  <View style={{ flex: 1 }}><Field label="Kode Pos" value={store.postalCode} onChange={v => setStore({ ...store, postalCode: v })} keyboardType="numeric" /></View>
                </View>

                {/* Logo upload */}
                <LogoUploadField
                  logoUrl={store.logoUrl}
                  logoShape={store.logoShape}
                  uploading={uploadingLogo}
                  onUpload={handleLogoUpload}
                  onRemove={() => setStore({ ...store, logoUrl: '' })}
                />

                {/* Logo shape */}
                <View style={s.formRow}>
                  <Text style={s.fieldLabel}>Bentuk Logo di Sidebar</Text>
                  <Text style={s.fieldHint}>Pilih proporsi tampilan logo</Text>
                  <View style={s.counterRow}>
                    {([
                      { value: 'square',    label: 'Square',    hint: '1:1',  w: 15, h: 15 },
                      { value: 'portrait',  label: 'Portrait',  hint: '3:4',  w: 11, h: 16 },
                      { value: 'landscape', label: 'Landscape', hint: '16:9', w: 19, h: 11 },
                    ] as { value: LogoShape; label: string; hint: string; w: number; h: number }[]).map(opt => {
                      const active = store.logoShape === opt.value;
                      return (
                        <TouchableOpacity key={opt.value} style={[s.counterBtn, active && s.counterBtnActive, { alignItems: 'center', gap: 6 }]} onPress={() => setStore({ ...store, logoShape: opt.value })}>
                          <View style={{ width: opt.w, height: opt.h, borderRadius: 3, borderWidth: 1.5, borderColor: active ? 'rgba(255,255,255,0.8)' : '#94A3B8', backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'transparent' }} />
                          <Text style={[s.counterBtnText, active && s.counterBtnTextActive]}>{opt.label}</Text>
                          <Text style={{ fontSize: 9, fontFamily: 'PoppinsRegular', color: active ? 'rgba(255,255,255,0.6)' : '#94A3B8' }}>{opt.hint}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Logo position */}
                <View style={s.formRow}>
                  <Text style={s.fieldLabel}>Posisi Logo terhadap Nama Toko</Text>
                  <Text style={s.fieldHint}>Atur letak logo di header sidebar</Text>
                  <View style={s.counterRow}>
                    {([
                      { value: 'left',   label: 'Kiri',  icon: <ArrowLeft  size={13} /> },
                      { value: 'right',  label: 'Kanan', icon: <ArrowRight size={13} /> },
                      { value: 'top',    label: 'Atas',  icon: <ArrowUp    size={13} /> },
                      { value: 'bottom', label: 'Bawah', icon: <ArrowDown  size={13} /> },
                    ] as { value: LogoPosition; label: string; icon: React.ReactNode }[]).map(opt => {
                      const active = store.logoPosition === opt.value;
                      return (
                        <TouchableOpacity key={opt.value} style={[s.counterBtn, active && s.counterBtnActive]} onPress={() => setStore({ ...store, logoPosition: opt.value })}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>{opt.icon}<Text style={[s.counterBtnText, active && s.counterBtnTextActive]}>{opt.label}</Text></View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Logo align */}
                <View style={s.formRow}>
                  <Text style={s.fieldLabel}>Rata Header Sidebar</Text>
                  <Text style={s.fieldHint}>Perataan keseluruhan konten (logo + nama toko)</Text>
                  <View style={s.counterRow}>
                    {([
                      { value: 'flex-start', label: 'Kiri',   icon: <AlignLeft   size={14} /> },
                      { value: 'center',     label: 'Tengah', icon: <AlignCenter size={14} /> },
                      { value: 'flex-end',   label: 'Kanan',  icon: <AlignRight  size={14} /> },
                    ] as { value: LogoAlign; label: string; icon: React.ReactNode }[]).map(opt => {
                      const active = store.logoAlign === opt.value;
                      return (
                        <TouchableOpacity key={opt.value} style={[s.counterBtn, active && s.counterBtnActive]} onPress={() => setStore({ ...store, logoAlign: opt.value })}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>{opt.icon}<Text style={[s.counterBtnText, active && s.counterBtnTextActive]}>{opt.label}</Text></View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </Section>

              {/* Target omzet */}
              <Section title="Target Omzet" subtitle="Target pendapatan per periode. Tampil sebagai progress di dashboard.">
                {([
                  { key: 'today', label: 'Target Harian',   placeholder: '1000000'   },
                  { key: 'week',  label: 'Target Mingguan', placeholder: '7000000'   },
                  { key: 'month', label: 'Target Bulanan',  placeholder: '30000000'  },
                  { key: 'year',  label: 'Target Tahunan',  placeholder: '360000000' },
                ] as const).map(({ key, label, placeholder }) => {
                  const val = store.targets?.[key] ?? 0;
                  return (
                    <View key={key} style={s.formRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 13, fontFamily: 'PoppinsMedium', color: '#475569' }}>Rp</Text>
                        <Field
                          label={label} value={val > 0 ? String(val) : ''}
                          onChange={v => setStore({ ...store, targets: { today: 0, week: 0, month: 0, year: 0, ...store.targets, [key]: Number(v.replace(/\D/g, '')) || 0 } })}
                          placeholder={placeholder} keyboardType="numeric"
                        />
                      </View>
                      {val > 0 && <Text style={{ fontSize: 11, fontFamily: 'PoppinsRegular', color: COLORS.secondary, marginTop: 4 }}>{fmtRp(val)}</Text>}
                    </View>
                  );
                })}
              </Section>
            </>
          )}

          {/* ── MEMBER ────────────────────────────────────── */}
          {activeTab === 'member' && (
            <>
              <Section title="Model Membership" subtitle="Bagaimana customer menjadi member">
                {([
                  { value: 'opt-in',       label: 'Opt-in Manual', Icon: Hand,   desc: 'Kasir daftarkan customer secara manual. Walk-in tidak tercatat.' },
                  { value: 'auto-capture', label: 'Auto-capture',  Icon: Zap,    desc: 'Setiap transaksi dengan nomor HP otomatis menjadi member penuh.' },
                  { value: 'conditional',  label: 'Bersyarat',     Icon: Target, desc: 'Customer masuk sebagai calon member dulu. Jadi penuh setelah memenuhi syarat.' },
                ] as const).map(opt => {
                  const active = member.membershipModel === opt.value;
                  return (
                    <TouchableOpacity key={opt.value} style={[s.modelCard, active && s.modelCardActive]} onPress={() => setMember({ ...member, membershipModel: opt.value })}>
                      <View style={[s.modelCardIcon, active && { backgroundColor: 'rgba(0,167,157,0.12)' }]}>
                        <opt.Icon size={18} color={active ? COLORS.secondary : '#94A3B8'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.modelCardLabel, active && { color: COLORS.primary }]}>{opt.label}</Text>
                        <Text style={s.modelCardDesc}>{opt.desc}</Text>
                      </View>
                      {active && <CheckCircle size={18} color={COLORS.secondary} />}
                    </TouchableOpacity>
                  );
                })}
              </Section>

              {member.membershipModel === 'conditional' && (
                <Section title="Syarat Keanggotaan" subtitle="Tentukan syarat customer bisa jadi member penuh">
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>

                    {/* Syarat gratis */}
                    <View style={[s.conditionalBox, { flex: 1 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Target size={13} color={COLORS.primary} />
                        <Text style={s.conditionalTitle}>Syarat Gratis</Text>
                      </View>
                      <Text style={s.hintText}>Customer otomatis jadi member penuh setelah memenuhi syarat ini</Text>
                      <View style={s.logicRow}>
                        {(['OR', 'AND'] as const).map(l => (
                          <TouchableOpacity key={l} style={[s.logicBtn, { flex: 1 }, member.conditionalLogic === l && s.logicBtnActive]} onPress={() => setMember(p => ({ ...p, conditionalLogic: l }))}>
                            <Text style={[s.logicBtnText, member.conditionalLogic === l && s.logicBtnTextActive]}>{l === 'OR' ? 'Salah Satu' : 'Semua Syarat'}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Text style={[s.hintText, { marginBottom: 12 }]}>
                        {member.conditionalLogic === 'OR' ? 'Cukup salah satu syarat terpenuhi.' : 'Semua syarat harus terpenuhi.'}
                      </Text>
                      <FloatingLabelInput label="Min. kunjungan (transaksi)" value={String(member.minVisits ?? 3)} onChangeText={v => setMember(p => ({ ...p, minVisits: Number(v) || 0 }))} keyboardType="numeric" />
                      <FloatingLabelInput label="Min. total belanja (Rp)"   value={String(member.minTotalSpend ?? 100000)} onChangeText={v => setMember(p => ({ ...p, minTotalSpend: Number(v) || 0 }))} keyboardType="numeric" />
                    </View>

                    {/* Syarat berbayar */}
                    <View style={[s.conditionalBox, { flex: 1 }, member.conditionalFeeEnabled ? { backgroundColor: '#FFFBEB', borderColor: '#FED7AA' } : {}]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <CreditCard size={13} color={member.conditionalFeeEnabled ? '#D97706' : '#94A3B8'} />
                        <Text style={[s.conditionalTitle, { flex: 1, marginBottom: 0 }, member.conditionalFeeEnabled ? { color: '#92400E' } : { color: '#94A3B8' }]}>Opsi Berbayar</Text>
                        <Switch value={member.conditionalFeeEnabled ?? false} onValueChange={v => setMember(p => ({ ...p, conditionalFeeEnabled: v }))} trackColor={{ false: '#E2E8F0', true: '#FCD34D' }} thumbColor={member.conditionalFeeEnabled ? '#D97706' : '#FFF'} />
                      </View>
                      {member.conditionalFeeEnabled ? (
                        <>
                          <Text style={s.hintText}>Customer bisa langsung jadi member penuh dengan membayar biaya ini, tanpa menunggu syarat gratis.</Text>
                          <FloatingLabelInput label="Biaya daftar langsung (Rp)" value={String(member.conditionalFee ?? 0)} onChangeText={v => setMember(p => ({ ...p, conditionalFee: Number(v) || 0 }))} keyboardType="numeric" />
                          {(member.conditionalFee ?? 0) > 0 && (
                            <Text style={[s.hintText, { color: '#D97706', marginTop: 2 }]}>
                              Customer skip syarat gratis dengan bayar Rp {(member.conditionalFee ?? 0).toLocaleString('id-ID')}
                            </Text>
                          )}
                        </>
                      ) : (
                        <Text style={[s.hintText, { color: '#94A3B8' }]}>Aktifkan untuk menambah opsi berbayar agar customer bisa langsung jadi member penuh tanpa menunggu syarat gratis.</Text>
                      )}
                    </View>
                  </View>
                </Section>
              )}

              {/* ── Sistem Poin — dengan instruksi yang jelas ── */}
              <Section
                title="Sistem Poin"
                subtitle="Atur cara poin dihitung saat transaksi dan ditukar saat pembayaran"
              >
                {/* Kumpulkan poin */}
                <View style={s.poinBox}>
                  <View style={s.poinBoxHeader}>
                    <Text style={s.poinBoxTitle}>🛍️ Mengumpulkan Poin</Text>
                    <Text style={s.poinBoxDesc}>
                      Setiap kelipatan nilai transaksi di bawah → customer mendapat 1 poin.{'\n'}
                      Contoh: belanja Rp 75.000 dengan kelipatan Rp 1.000 = <Text style={s.poinBoxEmphasis}>75 poin</Text>.
                    </Text>
                  </View>
                  <View style={s.inputWithUnit}>
                    <Text style={s.unitPrefix}>Rp</Text>
                    <TextInput
                      style={s.unitInput}
                      value={member.pointsPerRupiah.toString()}
                      onChangeText={v => setMember({ ...member, pointsPerRupiah: parseInt(v) || 0 })}
                      keyboardType="numeric" placeholder="1000"
                    />
                    <Text style={s.unitSuffix}>= 1 poin</Text>
                  </View>
                  {member.pointsPerRupiah > 0 && (
                    <Text style={s.poinPreview}>
                      Belanja Rp 100.000 = <Text style={s.poinPreviewBold}>{Math.floor(100_000 / member.pointsPerRupiah)} poin</Text>
                    </Text>
                  )}
                </View>

                {/* Tukar poin */}
                <View style={s.poinBox}>
                  <View style={s.poinBoxHeader}>
                    <Text style={s.poinBoxTitle}>💰 Menukar Poin (Redeem)</Text>
                    <Text style={s.poinBoxDesc}>
                      Nilai rupiah per 1 poin saat customer memakai poin untuk bayar.{'\n'}
                      Contoh: punya 192 poin × Rp 100 = <Text style={s.poinBoxEmphasis}>potongan Rp 19.200</Text>.
                    </Text>
                  </View>
                  <View style={s.inputWithUnit}>
                    <Text style={s.unitPrefix}>1 poin =</Text>
                    <TextInput
                      style={s.unitInput}
                      value={member.redeemRate.toString()}
                      onChangeText={v => setMember({ ...member, redeemRate: parseInt(v) || 0 })}
                      keyboardType="numeric" placeholder="100"
                    />
                    <Text style={s.unitSuffix}>Rp</Text>
                  </View>
                  {member.redeemRate > 0 && (
                    <Text style={s.poinPreview}>
                      100 poin = potongan <Text style={s.poinPreviewBold}>Rp {(100 * member.redeemRate).toLocaleString('id-ID')}</Text>
                    </Text>
                  )}
                  {member.redeemRate === 0 && (
                    <View style={s.warningBox}>
                      <Text style={s.warningText}>⚠️ Nilai 0 berarti redeem dinonaktifkan — customer tidak bisa tukar poin.</Text>
                    </View>
                  )}
                </View>

                {/* Pembatasan Redeem */}
                <View style={s.poinBox}>
                  <Text style={s.poinBoxTitle}>🔒 Pembatasan Redeem</Text>
                  <Text style={s.poinBoxDesc}>
                    Cegah member redeem terlalu sering atau dengan poin terlalu sedikit.
                  </Text>

                  {/* Minimum poin */}
                  <View style={s.restrictRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.restrictLabel}>Minimum poin untuk redeem</Text>
                      <Text style={s.fieldHint}>0 = tidak ada minimum, bebas redeem berapapun poin</Text>
                    </View>
                    <View style={s.restrictInput}>
                      <TextInput
                        style={s.unitInput}
                        value={(member.minRedeemPoin ?? 0).toString()}
                        onChangeText={v => setMember({ ...member, minRedeemPoin: parseInt(v) || 0 })}
                        keyboardType="numeric" placeholder="0"
                      />
                      <Text style={s.unitSuffix}>poin</Text>
                    </View>
                  </View>
                  {(member.minRedeemPoin ?? 0) > 0 && member.redeemRate > 0 && (
                    <Text style={s.poinPreview}>
                      Member harus punya minimal <Text style={s.poinPreviewBold}>{member.minRedeemPoin} poin</Text>
                      {' '}(= Rp {((member.minRedeemPoin ?? 0) * member.redeemRate).toLocaleString('id-ID')}) untuk bisa redeem
                    </Text>
                  )}

                  {/* Cooldown period */}
                  <View style={[s.restrictRow, { marginTop: 12 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.restrictLabel}>Frekuensi redeem</Text>
                      <Text style={s.fieldHint}>Batasi seberapa sering member boleh menukar poin</Text>
                    </View>
                  </View>
                  <View style={s.counterRow}>
                    {([
                      { value: 'none',    label: 'Bebas',       desc: 'Tidak dibatasi' },
                      { value: 'daily',   label: 'Per Hari',    desc: '1x / hari' },
                      { value: 'weekly',  label: 'Per Minggu',  desc: '1x / 7 hari' },
                      { value: 'monthly', label: 'Per Bulan',   desc: '1x / 30 hari' },
                    ] as { value: RedeemCooldownPeriod; label: string; desc: string }[]).map(opt => {
                      const active = (member.redeemCooldown ?? 'none') === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[s.cooldownBtn, active && s.cooldownBtnActive]}
                          onPress={() => setMember({ ...member, redeemCooldown: opt.value })}
                        >
                          <Text style={[s.cooldownBtnLabel, active && s.cooldownBtnLabelActive]}>{opt.label}</Text>
                          <Text style={[s.cooldownBtnDesc, active && s.cooldownBtnDescActive]}>{opt.desc}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {(member.redeemCooldown ?? 'none') !== 'none' && (
                    <View style={s.cooldownNote}>
                      <Text style={s.cooldownNoteText}>
                        {member.redeemCooldown === 'daily'
                          ? '⏱ Setelah redeem, member harus menunggu hingga keesokan hari untuk redeem lagi.'
                          : member.redeemCooldown === 'weekly'
                          ? '⏱ Setelah redeem, member harus menunggu 7 hari untuk redeem lagi.'
                          : '⏱ Setelah redeem, member harus menunggu 30 hari untuk redeem lagi.'}
                      </Text>
                    </View>
                  )}
                </View>
              </Section>

              {/* Tier */}
              <Section title="Tier Member" subtitle="Level member berdasarkan akumulasi poin">
                <SwitchRow
                  label="Gunakan tier custom?"
                  hint="Matikan untuk pakai tier default (Reguler / Silver / Gold / Platinum)"
                  value={member.useCustomTiers}
                  onChange={v => setMember({ ...member, useCustomTiers: v })}
                />

                {member.useCustomTiers ? (
                  <>
                    {(member.customTiers ?? []).map((tier, i) => (
                      <View key={i} style={s.tierRow}>
                        <View style={[s.tierColorDot, { backgroundColor: tier.color }]} />
                        <TextInput style={[s.tierInput, { flex: 2 }]} value={tier.name}           onChangeText={v => updateTier(i, 'name', v)}                  placeholder="Nama tier" />
                        <TextInput style={s.tierInput}                value={tier.minPoin.toString()} onChangeText={v => updateTier(i, 'minPoin', parseInt(v)||0)} keyboardType="numeric" placeholder="Min poin" />
                        <TextInput style={s.tierInput}                value={tier.discount.toString()} onChangeText={v => updateTier(i, 'discount', parseInt(v)||0)} keyboardType="numeric" placeholder="Diskon%" />
                        <TouchableOpacity onPress={() => removeTier(i)}><Trash2 size={16} color="#EF4444" /></TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity style={s.addTierBtn} onPress={addCustomTier}>
                      <Plus size={14} color={COLORS.primary} /><Text style={s.addTierText}>Tambah Tier</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={s.defaultTiersInfo}>
                    {[
                      { name: 'Reguler', min: '0',    disc: '0%',  color: '#94A3B8' },
                      { name: 'Silver',  min: '100',  disc: '5%',  color: '#64748B' },
                      { name: 'Gold',    min: '500',  disc: '10%', color: '#F59E0B' },
                      { name: 'Platinum',min: '1000', disc: '15%', color: '#8B5CF6' },
                    ].map(t => (
                      <View key={t.name} style={s.defaultTierItem}>
                        <View style={[s.tierColorDot, { backgroundColor: t.color }]} />
                        <Text style={s.defaultTierName}>{t.name}</Text>
                        <Text style={s.defaultTierMeta}>≥ {t.min} poin</Text>
                        <Text style={[s.defaultTierDisc, { color: t.color }]}>Diskon {t.disc}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Section>
            </>
          )}

          {/* ── KARTU MEMBER ──────────────────────────────── */}
          {activeTab === 'membercard' && <MemberCardDesignTab />}

          {/* ── PRINTER ───────────────────────────────────── */}
          {activeTab === 'printer' && (
            <Section title="Struk & Printer" subtitle="Konfigurasi tampilan nota/struk belanja">
              <Field label="Header Struk"  value={printer.receiptHeader} onChange={v => setPrinter({ ...printer, receiptHeader: v })} placeholder="Kosong = nama toko otomatis" />
              <Field label="Footer Struk"  value={printer.receiptFooter} onChange={v => setPrinter({ ...printer, receiptFooter: v })} placeholder="Terima kasih telah berbelanja!" />
              <View style={s.formRow}>
                <Text style={s.fieldLabel}>Ukuran Kertas</Text>
                <CounterRow options={[{ label: '58mm', value: '58mm' }, { label: '80mm', value: '80mm' }]} value={printer.paperSize} onChange={v => setPrinter({ ...printer, paperSize: v })} />
              </View>
              <View style={s.formRow}>
                <Text style={s.fieldLabel}>Jumlah Salinan</Text>
                <CounterRow options={[{ label: '1 lembar', value: 1 }, { label: '2 lembar', value: 2 }]} value={printer.printCopies} onChange={v => setPrinter({ ...printer, printCopies: v })} />
              </View>
              <View style={s.switchSection}>
                <SwitchRow label="Tampilkan logo di struk" value={printer.showLogo}    onChange={v => setPrinter({ ...printer, showLogo: v })} />
                <SwitchRow label="Tampilkan alamat"         value={printer.showAddress} onChange={v => setPrinter({ ...printer, showAddress: v })} />
                <SwitchRow label="Tampilkan nomor HP"        value={printer.showPhone}   onChange={v => setPrinter({ ...printer, showPhone: v })} />
              </View>
            </Section>
          )}

          {/* ── NOTIFIKASI ────────────────────────────────── */}
          {activeTab === 'notification' && (
            <Section title="Notifikasi" subtitle="Atur kapan dan bagaimana Anda diberi tahu">
              <View style={s.switchSection}>
                <SwitchRow label="Notifikasi stok kritis" hint="Beri tahu admin ketika stok produk di bawah batas" value={notification.lowStockAlert} onChange={v => setNotification({ ...notification, lowStockAlert: v })} />
              </View>
              {notification.lowStockAlert && (
                <View style={s.inputWithUnit}>
                  <TextInput style={s.unitInput} value={notification.lowStockThreshold.toString()} onChangeText={v => setNotification({ ...notification, lowStockThreshold: parseInt(v) || 0 })} keyboardType="numeric" placeholder="10" />
                  <Text style={s.unitSuffix}>unit</Text>
                </View>
              )}
              <View style={[s.switchSection, { marginTop: 16 }]}>
                <SwitchRow label="Laporan harian otomatis" hint="Kirim ringkasan transaksi harian ke email admin" value={notification.dailyReportEnabled} onChange={v => setNotification({ ...notification, dailyReportEnabled: v })} />
              </View>
              {notification.dailyReportEnabled && (
                <Field label="Jam kirim laporan" value={notification.dailyReportTime} onChange={v => setNotification({ ...notification, dailyReportTime: v })} placeholder="08:00" />
              )}
            </Section>
          )}

          {/* ── Tab Kehadiran ── */}
          {activeTab === 'attendance' && (
            <>
              <Section
                title="Toleransi Jam"
                subtitle="Batas toleransi sebelum keterlambatan atau pulang awal dihitung sebagai kekurangan jam"
              >
                <MinuteStepper
                  label="Toleransi terlambat masuk"
                  hint="Kasir yang terlambat di bawah batas ini tidak dihitung kekurangan jam"
                  value={attendance.lateToleranceMinutes}
                  onChange={v => setAttendance({ ...attendance, lateToleranceMinutes: v })}
                  min={0} max={60} step={5}
                />
                <MinuteStepper
                  label="Toleransi pulang awal"
                  hint="Kasir yang pulang lebih awal di bawah batas ini tidak dihitung kekurangan jam"
                  value={attendance.earlyLeaveToleranceMinutes}
                  onChange={v => setAttendance({ ...attendance, earlyLeaveToleranceMinutes: v })}
                  min={0} max={60} step={5}
                />
              </Section>

              <Section
                title="Jendela Check-in"
                subtitle="Kapan kasir boleh mulai dan batas akhir check-in"
              >
                <MinuteStepper
                  label="Boleh check-in sebelum shift"
                  hint="Kasir bisa check-in maksimal N menit sebelum shift dimulai"
                  value={attendance.checkInWindowBefore}
                  onChange={v => setAttendance({ ...attendance, checkInWindowBefore: v })}
                  min={0} max={120} step={5}
                />
                <MinuteStepper
                  label="Batas akhir check-in"
                  hint="Setelah N menit dari mulai shift, kasir tidak bisa check-in mandiri"
                  value={attendance.checkInWindowAfter}
                  onChange={v => setAttendance({ ...attendance, checkInWindowAfter: v })}
                  min={0} max={480} step={15}
                />
              </Section>

              <Section
                title="Alpha Otomatis"
                subtitle="Tandai kasir sebagai alpha secara otomatis jika tidak check-in"
              >
                <View style={s.switchSection}>
                  <SwitchRow
                    label="Aktifkan alpha otomatis"
                    hint="Sistem akan tandai kasir sebagai alpha jika tidak check-in setelah batas waktu"
                    value={attendance.autoAlphaEnabled}
                    onChange={v => setAttendance({ ...attendance, autoAlphaEnabled: v })}
                  />
                </View>
                {attendance.autoAlphaEnabled && (
                  <MinuteStepper
                    label="Tandai alpha setelah"
                    hint="Berapa menit setelah shift mulai sebelum otomatis ditandai alpha"
                    value={attendance.autoAlphaAfterMinutes}
                    onChange={v => setAttendance({ ...attendance, autoAlphaAfterMinutes: v })}
                    min={15} max={480} step={15}
                  />
                )}
              </Section>

              {/* Info box */}
              <View style={s.infoBox}>
                <Text style={s.infoTitle}>💡 Cara kerja toleransi</Text>
                <Text style={s.infoText}>
                  Jika toleransi terlambat = 5 menit, kasir yang check-in 3 menit setelah jadwal tidak dihitung kekurangan jam. Baru terlambat 6 menit ke atas yang tercatat.
                </Text>
                <Text style={[s.infoText, { marginTop: 6 }]}>
                  Pengaturan ini berlaku untuk semua kasir di toko ini.
                </Text>
              </View>
            </>
          )}

        </ScrollView>

        {/* Footer save */}
        {activeTab !== 'membercard' && (
          <View style={s.footer}>
            {saved && (
              <View style={s.savedBadge}>
                <CheckCircle size={14} color="#10B981" />
                <Text style={s.savedText}>Tersimpan!</Text>
              </View>
            )}
            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#FFF" size="small" />
                : <><Save size={16} color="#FFF" /><Text style={s.saveBtnText}>Simpan Perubahan</Text></>
              }
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// ── Logo upload field (extracted) ─────────────────────────

const LogoUploadField = ({ logoUrl, logoShape, uploading, onUpload, onRemove }: {
  logoUrl: string; logoShape: LogoShape; uploading: boolean;
  onUpload: () => void; onRemove: () => void;
}) => {
  const dim = LOGO_THUMB[logoShape];
  const thumbStyle = { width: dim.width, height: dim.height, borderRadius: 10, overflow: 'hidden' as const, borderWidth: 1, borderColor: '#E2E8F0' };
  return (
    <View style={s.formRow}>
      <Text style={s.fieldLabel}>Logo Toko</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6 }}>
        <View style={[thumbStyle, !logoUrl && { backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }]}>
          {logoUrl
            ? <Image source={{ uri: logoUrl }} style={{ width: dim.width, height: dim.height }} resizeMode="cover" />
            : <ImageIcon size={28} color="#CBD5E1" />}
        </View>
        <View style={{ gap: 8 }}>
          <TouchableOpacity style={[s.uploadBtn, uploading && { opacity: 0.5 }]} onPress={onUpload} disabled={uploading}>
            {uploading
              ? <ActivityIndicator size="small" color={COLORS.primary} />
              : <><Upload size={14} color={COLORS.primary} /><Text style={s.uploadBtnText}>Pilih Foto dari Perangkat</Text></>
            }
          </TouchableOpacity>
          {!!logoUrl && (
            <TouchableOpacity style={s.removLogoBtn} onPress={onRemove}>
              <X size={13} color="#EF4444" /><Text style={s.removeLogoBtnText}>Hapus Logo</Text>
            </TouchableOpacity>
          )}
          <Text style={s.fieldHint}>JPG, PNG, WebP · Maks 5MB</Text>
        </View>
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────

const s = StyleSheet.create({
  root:    { flex: 1, flexDirection: 'row', overflow: 'hidden' as any },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },

  sidebar:      { width: 220, backgroundColor: '#FFF', borderRightWidth: 1, borderRightColor: '#E2E8F0', paddingTop: 24, paddingHorizontal: 12 },
  sidebarTitle: { fontSize: 11, fontFamily: 'PoppinsBold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 12, marginBottom: 12 },
  tabItem:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 10, marginBottom: 4 },
  tabItemActive:{ backgroundColor: COLORS.secondary },
  tabLabel:     { fontSize: 13, fontFamily: 'PoppinsMedium', color: '#64748B', flex: 1 },
  tabLabelActive:{ color: '#FFF', fontFamily: 'PoppinsBold' },

  content:     { flex: 1, flexDirection: 'column', overflow: 'hidden' as any },
  scroll:      { flex: 1 },
  scrollContent:{ padding: 28, paddingBottom: 100 },

  section:        { backgroundColor: '#FFF', borderRadius: 16, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  sectionTitle:   { fontSize: 16, fontFamily: 'PoppinsBold', color: '#1E293B', marginBottom: 4 },
  sectionSubtitle:{ fontSize: 12, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginBottom: 20 },
  sectionBody:    { gap: 16 },

  formRow:      { gap: 6 },
  rowDouble:    { flexDirection: 'row', gap: 12 },
  fieldLabel:   { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#475569' },
  fieldHint:    { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 2 },
  inputWithUnit:{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, height: 44 },
  unitPrefix:   { fontSize: 13, fontFamily: 'PoppinsMedium', color: '#64748B', marginRight: 8 },
  unitInput:    { flex: 1, fontSize: 14, fontFamily: 'PoppinsRegular', color: '#1E293B', outlineStyle: 'none' as any },
  unitSuffix:   { fontSize: 13, fontFamily: 'PoppinsMedium', color: '#64748B', marginLeft: 8 },

  // Sistem poin
  poinBox:         { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
  poinBoxHeader:   { gap: 4 },
  poinBoxTitle:    { fontSize: 13, fontFamily: 'PoppinsBold', color: '#1E293B' },
  poinBoxDesc:     { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#64748B', lineHeight: 18 },
  poinBoxEmphasis: { fontFamily: 'PoppinsBold', color: COLORS.primary },
  poinPreview:     { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#64748B', backgroundColor: '#EFF6FF', padding: 8, borderRadius: 8 },
  poinPreviewBold: { fontFamily: 'PoppinsBold', color: COLORS.primary },
  warningBox:      { backgroundColor: '#FEF3C7', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#FDE68A' },
  warningText:     { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#92400E' },

  // Member model
  conditionalBox:  { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  conditionalTitle:{ fontSize: 13, fontFamily: 'PoppinsBold', color: '#1E293B', marginBottom: 12 },
  hintText:        { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#64748B', marginBottom: 10, lineHeight: 16 },
  logicRow:        { flexDirection: 'row', gap: 8, marginBottom: 8 },
  logicBtn:        { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF', alignItems: 'center' },
  logicBtnActive:  { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  logicBtnText:    { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#64748B' },
  logicBtnTextActive:{ color: '#FFF' },
  modelCard:       { padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 12 },
  modelCardActive: { borderColor: COLORS.secondary, backgroundColor: '#F0FDFA' },
  modelCardIcon:   { width: 38, height: 38, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  modelCardLabel:  { fontSize: 14, fontFamily: 'PoppinsBold', color: '#475569' },
  modelCardDesc:   { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 2 },

  // Counter
  counterRow:          { flexDirection: 'row', gap: 8, flexWrap: 'wrap' as any },
  counterBtn:          { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  counterBtnActive:    { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  counterBtnText:      { fontSize: 13, fontFamily: 'PoppinsMedium', color: '#64748B' },
  counterBtnTextActive:{ color: '#FFF' },

  // Tier
  tierRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  tierInput:        { flex: 1, backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 10, height: 36, fontSize: 13, fontFamily: 'PoppinsRegular', color: '#1E293B', outlineStyle: 'none' as any },
  tierColorDot:     { width: 12, height: 12, borderRadius: 6 },
  addTierBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, justifyContent: 'center', borderWidth: 1, borderColor: COLORS.primary, borderRadius: 10, borderStyle: 'dashed' as any },
  addTierText:      { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: COLORS.primary },
  defaultTiersInfo: { gap: 8 },
  defaultTierItem:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10 },
  defaultTierName:  { fontSize: 13, fontFamily: 'PoppinsBold', color: '#1E293B', width: 70 },
  defaultTierMeta:  { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#94A3B8', flex: 1 },
  defaultTierDisc:  { fontSize: 12, fontFamily: 'PoppinsBold' },

  // Redeem restriction
  restrictRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  restrictLabel:        { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#475569' },
  restrictInput:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, height: 40, minWidth: 130 },
  cooldownBtn:          { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', alignItems: 'center', gap: 2 },
  cooldownBtnActive:    { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  cooldownBtnLabel:     { fontSize: 12, fontFamily: 'PoppinsBold', color: '#64748B' },
  cooldownBtnLabelActive:{ color: '#FFF' },
  cooldownBtnDesc:      { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  cooldownBtnDescActive:{ color: 'rgba(255,255,255,0.7)' },
  cooldownNote:         { backgroundColor: '#EFF6FF', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#BFDBFE' },
  cooldownNoteText:     { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#1D4ED8' },
  // Switch
  switchSection: { gap: 12 },
  switchRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },

  // Upload
  uploadBtn:        { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 6, backgroundColor: '#F0F7FF', borderWidth: 1, borderColor: COLORS.primary, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9, minWidth: 200 },
  uploadBtnText:    { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: COLORS.primary },
  removLogoBtn:     { flexDirection: 'row' as const, gap: 5, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 9, paddingHorizontal: 14, paddingVertical: 7, alignItems: 'center' as const },
  removeLogoBtnText:{ fontSize: 12, fontFamily: 'PoppinsMedium', color: '#EF4444' },

  // Footer
  footer:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12, padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  savedBadge:{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  savedText: { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#10B981' },
  saveBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  saveBtnText:{ fontSize: 14, fontFamily: 'PoppinsBold', color: '#FFF' },
  // MinuteStepper
  stepBtn:       { width: 32, height: 32, borderRadius: 9, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  stepBtnText:   { fontSize: 18, fontFamily: 'PoppinsBold', color: '#475569', lineHeight: 22 },
  stepValueBox:  { alignItems: 'center', minWidth: 52 },
  stepValue:     { fontSize: 15, fontFamily: 'PoppinsBold', color: '#1E293B' },
  stepUnit:      { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: -2 },

  // Info box
  infoBox:   { backgroundColor: '#F0F9FF', borderRadius: 12, borderWidth: 1, borderColor: '#BAE6FD', padding: 14, marginTop: 4 },
  infoTitle: { fontSize: 12, fontFamily: 'PoppinsBold', color: '#0369A1', marginBottom: 6 },
  infoText:  { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#0284C7', lineHeight: 18 },
});

export default WebSettings;