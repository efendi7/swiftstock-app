/**
 * MemberActivityCard.tsx
 * Aktivitas member periode ini — bukan chart, tapi stats card
 * Menampilkan: % transaksi member, jumlah tx member vs non-member,
 * total belanja member, progress bar visual
 */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react-native';

const C_MEMBER     = '#00A79D'; // teal
const C_NONMEMBER  = '#E2E8F0'; // abu
const C_ACCENT     = '#3B82F6'; // biru

const fmtRp = (n: number) => {
  if (n >= 1_000_000_000) return `Rp ${(n/1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000)     return `Rp ${(n/1_000_000).toFixed(1)}jt`;
  if (n >= 1_000)         return `Rp ${(n/1_000).toFixed(0)}rb`;
  return `Rp ${n.toLocaleString('id-ID')}`;
};

export interface MemberStats {
  memberTx:    number;
  nonMemberTx: number;
  totalTx:     number;
  memberSpend: number;
  memberRate:  number; // 0-100
}

interface Props {
  stats?:     MemberStats;
  isLoading?: boolean;
}

export const MemberActivityCard: React.FC<Props> = ({ stats, isLoading = false }) => {
  const s          = stats ?? { memberTx: 0, nonMemberTx: 0, totalTx: 0, memberSpend: 0, memberRate: 0 };
  const hasData    = s.totalTx > 0;
  const rateColor  = s.memberRate >= 50 ? C_MEMBER : s.memberRate >= 25 ? C_ACCENT : '#F59E0B';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: C_MEMBER + '15' }]}>
          <Users size={15} color={C_MEMBER} />
        </View>
        <View>
          <Text style={styles.title}>Aktivitas Member</Text>
          <Text style={styles.subtitle}>Partisipasi member periode ini</Text>
        </View>
      </View>

      {!hasData ? (
        <View style={styles.empty}>
          <Users size={28} color="#E2E8F0" strokeWidth={1.5} />
          <Text style={styles.emptyText}>Belum ada transaksi</Text>
        </View>
      ) : (
        <View style={styles.body}>

          {/* Rate besar di tengah */}
          <View style={styles.rateBox}>
            <Text style={[styles.ratePct, { color: rateColor }]}>{s.memberRate}%</Text>
            <Text style={styles.rateLabel}>transaksi dari member</Text>
            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${s.memberRate}%` as any, backgroundColor: rateColor }]} />
            </View>
          </View>

          {/* Stats 2 baris */}
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { borderColor: C_MEMBER + '30', backgroundColor: C_MEMBER + '08' }]}>
              <View style={styles.statHeader}>
                <UserCheck size={12} color={C_MEMBER} />
                <Text style={[styles.statLabel, { color: C_MEMBER }]}>Member</Text>
              </View>
              <Text style={[styles.statValue, { color: C_MEMBER }]}>{s.memberTx.toLocaleString('id-ID')}</Text>
              <Text style={styles.statSub}>transaksi</Text>
            </View>

            <View style={[styles.statItem, { borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }]}>
              <View style={styles.statHeader}>
                <UserX size={12} color="#94A3B8" />
                <Text style={[styles.statLabel, { color: '#94A3B8' }]}>Non-member</Text>
              </View>
              <Text style={[styles.statValue, { color: '#64748B' }]}>{s.nonMemberTx.toLocaleString('id-ID')}</Text>
              <Text style={styles.statSub}>transaksi</Text>
            </View>
          </View>

          {/* Total belanja member */}
          <View style={styles.spendRow}>
            <TrendingUp size={12} color={C_ACCENT} />
            <Text style={styles.spendLabel}>Total belanja member</Text>
            <Text style={[styles.spendVal, { color: C_ACCENT }]}>{fmtRp(s.memberSpend)}</Text>
          </View>

        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:     { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 },
  iconBox:       { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title:         { fontSize: 13, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  subtitle:      { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 1 },
  empty:         { height: 160, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText:     { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#94A3B8' },

  body:          { gap: 14 },

  rateBox:       { alignItems: 'center', paddingVertical: 4 },
  ratePct:       { fontSize: 36, fontFamily: 'PoppinsBold', lineHeight: 42 },
  rateLabel:     { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#64748B', marginBottom: 8 },
  progressTrack: { width: '100%', height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: 6, borderRadius: 3 },

  statsGrid:     { flexDirection: 'row', gap: 10 },
  statItem:      { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, gap: 2 },
  statHeader:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  statLabel:     { fontSize: 10, fontFamily: 'PoppinsMedium' },
  statValue:     { fontSize: 20, fontFamily: 'PoppinsBold', lineHeight: 24 },
  statSub:       { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8' },

  spendRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  spendLabel:    { flex: 1, fontSize: 11, fontFamily: 'PoppinsMedium', color: '#64748B' },
  spendVal:      { fontSize: 12, fontFamily: 'PoppinsBold' },
});

export default MemberActivityCard;