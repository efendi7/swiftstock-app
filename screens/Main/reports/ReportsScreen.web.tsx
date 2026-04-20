// screens/ReportsScreenWeb.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, StyleSheet, ScrollView, Text, TouchableOpacity,
} from 'react-native';
import { FileText, RotateCcw } from 'lucide-react-native';
import Svg, { Path, Mask, G } from 'react-native-svg';

import { COLORS } from '@constants/colors';
import { useAuth } from '@hooks/auth/useAuth';
import { ReportService } from '@services/reportService';
import { StockHistoryItem, PaginatedStockHistory } from '@/types/report.types';
import StatsToolbar, { StatItem } from '@components/common/web/StatsToolbar';
import SkeletonLoading from '@components/common/web/SkeletonLoading';
import FilterSectionWeb, { ReportFilterState } from '@components/report/FilterSectionWeb';

const PAGE_SIZE = 20;

const INITIAL_FILTER: ReportFilterState = {
  searchQuery: '',
  filterType: 'all',
  startDateStr: '',
  endDateStr: '',
};

const formatDate = (ts: any) => {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('id-ID', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// ── Custom SVG Icons ──────────────────────────────────────────────

const IconLog = ({ color = '#000', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Mask id="m" maskUnits="userSpaceOnUse" x="2" y="1" width="20" height="22">
      <Path d="M6.5 5H20.5V22H6.5V5Z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round" />
      <Path d="M17.5 5V2H4C3.867 2 3.74 2.053 3.646 2.146C3.553 2.24 3.5 2.367 3.5 2.5V19H6.5"
        stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10.5 11H16.5M10.5 15H16.5"
        stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Mask>
    <G mask="url(#m)">
      <Path d="M0 0H24V24H0V0Z" fill={color} />
    </G>
  </Svg>
);

const IconMasuk = ({ color = '#000', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.379 2.669L12.069 2.089C15.289 1.583 16.899 1.329 17.949 2.228C19 3.126 19 4.756 19 8.016V11H13.08L15.78 7.624L14.22 6.374L10.22 11.374L9.72 12L10.22 12.624L14.22 17.624L15.78 16.374L13.08 13H19V15.983C19 19.243 19 20.873 17.95 21.771C16.9 22.669 15.29 22.416 12.069 21.911L8.379 21.331C6.766 21.077 5.96 20.951 5.48 20.389C5 19.827 5 19.012 5 17.38V6.62C5 4.988 5 4.171 5.48 3.61C5.96 3.049 6.766 2.922 8.379 2.669Z"
      fill={color}
    />
  </Svg>
);

const IconKeluar = ({ color = '#000', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 14 21" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.621 1.03825L6.931 0.45825C3.711 -0.0477501 2.101 -0.30175 1.051 0.59725C1.19209e-07 1.49525 0 3.12525 0 6.38525V9.36925H5.92L3.22 5.99425L4.78 4.74425L8.78 9.74425L9.28 10.3693L8.78 10.9943L4.78 15.9943L3.22 14.7443L5.92 11.3693H0V14.3523C0 17.6123 2.38419e-07 19.2422 1.05 20.1402C2.1 21.0382 3.71 20.7852 6.931 20.2802L10.621 19.7002C12.234 19.4462 13.04 19.3202 13.52 18.7582C14 18.1962 14 17.3813 14 15.7483V4.98925C14 3.35725 14 2.54025 13.52 1.97925C13.04 1.41825 12.234 1.29125 10.621 1.03825Z"
      fill={color}
    />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────

const ReportsScreenWeb = () => {
  const { tenantId, loading: authLoading } = useAuth();

  const [history, setHistory]       = useState<StockHistoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]         = useState<ReportFilterState>(INITIAL_FILTER);

  const loadData = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      setLoading(true);
      const start = filter.startDateStr ? new Date(filter.startDateStr) : null;
      const end   = filter.endDateStr   ? new Date(filter.endDateStr)   : null;
      const result: PaginatedStockHistory = await ReportService.getStockHistory(
        tenantId, PAGE_SIZE, start, end, null,
      );
      setHistory(result.data);
      setTotalCount(result.totalCount);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [tenantId, filter.startDateStr, filter.endDateStr]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (tenantId && !authLoading) loadData();
  }, [tenantId, authLoading]);

  const displayHistory = useMemo(() => {
    let result = history;
    if (filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase();
      result = result.filter(h =>
        h.productName?.toLowerCase().includes(q) ||
        h.reason?.toLowerCase().includes(q)      ||
        h.userName?.toLowerCase().includes(q)    ||
        h.reference?.toLowerCase().includes(q),
      );
    }
    if (filter.filterType !== 'all') {
      result = result.filter(h => h.type === filter.filterType);
    }
    return result;
  }, [history, filter.searchQuery, filter.filterType]);

  const totalIn = useMemo(
    () => history.filter(h => h.type === 'IN').reduce((s, h) => s + (h.qtyChange || 0), 0),
    [history],
  );
  const totalOut = useMemo(
    () => history.filter(h => h.type === 'OUT').reduce((s, h) => s + (h.qtyChange || 0), 0),
    [history],
  );

  const stats: StatItem[] = [
    {
      icon:  <IconLog color={COLORS.primary} size={16} />,
      value: totalCount,
      label: 'Total Log',
      bg:    'rgba(28,58,90,0.07)',
      color: COLORS.primary,
    },
    {
      icon:  <IconMasuk color="#10B981" size={16} />,
      value: totalIn,
      label: 'Total Masuk',
      bg:    '#F0FDF4',
      color: '#10B981',
    },
    {
      icon:  <IconKeluar color="#EF4444" size={16} />,
      value: totalOut,
      label: 'Total Keluar',
      bg:    '#FEF2F2',
      color: '#EF4444',
    },
  ];

  return (
    <View style={s.root}>
      <View style={s.body}>

        {/* SIDEBAR — sama persis dengan ProductScreenWeb */}
        <View style={s.sidebar}>
          <FilterSectionWeb
            filter={filter}
            onChange={setFilter}
            onApply={loadData}
          />
        </View>

        {/* KOLOM KANAN */}
        <View style={s.rightCol}>

          {/* STATS TOOLBAR — di rightCol, bukan di topBar terpisah */}
          <StatsToolbar
            stats={stats}
            right={
              <TouchableOpacity style={s.refreshBtn} onPress={handleRefresh}>
                <RotateCcw size={14} color={COLORS.primary} />
                <Text style={s.refreshBtnTxt}>Perbarui</Text>
              </TouchableOpacity>
            }
          />

          {/* LIST */}
          <ScrollView
            style={s.listScroll}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <SkeletonLoading type="table" rows={10} style={{ margin: 18 }} />
            ) : (
              <View style={s.tableCard}>
                <View style={s.tableHeader}>
                  <Text style={[s.th, { flex: 1.5 }]}>Waktu</Text>
                  <Text style={[s.th, { flex: 2 }]}>Produk</Text>
                  <Text style={[s.th, { width: 80 }]}>Tipe</Text>
                  <Text style={[s.th, { flex: 1, textAlign: 'center' }]}>Stok Awal</Text>
                  <Text style={[s.th, { flex: 1, textAlign: 'center' }]}>Selisih</Text>
                  <Text style={[s.th, { flex: 1, textAlign: 'center' }]}>Stok Akhir</Text>
                  <Text style={[s.th, { flex: 2 }]}>Keterangan</Text>
                  <Text style={[s.th, { flex: 1.5 }]}>Petugas</Text>
                </View>

                {displayHistory.map((item, i) => (
                  <View
                    key={item.id || i}
                    style={[s.tr, i === displayHistory.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <Text style={[s.td, { flex: 1.5 }]} numberOfLines={2}>
                      {formatDate(item.date)}
                    </Text>
                    <Text style={[s.td, { flex: 2, fontFamily: 'PoppinsSemiBold' }]}>
                      {item.productName}
                    </Text>

                    <View style={{ width: 80, alignItems: 'flex-start' }}>
                      <View style={[s.badge, item.type === 'IN' ? s.badgeIn : s.badgeOut]}>
                        <Text style={[s.badgeTxt, item.type === 'IN' ? s.badgeTxtIn : s.badgeTxtOut]}>
                          {item.type}
                        </Text>
                      </View>
                    </View>

                    <Text style={[s.td, { flex: 1, textAlign: 'center', fontFamily: 'PoppinsBold', color: '#64748B' }]}>
                      {item.beforeStock}
                    </Text>
                    <Text style={[s.td, { flex: 1, textAlign: 'center', fontFamily: 'PoppinsBold', color: item.type === 'IN' ? '#10B981' : '#EF4444' }]}>
                      {item.type === 'IN' ? '+' : '-'}{item.qtyChange}
                    </Text>
                    <Text style={[s.td, { flex: 1, textAlign: 'center', fontFamily: 'PoppinsBold', color: COLORS.primary }]}>
                      {item.afterStock}
                    </Text>

                    <View style={{ flex: 2, justifyContent: 'center' }}>
                      <Text style={s.reasonText}>{item.reason}</Text>
                      {item.reference && <Text style={s.refText}>{item.reference}</Text>}
                    </View>
                    <Text style={[s.td, { flex: 1.5, color: '#64748B' }]} numberOfLines={1}>
                      {item.userName}
                    </Text>
                  </View>
                ))}

                {displayHistory.length === 0 && (
                  <View style={s.emptyState}>
                    <FileText size={48} color="#CBD5E1" />
                    <Text style={s.emptyTitle}>Tidak Ada Riwayat Stok</Text>
                    <Text style={s.emptyDesc}>
                      {filter.searchQuery || filter.filterType !== 'all'
                        ? 'Tidak ada data yang cocok dengan filter yang dipilih.'
                        : 'Data riwayat stok belum tersedia pada rentang waktu ini.'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root:    { flex: 1, overflow: 'hidden' as any },
  body:    { flex: 1, flexDirection: 'row', overflow: 'hidden' as any },

  sidebar:  { width: 268, backgroundColor: '#FFF', borderRightWidth: 1, borderRightColor: '#E2E8F0' },
  rightCol: { flex: 1, flexDirection: 'column', overflow: 'hidden' as any },

  refreshBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(28,58,90,0.07)', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, cursor: 'pointer' as any },
  refreshBtnTxt: { color: COLORS.primary, fontFamily: 'PoppinsBold', fontSize: 13 },

  listScroll:  { flex: 1 },
  listContent: { padding: 18, paddingBottom: 40 },

  tableCard:   { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', alignItems: 'center', gap: 10 },
  th:          { fontFamily: 'PoppinsBold', fontSize: 12, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  tr:          { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center', gap: 10 },
  td:          { fontFamily: 'PoppinsMedium', fontSize: 13, color: '#334155' },

  badge:       { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeIn:     { backgroundColor: '#F0FDF4' },
  badgeOut:    { backgroundColor: '#FEF2F2' },
  badgeTxt:    { fontFamily: 'PoppinsBold', fontSize: 11 },
  badgeTxtIn:  { color: '#10B981' },
  badgeTxtOut: { color: '#EF4444' },

  reasonText: { fontFamily: 'PoppinsMedium', fontSize: 12, color: '#334155' },
  refText:    { fontFamily: 'PoppinsMedium', fontSize: 11, color: '#94A3B8' },

  emptyState: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontFamily: 'PoppinsBold', fontSize: 16, color: '#334155' },
  emptyDesc:  { fontFamily: 'PoppinsMedium', fontSize: 13, color: '#64748B', textAlign: 'center', maxWidth: 280 },
});

export default ReportsScreenWeb;