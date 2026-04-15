import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Search, X, Users } from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import { Member, MemberTier } from '@/types/member.types';

interface Props {
  members:        Member[];
  tiers:          MemberTier[];
  searchQuery:    string;
  onSearchChange: (q: string) => void;
  tierFilter:     string;
  onTierChange:   (t: string) => void;
  onFiltered:     (list: Member[]) => void;
}

const MemberFilterWeb = ({
  members, tiers, searchQuery, onSearchChange,
  tierFilter, onTierChange, onFiltered,
}: Props) => {

  const applyFilter = useCallback(() => {
    let result = [...members];
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(lower) ||
        m.phone.includes(lower) ||
        (m.email || '').toLowerCase().includes(lower)
      );
    }
    if (tierFilter !== 'all') {
      result = result.filter(m => m.tier === tierFilter);
    }
    onFiltered(result);
  }, [members, searchQuery, tierFilter]);

  useEffect(() => { applyFilter(); }, [applyFilter]);

  const tierOptions = [{ name: 'all', color: COLORS.primary }, ...tiers];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* SEARCH */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cari Member</Text>
        <View style={styles.searchBox}>
          <Search size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Nama, No. HP, Email..."
            placeholderTextColor="#CBD5E1"
            value={searchQuery}
            onChangeText={onSearchChange}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => onSearchChange('')}>
              <X size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* FILTER TIER */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Filter Tier</Text>
        <View style={styles.filterGroup}>
          {tierOptions.map(t => {
            const active = tierFilter === t.name;
            return (
              <TouchableOpacity
                key={t.name}
                style={[styles.filterBtn, active && { backgroundColor: t.color, borderColor: t.color }]}
                onPress={() => onTierChange(t.name)}
              >
                <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>
                  {t.name === 'all' ? 'Semua Tier' : t.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* SUMMARY */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Distribusi Tier</Text>
        {tiers.map(tier => {
          const count = members.filter(m => m.tier === tier.name).length;
          const pct   = members.length > 0 ? Math.round(count / members.length * 100) : 0;
          return (
            <View key={tier.name} style={styles.tierRow}>
              <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
              <Text style={styles.tierName}>{tier.name}</Text>
              <View style={styles.tierBarWrap}>
                <View style={[styles.tierBar, { width: `${pct}%` as any, backgroundColor: tier.color + '50' }]} />
              </View>
              <Text style={[styles.tierCount, { color: tier.color }]}>{count}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, padding: 16 },
  section:         { marginBottom: 24 },
  sectionTitle:    { fontSize: 11, fontFamily: 'PoppinsBold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  searchBox:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchInput:     { flex: 1, fontSize: 13, fontFamily: 'PoppinsRegular', color: '#1E293B', outlineStyle: 'none' as any },
  filterGroup:     { gap: 6 },
  filterBtn:       { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  filterBtnText:   { fontSize: 13, fontFamily: 'PoppinsMedium', color: '#64748B' },
  filterBtnTextActive: { color: '#FFF' },
  tierRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tierDot:         { width: 8, height: 8, borderRadius: 4 },
  tierName:        { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#475569', width: 58 },
  tierBarWrap:     { flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  tierBar:         { height: 6, borderRadius: 3 },
  tierCount:       { fontSize: 12, fontFamily: 'PoppinsBold', width: 24, textAlign: 'right' },
});

export default MemberFilterWeb;