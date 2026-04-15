/**
 * MemberSearchSelect.tsx
 * Dropdown search member ala Select2 — ketik HP/nama → muncul hasil.
 * Juga support scan QR/barcode.
 *
 * Props:
 *   onSelect(member)  — dipanggil saat member dipilih dari dropdown
 *   onScan()          — buka QR scanner
 *   loading           — sedang loading (dari parent)
 *   error             — pesan error dari parent
 *   disabled          — nonaktifkan input (misal: member sudah dipilih)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Animated,
} from 'react-native';
import { Search, QrCode, X, Crown, Phone, User } from 'lucide-react-native';
import { COLORS }        from '@constants/colors';
import { MemberService } from '@services/memberService';
import { Member }        from '@/types/member.types';
import { useAuth }       from '@hooks/auth/useAuth';

interface Props {
  onSelect:  (member: Member) => void;
  onScan:    () => void;
  loading?:  boolean;
  error?:    string;
  disabled?: boolean;
}

const DEBOUNCE_MS = 350;

export const MemberSearchSelect: React.FC<Props> = ({ onSelect, onScan, loading, error, disabled }) => {
  const { tenantId }         = useAuth();
  const [query, setQuery]    = useState('');
  const [results, setResults]= useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen]      = useState(false);
  const [noResult, setNoResult] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropAnim   = useRef(new Animated.Value(0)).current;

  // ── Debounced search ──────────────────────────────────────

  const runSearch = useCallback(async (q: string) => {
    if (!tenantId || q.trim().length < 2) {
      setResults([]); setOpen(false); setNoResult(false); return;
    }
    setSearching(true); setNoResult(false);
    try {
      const found = await MemberService.searchForDropdown(tenantId, q.trim());
      setResults(found);
      setNoResult(found.length === 0);
      setOpen(true);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }, [tenantId]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setOpen(false); setNoResult(false); return; }
    debounceRef.current = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, runSearch]);

  // ── Dropdown animation ────────────────────────────────────

  useEffect(() => {
    Animated.spring(dropAnim, {
      toValue: open ? 1 : 0,
      useNativeDriver: false,
      tension: 120, friction: 10,
    }).start();
  }, [open]);

  // Max 5 baris terlihat (~64px/item), sisanya scroll dalam dropdown
  const ITEM_H  = 64;
  const MAX_VIS = 5;
  const dropHeight = dropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, noResult ? 64 : Math.min(results.length * ITEM_H + 8, MAX_VIS * ITEM_H)],
  });
  const dropOpacity = dropAnim;

  // ── Handlers ──────────────────────────────────────────────

  const handleSelect = (member: Member) => {
    setQuery(''); setResults([]); setOpen(false); setNoResult(false);
    onSelect(member);
  };

  const handleClear = () => {
    setQuery(''); setResults([]); setOpen(false); setNoResult(false);
  };

  // ── Render item ───────────────────────────────────────────

  const renderItem = ({ item }: { item: Member }) => (
    <TouchableOpacity style={s.item} onPress={() => handleSelect(item)} activeOpacity={0.7}>
      <View style={[s.itemAvatar, { backgroundColor: getTierColor(item.tier) + '22' }]}>
        <User size={14} color={getTierColor(item.tier)} />
      </View>
      <View style={s.itemBody}>
        <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
        <View style={s.itemMeta}>
          <Phone size={10} color="#94A3B8" />
          <Text style={s.itemPhone}>{item.phone}</Text>
          <View style={[s.itemTierBadge, { backgroundColor: getTierColor(item.tier) + '18' }]}>
            <Text style={[s.itemTierText, { color: getTierColor(item.tier) }]}>{item.tier}</Text>
          </View>
        </View>
      </View>
      <Text style={s.itemPoin}>{item.poin} poin</Text>
    </TouchableOpacity>
  );

  // ── Render ────────────────────────────────────────────────

  return (
    <View style={s.root}>

      {/* Input row */}
      <View style={[s.inputRow, disabled && s.inputRowDisabled]}>
        {/* Search icon / spinner */}
        <View style={s.inputIcon}>
          {searching || loading
            ? <ActivityIndicator size="small" color={COLORS.secondary} />
            : <Search size={15} color="#94A3B8" />
          }
        </View>

        <TextInput
          style={s.input}
          placeholder="Cari HP / nama..."
          placeholderTextColor="#CBD5E1"
          value={query}
          onChangeText={setQuery}
          keyboardType="default"
          editable={!disabled}
          autoCorrect={false}
          autoCapitalize="none"
          numberOfLines={1}
        />

        {/* Clear */}
        {!!query && (
          <TouchableOpacity style={s.iconBtn} onPress={handleClear}>
            <X size={14} color="#94A3B8" />
          </TouchableOpacity>
        )}

        {/* QR scan button */}
        <TouchableOpacity
          style={[s.qrBtn, disabled && { opacity: 0.4 }]}
          onPress={onScan}
          disabled={disabled}
        >
          <QrCode size={16} color="#FFF" />
          <Text style={s.qrBtnText}>QR</Text>
        </TouchableOpacity>
      </View>

      {/* Error */}
      {!!error && (
        <View style={s.errorRow}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}

      {/* Dropdown */}
      {(open || noResult) && (
        <Animated.View style={[s.dropdown, { maxHeight: dropHeight, opacity: dropOpacity }]}>
          {noResult ? (
            <View style={s.noResult}>
              <Crown size={16} color="#CBD5E1" />
              <Text style={s.noResultText}>Member tidak ditemukan</Text>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {results.map((item, idx) => (
                <View key={item.id}>
                  {renderItem({ item })}
                  {idx < results.length - 1 && <View style={s.separator} />}
                </View>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      )}
    </View>
  );
};

// ── Tier color helper (lokal, ringan) ─────────────────────

const getTierColor = (tier: string) => {
  const t = (tier || '').toLowerCase();
  if (t === 'platinum') return '#8B5CF6';
  if (t === 'gold')     return '#F59E0B';
  if (t === 'silver')   return '#64748B';
  return '#94A3B8'; // reguler
};

// ── Styles ────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { position: 'relative' as any, zIndex: 999 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingRight: 6, overflow: 'visible' as any,
  },
  inputRowDisabled: { opacity: 0.5 },
  inputIcon:  { paddingHorizontal: 12, paddingVertical: 12 },
  input: {
    flex: 1, height: 46, fontSize: 14,
    fontFamily: 'PoppinsRegular', color: '#1E293B',
    outlineStyle: 'none' as any,
  },
  iconBtn: { padding: 8 },

  qrBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  qrBtnText: { fontSize: 12, fontFamily: 'PoppinsBold', color: '#FFF' },

  errorRow: {
    backgroundColor: '#FEF2F2', borderRadius: 8, padding: 9, marginTop: 6,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#EF4444' },

  // Dropdown
  dropdown: {
    position: 'absolute' as any, top: 52, left: 0, right: 0,
    backgroundColor: '#FFF',
    borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 12,
    elevation: 8, overflow: 'hidden' as any,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  itemAvatar: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  itemBody:     { flex: 1, gap: 3 },
  itemName:     { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  itemMeta:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  itemPhone:    { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#64748B' },
  itemTierBadge:{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  itemTierText: { fontSize: 10, fontFamily: 'PoppinsBold' },
  itemPoin:     { fontSize: 12, fontFamily: 'PoppinsBold', color: COLORS.secondary },
  separator:    { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 14 },

  noResult: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 16, justifyContent: 'center',
  },
  noResultText: { fontSize: 13, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
});