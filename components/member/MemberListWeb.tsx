import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Crown, Star, Award, Medal, Eye, Pencil, Trash2, Phone, ChevronLeft, ChevronRight, Clock, CheckCircle2 } from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import { Member, MemberTier } from '@/types/member.types';

interface Props {
  data:          Member[];
  tiers:         MemberTier[];
  refreshing:    boolean;
  onRefresh:     () => void;
  isAdmin:       boolean;
  onViewPress:   (m: Member) => void;
  onEditPress:   (m: Member) => void;
  onDeletePress: (m: Member) => void;
  usePagination: boolean;
  currentPage:   number;
  totalPages:    number;
  totalCount:    number;
  pageSize:      number;
  onPageChange:  (page: number) => void;
}

const TIER_ICONS: Record<string, React.ReactNode> = {
  'Reguler':  <Medal  size={13} color="#94A3B8" />,
  'Silver':   <Award  size={13} color="#64748B" />,
  'Gold':     <Star   size={13} color="#F59E0B" />,
  'Platinum': <Crown  size={13} color="#8B5CF6" />,
};

const MemberListWeb = ({
  data, tiers, isAdmin, onViewPress, onEditPress, onDeletePress,
  usePagination, currentPage, totalPages, totalCount, pageSize, onPageChange,
}: Props) => {

  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Crown size={48} color="#CBD5E1" strokeWidth={1.5} />
        <Text style={styles.emptyText}>Belum ada member terdaftar</Text>
        <Text style={styles.emptyHint}>Tambah member untuk mulai mencatat loyalitas pelanggan</Text>
      </View>
    );
  }

  const getTierColor = (tierName: string) => {
    return tiers.find(t => t.name === tierName)?.color ?? '#94A3B8';
  };

  const displayStart = usePagination ? (currentPage - 1) * pageSize + 1 : 1;
  const displayEnd   = usePagination ? Math.min(currentPage * pageSize, totalCount) : data.length;

  return (
    <View>
      {/* HEADER */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, { flex: 2.5 }]}>Member</Text>
        <Text style={[styles.headerCell, { flex: 1.2 }]}>Tier</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Poin</Text>
        <Text style={[styles.headerCell, { flex: 1.5 }]}>Total Belanja</Text>
        <Text style={[styles.headerCell, { flex: 1 }]}>Kunjungan</Text>
        <Text style={[styles.headerCell, { flex: 1.2, textAlign: 'right' }]}>Aksi</Text>
      </View>

      {/* ROWS */}
      {data.map(member => {
        const tierColor = getTierColor(member.tier);
        const initials  = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        return (
          <View key={member.id} style={styles.row}>
            {/* Member info */}
            <View style={[styles.cell, { flex: 2.5, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
              <View style={[styles.avatar, { backgroundColor: tierColor + '20', borderColor: tierColor + '50' }]}>
                <Text style={[styles.avatarText, { color: tierColor }]}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
                  {member.isProspect ? (
                    <View style={styles.prospectBadge}>
                      <Clock size={10} color="#D97706" />
                      <Text style={styles.prospectBadgeText}>Calon Member</Text>
                    </View>
                  ) : (
                    <View style={styles.fullMemberBadge}>
                      <CheckCircle2 size={10} color="#059669" />
                      <Text style={styles.fullMemberBadgeText}>Member</Text>
                    </View>
                  )}
                <View style={styles.phoneRow}>
                  <Phone size={11} color="#94A3B8" />
                  <Text style={styles.memberPhone}>{member.phone}</Text>
                </View>
              </View>
            </View>

            {/* Tier badge */}
            <View style={[styles.cell, { flex: 1.2 }]}>
              <View style={[styles.tierBadge, { backgroundColor: tierColor + '18', borderColor: tierColor + '40' }]}>
                {TIER_ICONS[member.tier] ?? <Medal size={13} color={tierColor} />}
                <Text style={[styles.tierText, { color: tierColor }]}>{member.tier}</Text>
              </View>
            </View>

            {/* Poin */}
            <View style={[styles.cell, { flex: 1 }]}>
              <Text style={styles.poinText}>{member.poin.toLocaleString('id-ID')}</Text>
              {member.discountOverride !== null && member.discountOverride !== undefined && (
                <Text style={styles.overrideTag}>Override {member.discountOverride}%</Text>
              )}
            </View>

            {/* Total belanja */}
            <View style={[styles.cell, { flex: 1.5 }]}>
              <Text style={styles.spendText}>
                Rp {member.totalSpend >= 1_000_000
                  ? (member.totalSpend / 1_000_000).toFixed(1) + 'jt'
                  : (member.totalSpend / 1_000).toFixed(0) + 'rb'}
              </Text>
            </View>

            {/* Kunjungan */}
            <View style={[styles.cell, { flex: 1 }]}>
              <Text style={styles.visitText}>{member.totalVisits}x</Text>
            </View>

            {/* Aksi */}
            <View style={[styles.cell, { flex: 1.2, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }]}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => onViewPress(member)}>
                <Eye size={14} color={COLORS.primary} />
              </TouchableOpacity>
              {isAdmin && (
                <>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => onEditPress(member)}>
                    <Pencil size={14} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => onDeletePress(member)}>
                    <Trash2 size={14} color="#EF4444" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        );
      })}

      {/* PAGINATION */}
      {usePagination && totalPages > 1 && (
        <View style={styles.pagination}>
          <Text style={styles.paginationInfo}>
            {displayStart}–{displayEnd} dari {totalCount} member
          </Text>
          <View style={styles.pageButtons}>
            <TouchableOpacity
              style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
              onPress={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} color={currentPage === 1 ? '#CBD5E1' : COLORS.primary} />
            </TouchableOpacity>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = totalPages <= 5 ? i + 1
                : currentPage <= 3 ? i + 1
                : currentPage >= totalPages - 2 ? totalPages - 4 + i
                : currentPage - 2 + i;
              return (
                <TouchableOpacity
                  key={page}
                  style={[styles.pageBtn, currentPage === page && styles.pageBtnActive]}
                  onPress={() => onPageChange(page)}
                >
                  <Text style={[styles.pageBtnText, currentPage === page && styles.pageBtnTextActive]}>
                    {page}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
              onPress={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} color={currentPage === totalPages ? '#CBD5E1' : COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  empty:        { alignItems: 'center', paddingVertical: 80 },
  emptyText:    { marginTop: 16, fontSize: 16, fontFamily: 'PoppinsBold', color: '#94A3B8' },
  emptyHint:    { marginTop: 8, fontSize: 13, fontFamily: 'PoppinsRegular', color: '#CBD5E1', textAlign: 'center' },
  tableHeader:  { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F8FAFC', borderRadius: 10, marginBottom: 4 },
  headerCell:   { fontSize: 11, fontFamily: 'PoppinsBold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  row:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, marginBottom: 6, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  cell:         { justifyContent: 'center' },
  avatar:       { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 13, fontFamily: 'PoppinsBold' },
  prospectBadge:      { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFFBEB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#FDE68A', alignSelf: 'flex-start', marginTop: 1, marginBottom: 1 },
  prospectBadgeText:  { fontSize: 10, fontFamily: 'PoppinsBold', color: '#D97706' },
  fullMemberBadge:    { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F0FDF4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#BBF7D0', alignSelf: 'flex-start', marginTop: 1, marginBottom: 1 },
  fullMemberBadgeText:{ fontSize: 10, fontFamily: 'PoppinsBold', color: '#059669' },
  memberName:   { fontSize: 14, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  phoneRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  memberPhone:  { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  tierBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start' },
  tierText:     { fontSize: 11, fontFamily: 'PoppinsBold' },
  poinText:     { fontSize: 14, fontFamily: 'PoppinsBold', color: '#1E293B' },
  overrideTag:  { fontSize: 10, fontFamily: 'PoppinsMedium', color: '#8B5CF6', marginTop: 2 },
  spendText:    { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#475569' },
  visitText:    { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#475569' },
  actionBtn:    { width: 30, height: 30, borderRadius: 8, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  deleteBtn:    { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  pagination:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  paginationInfo: { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  pageButtons:  { flexDirection: 'row', gap: 4 },
  pageBtn:      { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  pageBtnActive:  { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  pageBtnDisabled:{ opacity: 0.4 },
  pageBtnText:    { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#475569' },
  pageBtnTextActive: { color: '#FFF' },
});

export default MemberListWeb;