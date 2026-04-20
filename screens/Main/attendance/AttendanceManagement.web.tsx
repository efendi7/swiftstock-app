/**
 * AttendanceManagementWeb.tsx
 * Tabel kalender kehadiran semua kasir.
 * Layout selaras dengan ProductScreenWeb:
 *   - Hapus pageHeader (judul sudah di WebHeader)
 *   - StatsToolbar di rightCol (bukan summaryBar terpisah)
 *   - sidebar (AttendanceSidebarWeb) + rightCol (toolbar + tabel)
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Platform, Modal,
} from 'react-native';
import {
  ChevronDown, ChevronUp, CheckCircle2,
  AlertCircle, XCircle, CalendarDays,
} from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import { CashierService, Cashier } from '@services/cashierService';
import {
  AttendanceService, AttendanceStatus,
  DayAnalysis, analyzeDays, getAttendanceConfig,
} from '@services/attendanceService';
import { useAuth } from '@hooks/auth/useAuth';
import AttendanceSidebarWeb from './AttendanceSidebarWeb';
import StatsToolbar, { StatItem } from '@components/common/web/StatsToolbar';

const PRIMARY = COLORS.primary;

// ── Konstanta dimensi ─────────────────────────────────────
const CELL_W = 52;
const ROW_H  = 54;
const NAME_W = 160;

const STATUS_CFG: Record<AttendanceStatus, {
  label: string; color: string; bg: string; border: string; Icon: any;
}> = {
  hadir: { label: 'Hadir', color: '#10B981', bg: '#ECFDF5', border: '#6EE7B7', Icon: CheckCircle2 },
  izin:  { label: 'Izin',  color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', Icon: AlertCircle  },
  alpha: { label: 'Alpha', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', Icon: XCircle      },
};

const getMonths = (startDate?: Date) => {
  const months: { label: string; value: string }[] = [];
  const s = startDate ? new Date(startDate) : new Date();
  s.setDate(1);
  const now = new Date(); now.setDate(1);
  while (s <= now) {
    months.unshift({
      value: s.toISOString().slice(0, 7),
      label: s.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    });
    s.setMonth(s.getMonth() + 1);
  }
  return months;
};

const fmtTime = (ts: any) =>
  ts?.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) ?? '';

const fmtMins = (mins: number) =>
  mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}j${mins % 60 > 0 ? ` ${mins % 60}m` : ''}`;

// ── Tooltip ───────────────────────────────────────────────
const CellTooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View
      style={{ position: 'relative' as any }}
      // @ts-ignore
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && text ? (
        <View style={tt.box}>
          <Text style={tt.text}>{text}</Text>
        </View>
      ) : null}
    </View>
  );
};
const tt = StyleSheet.create({
  box:  { position: 'absolute' as any, bottom: '110%' as any, left: '50%' as any, transform: [{ translateX: -60 }], backgroundColor: '#1E293B', borderRadius: 8, padding: 8, minWidth: 120, zIndex: 9999, ...(Platform.OS === 'web' ? { boxShadow: '0 4px 12px rgba(0,0,0,0.2)' } as any : {}) },
  text: { fontSize: 11, fontFamily: 'PoppinsRegular', color: '#FFF', lineHeight: 16 },
});

// ── Month Dropdown ────────────────────────────────────────
const MonthDropdownModal = ({
  options, selected, onSelect,
}: {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<View>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const openDropdown = () => {
    btnRef.current?.measure((_fx, _fy, w, _h, px, py) => {
      setPos({ top: py + _h + 4, left: px, width: Math.max(w, 210) });
    });
    setOpen(true);
  };

  const label = options.find(o => o.value === selected)?.label ?? selected;

  return (
    <>
      <TouchableOpacity ref={btnRef as any} style={s.monthBtn} onPress={openDropdown}>
        <CalendarDays size={14} color={PRIMARY} />
        <Text style={s.monthBtnText}>{label}</Text>
        {open ? <ChevronUp size={14} color={PRIMARY} /> : <ChevronDown size={14} color={PRIMARY} />}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject as any} onPress={() => setOpen(false)} activeOpacity={1} />
        <View style={[s.monthList, { top: pos.top, left: pos.left, width: pos.width }]}>
          <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
            {options.map(o => (
              <TouchableOpacity
                key={o.value}
                style={[s.monthOpt, o.value === selected && s.monthOptActive]}
                onPress={() => { onSelect(o.value); setOpen(false); }}
              >
                <Text style={[s.monthOptText, o.value === selected && { color: PRIMARY, fontFamily: 'PoppinsBold' }]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

// ── Main ──────────────────────────────────────────────────
const AttendanceManagementWeb: React.FC = () => {
  const { tenantId } = useAuth();

  const [cashiers,         setCashiers]         = useState<Cashier[]>([]);
  const [filteredCashiers, setFilteredCashiers] = useState<Cashier[]>([]);
  const [selectedMonth,    setSelectedMonth]    = useState(new Date().toISOString().slice(0, 7));
  const [monthOptions,     setMonthOptions]     = useState<{ label: string; value: string }[]>([]);
  const [dayMap,           setDayMap]           = useState<Record<string, DayAnalysis[]>>({});
  const [loading,          setLoading]          = useState(false);
  const [loadingCashiers,  setLoadingCashiers]  = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    CashierService.getCashiersByTenant(tenantId).then(list => {
      setCashiers(list);
      setFilteredCashiers(list);
      setLoadingCashiers(false);
      const earliest = list.reduce((min, c) => {
        const d = (c as any).createdAt?.toDate?.() ?? new Date();
        return d < min ? d : min;
      }, new Date());
      setMonthOptions(getMonths(earliest));
    });
  }, [tenantId]);

  const loadAll = useCallback(async () => {
    if (!tenantId || cashiers.length === 0) return;
    setLoading(true);
    try {
      const attConfig = await getAttendanceConfig(tenantId);
      const results = await Promise.all(
        cashiers.map(async c => {
          const history  = await AttendanceService.getHistory(tenantId, c.id, 365);
          const filtered = history.filter(r => r.date.startsWith(selectedMonth));
          const days     = analyzeDays(selectedMonth, c.shift ?? null, filtered, attConfig.lateToleranceMinutes, attConfig.earlyLeaveToleranceMinutes);
          return { id: c.id, days };
        })
      );
      const map: Record<string, DayAnalysis[]> = {};
      results.forEach(r => { map[r.id] = r.days; });
      setDayMap(map);
    } finally {
      setLoading(false);
    }
  }, [tenantId, cashiers, selectedMonth]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Summary stats
  const summary = cashiers.reduce(
    (acc, c) => {
      (dayMap[c.id] ?? []).forEach(d => {
        if (!d.record || d.isFuture) return;
        acc[d.record.status]++;
        acc.total++;
        acc.shortMins += d.shortMinutes;
      });
      return acc;
    },
    { hadir: 0, izin: 0, alpha: 0, total: 0, shortMins: 0 },
  );

  const stats: StatItem[] = [
    { icon: <CheckCircle2 size={14} color="#10B981" />, value: summary.hadir,     label: 'Hadir',      bg: '#ECFDF5', color: '#10B981' },
    { icon: <AlertCircle  size={14} color="#F59E0B" />, value: summary.izin,      label: 'Izin',       bg: '#FFFBEB', color: '#F59E0B' },
    { icon: <XCircle      size={14} color="#EF4444" />, value: summary.alpha,     label: 'Alpha',      bg: '#FEF2F2', color: '#EF4444' },
    { icon: <AlertCircle  size={14} color="#EA580C" />, value: fmtMins(summary.shortMins) as any, label: 'Kurang Jam', bg: '#FFF8F0', color: '#EA580C' },
    { icon: <CalendarDays size={14} color="#64748B" />, value: summary.total,     label: 'Tercatat',   bg: '#F8FAFC', color: '#64748B' },
  ];

  const days = dayMap[cashiers[0]?.id]?.map(d => d) ?? [];

  return (
    <View style={s.root}>
      <View style={s.body}>

        {/* SIDEBAR — selaras dengan ProductScreenWeb */}
        <View style={s.sidebar}>
          <AttendanceSidebarWeb
            cashiers={cashiers}
            dayMap={dayMap}
            onFilter={setFilteredCashiers}
          />
        </View>

        {/* KOLOM KANAN */}
        <View style={s.rightCol}>

          {/* STATS TOOLBAR — dengan month picker di slot right */}
          <StatsToolbar
            stats={stats}
            right={
              <MonthDropdownModal
                options={monthOptions}
                selected={selectedMonth}
                onSelect={setSelectedMonth}
              />
            }
          />

          {/* TABEL — scroll horizontal + vertikal */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            style={s.tableScroll}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              stickyHeaderIndices={[0]}
            >
              <View>
                {/* Header hari */}
                <View style={s.tableHead}>
                  <View style={s.nameHead}>
                    <Text style={s.nameHeadTxt}>KASIR</Text>
                  </View>
                  {days.map(d => {
                    const date    = new Date(d.dateKey);
                    const isShift = d.isShiftDay;
                    return (
                      <View key={d.dateKey} style={[
                        s.dayHead,
                        d.isToday && s.dayHeadToday,
                        !isShift  && s.dayHeadOff,
                      ]}>
                        <Text style={[s.dayHN, !isShift && s.txtOff, d.isToday && s.txtToday]}>
                          {date.toLocaleDateString('id-ID', { weekday: 'narrow' })}
                        </Text>
                        <Text style={[s.dayHD, !isShift && s.txtOff, d.isToday && s.txtToday]}>
                          {date.getDate()}
                        </Text>
                        {isShift && d.shiftStart && (
                          <Text style={s.dayShiftTime}>{d.shiftStart?.slice(0, 5)}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Baris per kasir */}
                {loading ? (
                  <ActivityIndicator size="large" color={COLORS.secondary} style={{ margin: 40 }} />
                ) : (
                  filteredCashiers.map((c, ci) => {
                    const cdays = dayMap[c.id] ?? [];
                    return (
                      <View key={c.id} style={[
                        s.tableRow,
                        ci % 2 !== 0 && s.tableRowAlt,
                      ]}>
                        <View style={s.nameCell}>
                          <View style={s.nameAvatar}>
                            <Text style={s.nameAvatarTxt}>
                              {c.displayName.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={s.nameTxt} numberOfLines={1}>{c.displayName}</Text>
                            {c.shift && (
                              <Text style={s.nameShift} numberOfLines={1}>
                                {c.shift.startTime}–{c.shift.endTime}
                              </Text>
                            )}
                          </View>
                        </View>
                        {cdays.map(d => <DayCell key={d.dateKey} day={d} />)}
                      </View>
                    );
                  })
                )}

                {/* Legend */}
                <View style={s.legend}>
                  <LegendItem icon={<CheckCircle2 size={11} color="#10B981" />} label="Hadir" />
                  <LegendItem icon={<AlertCircle  size={11} color="#F59E0B" />} label="Izin" />
                  <LegendItem icon={<XCircle      size={11} color="#EF4444" />} label="Alpha" />
                  <LegendItem color="#FECACA" dot label="Tidak tercatat (hari shift)" />
                  <LegendItem color="#94A3B8" dot label="Hari libur / non-shift" />
                  <LegendItem color="#EA580C" dot label="Kurang jam (·)" />
                </View>
              </View>
            </ScrollView>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

// ── DayCell ───────────────────────────────────────────────
const DayCell = ({ day: d }: { day: DayAnalysis }) => {
  if (!d.isShiftDay) {
    return (
      <View style={[cell.wrap, cell.offDay]}>
        <View style={cell.offLine} />
      </View>
    );
  }
  if (d.isFuture) {
    return <View style={[cell.wrap, d.isToday && cell.todayBorder]} />;
  }
  if (!d.record) {
    return (
      <CellTooltip text="Belum ada catatan">
        <View style={[cell.wrap, cell.noRecord, d.isToday && cell.todayBorder]}>
          <View style={cell.alphaDot} />
        </View>
      </CellTooltip>
    );
  }

  const r   = d.record;
  const cfg = STATUS_CFG[r.status];
  const ci  = fmtTime(r.checkIn);

  const tooltipLines: string[] = [];
  if (ci)                 tooltipLines.push(`Masuk: ${ci}`);
  if (fmtTime(r.checkOut)) tooltipLines.push(`Keluar: ${fmtTime(r.checkOut)}`);
  if (r.note)             tooltipLines.push(`Alasan: ${r.note}`);
  if (d.shortMinutes > 0) tooltipLines.push(`⚠ Kurang: ${fmtMins(d.shortMinutes)}`);
  if (r.earlyLeave)       tooltipLines.push('Pulang awal');

  return (
    <CellTooltip text={tooltipLines.join('\n')}>
      <View style={[
        cell.wrap,
        { backgroundColor: cfg.bg, borderColor: cfg.border },
        d.isToday && cell.todayBorder,
      ]}>
        <cfg.Icon size={12} color={cfg.color} />
        {ci && <Text style={[cell.time, { color: cfg.color }]}>{ci}</Text>}
        {d.shortMinutes > 0 && <View style={cell.shortDot} />}
        {r.earlyLeave && !d.shortMinutes && <View style={cell.earlyDot} />}
      </View>
    </CellTooltip>
  );
};

const cell = StyleSheet.create({
  wrap:        { width: CELL_W, height: ROW_H, alignItems: 'center', justifyContent: 'center', gap: 2, borderWidth: 1, borderColor: '#F1F5F9', position: 'relative' as any },
  offDay:      { backgroundColor: '#F1F5F9' },
  offLine:     { width: 16, height: 1.5, backgroundColor: '#CBD5E1', borderRadius: 1 },
  noRecord:    { backgroundColor: '#FFF' },
  todayBorder: { borderLeftWidth: 2, borderLeftColor: PRIMARY },
  alphaDot:    { width: 6,  height: 6,  borderRadius: 3, backgroundColor: '#FECACA' },
  shortDot:    { position: 'absolute' as any, top: 4, right: 4, width: 6, height: 6, borderRadius: 3, backgroundColor: '#EA580C' },
  earlyDot:    { position: 'absolute' as any, top: 4, right: 4, width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B' },
  time:        { fontSize: 9, fontFamily: 'PoppinsMedium' },
});

const LegendItem = ({ icon, label, dot, color }: { icon?: React.ReactNode; label: string; dot?: boolean; color?: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
    {dot ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} /> : icon}
    <Text style={{ fontSize: 11, fontFamily: 'PoppinsRegular', color: '#64748B' }}>{label}</Text>
  </View>
);

// ── Styles ────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, overflow: 'hidden' as any },
  body:    { flex: 1, flexDirection: 'row', overflow: 'hidden' as any },

  // Selaras dengan ProductScreenWeb
  sidebar:  { width: 268, backgroundColor: '#FFF', borderRightWidth: 1, borderRightColor: '#E2E8F0' },
  rightCol: { flex: 1, flexDirection: 'column', overflow: 'hidden' as any },

  // Month picker button
  monthBtn:      { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(28,58,90,0.07)', borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9, cursor: 'pointer' as any },
  monthBtnText:  { fontSize: 13, fontFamily: 'PoppinsBold', color: PRIMARY },
  monthList:     { position: 'absolute' as any, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 20, overflow: 'hidden', zIndex: 9999 },
  monthOpt:      { paddingHorizontal: 14, paddingVertical: 10, cursor: 'pointer' as any },
  monthOptActive:{ backgroundColor: PRIMARY + '0D' },
  monthOptText:  { fontSize: 13, fontFamily: 'PoppinsMedium', color: '#475569' },

  // Tabel
  tableScroll:  { flex: 1 },
  tableHead:    { flexDirection: 'row', backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  dayHead:      { width: CELL_W, height: ROW_H + 2, alignItems: 'center', justifyContent: 'center', gap: 1, borderRightWidth: 1, borderRightColor: '#E2E8F0' },
  dayHeadToday: { backgroundColor: PRIMARY + '12' },
  dayHeadOff:   { backgroundColor: '#F1F5F9' },
  dayHN:        { fontSize: 9,  fontFamily: 'PoppinsRegular', color: '#94A3B8' },
  dayHD:        { fontSize: 13, fontFamily: 'PoppinsBold',    color: '#475569' },
  dayShiftTime: { fontSize: 8,  fontFamily: 'PoppinsRegular', color: '#CBD5E1' },
  txtOff:       { color: '#CBD5E1' },
  txtToday:     { color: PRIMARY },
  tableRow:     { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tableRowAlt:  { backgroundColor: '#FAFBFC' },
  legend:       { flexDirection: 'row', gap: 18, flexWrap: 'wrap' as any, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FAFBFC' },

  // Kolom nama
  nameHead:       { width: NAME_W, height: ROW_H + 2, justifyContent: 'center', paddingHorizontal: 12, borderRightWidth: 1, borderRightColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  nameHeadTxt:    { fontSize: 10, fontFamily: 'PoppinsBold', color: '#94A3B8', letterSpacing: 1 },
  nameCell:       { width: NAME_W, height: ROW_H, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, borderRightWidth: 1, borderRightColor: '#F1F5F9' },
  nameAvatar:     { width: 28, height: 28, borderRadius: 8, backgroundColor: PRIMARY + '15', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  nameAvatarTxt:  { fontSize: 11, fontFamily: 'PoppinsBold', color: PRIMARY },
  nameTxt:        { fontSize: 12, fontFamily: 'PoppinsSemiBold', color: '#1E293B' },
  nameShift:      { fontSize: 10, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginTop: 1 },
});

export default AttendanceManagementWeb;