/**
 * WebPaymentMemberCard.tsx
 * Tab toggle: [Pembayaran — Pie Chart] | [Member — Stats]
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CreditCard, Users, UserCheck, UserX } from 'lucide-react-native';
import { COLORS } from '@constants/colors';

const C_MEMBER = '#00A79D';
const C_ACCENT = '#3B82F6';

const METHOD_COLORS: Record<string, string> = {
  Tunai:    '#00A79D',
  QRIS:     '#3B82F6',
  Transfer: '#F59E0B',
  Debit:    '#8B5CF6',
  Kredit:   '#EC4899',
};
const DEFAULT_COLOR = '#94A3B8';

const fmtRp = (n: number) => {
  if (n >= 1_000_000_000) return `Rp ${(n/1e9).toFixed(1)}M`;
  if (n >= 1_000_000)     return `Rp ${(n/1e6).toFixed(1)}jt`;
  if (n >= 1_000)         return `Rp ${(n/1e3).toFixed(0)}rb`;
  return `Rp ${n.toLocaleString('id-ID')}`;
};

interface PaymentPoint { method: string; total: number }
interface MemberStats {
  memberTx: number; nonMemberTx: number;
  totalTx: number; memberSpend: number; memberRate: number;
}
interface Props {
  paymentData?: PaymentPoint[];
  memberStats?: MemberStats;
  isLoading?:   boolean;
}
type Tab = 'payment' | 'member';

// ── Custom Tooltip Pie ─────────────────────────────────────
const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <View style={tt.box}>
      <View style={[tt.dot, { backgroundColor: d.payload.color }]} />
      <Text style={tt.name}>{d.payload.method}</Text>
      <Text style={[tt.val, { color: d.payload.color }]}>{fmtRp(d.value)}</Text>
    </View>
  );
};
const tt = StyleSheet.create({
  box:  { backgroundColor: '#fff', borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  dot:  { width: 8, height: 8, borderRadius: 4 },
  name: { fontSize: 11, fontFamily: 'PoppinsMedium', color: '#334155' },
  val:  { fontSize: 11, fontFamily: 'PoppinsBold', marginLeft: 4 },
});

// ── Payment Panel — Pie + Legend ───────────────────────────
const PaymentPanel: React.FC<{ data?: PaymentPoint[] }> = ({ data = [] }) => {
  const [activeIdx, setActiveIdx] = useState<number | undefined>();
  const total = data.reduce((s, d) => s + d.total, 0);

  if (data.length === 0) return (
    <View style={pp.empty}>
      <CreditCard size={22} color="#E2E8F0" strokeWidth={1.5} />
      <Text style={pp.emptyTxt}>Belum ada data pembayaran</Text>
    </View>
  );

  const chartData = data.map(d => ({
    ...d,
    color: METHOD_COLORS[d.method] ?? DEFAULT_COLOR,
    pct: total > 0 ? Math.round((d.total / total) * 100) : 0,
  }));

  return (
    <View style={pp.body}>
      {/* Pie Chart */}
      <View style={pp.donutWrap}>
        <ResponsiveContainer width="99%" height={130}>
          <PieChart style={{ outline: 'none' } as any}>
            <Pie
              data={chartData} cx="50%" cy="50%"
              innerRadius={38} outerRadius={58}
              dataKey="total" isAnimationActive={false} stroke="none"
              // @ts-ignore — onMouseEnter/Leave valid di Recharts web runtime
              onMouseEnter={(_: any, index: number) => setActiveIdx(index)}
              onMouseLeave={() => setActiveIdx(undefined)}
            >
              {chartData.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.color}
                  opacity={activeIdx === undefined || activeIdx === i ? 1 : 0.45}
                />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Label tengah donut */}
        <View style={pp.center} pointerEvents="none">
          <Text style={pp.centerVal}>{chartData.length}</Text>
          <Text style={pp.centerSub}>metode</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={pp.legend}>
        {chartData.map((d, i) => (
          <View key={i} style={pp.legendRow}>
            <View style={[pp.ldot, { backgroundColor: d.color }]} />
            <Text style={pp.lname} numberOfLines={1}>{d.method}</Text>
            <Text style={[pp.lpct, { color: d.color }]}>{d.pct}%</Text>
          </View>
        ))}
        <View style={[pp.legendRow, pp.totalRow]}>
          <Text style={pp.totalLbl}>Total</Text>
          <Text style={pp.totalVal}>{fmtRp(total)}</Text>
        </View>
      </View>
    </View>
  );
};
const pp = StyleSheet.create({
  body:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  donutWrap:  { width: 130, height: 130, position: 'relative' },
  center:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  centerVal:  { fontSize: 18, fontFamily: 'PoppinsBold', color: '#1E293B' },
  centerSub:  { fontSize: 9, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  legend:     { flex: 1, gap: 6 },
  legendRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ldot:       { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  lname:      { flex: 1, fontSize: 11, fontFamily: 'PoppinsMedium', color: '#475569' },
  lpct:       { fontSize: 12, fontFamily: 'PoppinsBold' },
  totalRow:   { marginTop: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9', justifyContent: 'space-between' },
  totalLbl:   { flex: 1, fontSize: 11, fontFamily: 'PoppinsBold', color: '#1E293B' },
  totalVal:   { fontSize: 11, fontFamily: 'PoppinsBold', color: C_MEMBER },
  empty:      { paddingVertical: 24, alignItems: 'center', gap: 8 },
  emptyTxt:   { fontSize: 11, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
});

// ── Member Panel ───────────────────────────────────────────
const MemberPanel: React.FC<{ stats?: MemberStats }> = ({ stats }) => {
  const s = stats ?? { memberTx: 0, nonMemberTx: 0, totalTx: 0, memberSpend: 0, memberRate: 0 };
  if (s.totalTx === 0) return (
    <View style={mp.empty}>
      <Users size={22} color="#E2E8F0" strokeWidth={1.5} />
      <Text style={mp.emptyTxt}>Belum ada transaksi</Text>
    </View>
  );
  const rc = s.memberRate >= 50 ? C_MEMBER : s.memberRate >= 25 ? C_ACCENT : '#F59E0B';
  return (
    <View style={mp.body}>
      <View style={mp.rateRow}>
        <Text style={[mp.ratePct, { color: rc }]}>{s.memberRate}%</Text>
        <View style={{ flex: 1 }}>
          <Text style={mp.rateLbl}>transaksi dari member</Text>
          <View style={mp.track}><View style={[mp.fill, { width: `${s.memberRate}%` as any, backgroundColor: rc }]} /></View>
        </View>
      </View>
      <View style={mp.cols}>
        <View style={[mp.col, { borderColor: C_MEMBER + '30', backgroundColor: C_MEMBER + '08' }]}>
          <UserCheck size={11} color={C_MEMBER} />
          <Text style={[mp.colVal, { color: C_MEMBER }]}>{s.memberTx}</Text>
          <Text style={mp.colSub}>member</Text>
        </View>
        <View style={[mp.col, { borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }]}>
          <UserX size={11} color="#94A3B8" />
          <Text style={[mp.colVal, { color: '#64748B' }]}>{s.nonMemberTx}</Text>
          <Text style={mp.colSub}>non-member</Text>
        </View>
      </View>
      <View style={mp.spend}>
        <Text style={mp.spendLbl}>Total belanja member</Text>
        <Text style={[mp.spendVal, { color: C_ACCENT }]}>{fmtRp(s.memberSpend)}</Text>
      </View>
    </View>
  );
};
const mp = StyleSheet.create({
  body:    { gap: 12 },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ratePct: { fontSize: 28, fontFamily: 'PoppinsBold', lineHeight: 32 },
  rateLbl: { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#64748B', marginBottom: 4 },
  track:   { height: 5, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  fill:    { height: 5, borderRadius: 3 },
  cols:    { flexDirection: 'row', gap: 8 },
  col:     { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center', gap: 3 },
  colVal:  { fontSize: 18, fontFamily: 'PoppinsBold', lineHeight: 22 },
  colSub:  { fontSize: 9, fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  spend:   { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  spendLbl:{ fontSize: 11, fontFamily: 'PoppinsMedium', color: '#64748B' },
  spendVal:{ fontSize: 12, fontFamily: 'PoppinsBold' },
  empty:   { paddingVertical: 24, alignItems: 'center', gap: 8 },
  emptyTxt:{ fontSize: 11, fontFamily: 'PoppinsMedium', color: '#94A3B8' },
});

// ── Main ──────────────────────────────────────────────────
const _WebPaymentMemberCard: React.FC<Props> = ({ paymentData, memberStats, isLoading }) => {
  const [tab, setTab] = useState<Tab>('payment');
  return (
    <View style={s.container}>
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'payment' && s.tabActive]}   onPress={() => setTab('payment')}>
          <CreditCard size={12} color={tab === 'payment' ? C_ACCENT   : COLORS.textLight} />
          <Text style={[s.tabTxt, tab === 'payment' && { color: C_ACCENT }]}>Pembayaran</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'member'  && s.tabActiveMem]} onPress={() => setTab('member')}>
          <Users size={12} color={tab === 'member' ? C_MEMBER : COLORS.textLight} />
          <Text style={[s.tabTxt, tab === 'member'  && { color: C_MEMBER }]}>Member</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={pp.empty}><Text style={pp.emptyTxt}>Memuat...</Text></View>
      ) : tab === 'payment' ? (
        <PaymentPanel data={paymentData} />
      ) : (
        <MemberPanel stats={memberStats} />
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container:    { flex: 1 },
  tabs:         { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 3, gap: 2, marginBottom: 14 },
  tab:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 6, borderRadius: 8 },
  tabActive:    { backgroundColor: C_ACCENT + '18' },
  tabActiveMem: { backgroundColor: C_MEMBER + '15' },
  tabTxt:       { fontSize: 11, fontFamily: 'PoppinsMedium', color: COLORS.textLight },
});

export const WebPaymentMemberCard = React.memo(_WebPaymentMemberCard);
export default WebPaymentMemberCard;