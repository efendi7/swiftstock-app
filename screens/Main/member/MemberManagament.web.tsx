import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, Modal,
} from 'react-native';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { Users, Plus, Star, Crown, Award, Medal, RotateCcw } from 'lucide-react-native';

import { COLORS }  from '@constants/colors';
import { useAuth } from '@hooks/auth/useAuth';
import { MemberService, MemberConfigService, calculateTier } from '@services/memberService';
import { Member, MemberTier, DEFAULT_TIERS } from '@/types/member.types';

import MemberFilterWeb from '@components/member/MemberFilterWeb';
import MemberListWeb   from '@components/member/MemberListWeb';
import AddMemberModal  from './modal/AddMemberModal';
import EditMemberModal from './modal/EditMemberModal';
import MemberDetailModal from './modal/MemberDetailModal';

const PAGE_SIZE = 20;

const MemberManagementWeb = () => {
  const { tenantId, user, loading: authLoading } = useAuth();

  const [members,         setMembers]         = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [totalCount,      setTotalCount]      = useState(0);
  const [currentPage,     setCurrentPage]     = useState(1);
  const [totalPages,      setTotalPages]      = useState(1);
  const [lastDoc,         setLastDoc]         = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [pageCache,       setPageCache]       = useState<Record<number, {
    data: Member[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  }>>({});

  const [tiers,       setTiers]       = useState<MemberTier[]>(DEFAULT_TIERS);
  const [loading,     setLoading]     = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);

  const [showAddModal,    setShowAddModal]    = useState(false);
  const [showEditModal,   setShowEditModal]   = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMember,  setSelectedMember]  = useState<Member | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter,  setTierFilter]  = useState<string>('all');

  const hasActiveFilter = searchQuery !== '' || tierFilter !== 'all';

  // ── LOAD ──────────────────────────────────────────────────
  const loadTiers = useCallback(async () => {
    if (!tenantId) return;
    const t = await MemberConfigService.getActiveTiers(tenantId);
    setTiers(t);
  }, [tenantId]);

  const loadFirstPage = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      setLoading(true);
      setCurrentPage(1);
      setPageCache({});

      const result = await MemberService.getMembersFirstPage(tenantId, PAGE_SIZE);
      setMembers(result.members);
      setFilteredMembers(result.members);
      setTotalCount(result.totalCount);
      setTotalPages(Math.ceil(result.totalCount / PAGE_SIZE) || 1);
      setLastDoc(result.lastDoc);
      setPageCache({ 1: { data: result.members, lastDoc: result.lastDoc } });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const handlePageChange = useCallback(async (page: number) => {
    if (!tenantId) return;
    if (pageCache[page]) {
      const cached = pageCache[page];
      setMembers(cached.data);
      setFilteredMembers(cached.data);
      setLastDoc(cached.lastDoc);
      setCurrentPage(page);
      return;
    }
    const prevCache = pageCache[page - 1];
    if (!prevCache?.lastDoc) return;
    try {
      setPageLoading(true);
      const result = await MemberService.getMembersNextPage(tenantId, prevCache.lastDoc, PAGE_SIZE);
      setMembers(result.members);
      setFilteredMembers(result.members);
      setLastDoc(result.lastDoc);
      setCurrentPage(page);
      setPageCache(prev => ({ ...prev, [page]: { data: result.members, lastDoc: result.lastDoc } }));
    } catch (e) {
      console.error(e);
    } finally {
      setPageLoading(false);
    }
  }, [tenantId, pageCache]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  }, [loadFirstPage]);

  useEffect(() => {
    if (tenantId && !authLoading) {
      loadTiers();
      loadFirstPage();
    }
  }, [tenantId, authLoading]);

  // ── STATS ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const byTier: Record<string, number> = {};
    tiers.forEach(t => { byTier[t.name] = 0; });
    members.forEach(m => {
      if (byTier[m.tier] !== undefined) byTier[m.tier]++;
    });
    const totalSpend = members.reduce((s, m) => s + (m.totalSpend || 0), 0);
    return { byTier, totalSpend };
  }, [members, tiers]);

  // ── ACTIONS ───────────────────────────────────────────────
  const handleDelete = async (member: Member) => {
    if (!tenantId) return;
    try {
      await MemberService.deleteMember(tenantId, member.id);
      await loadFirstPage();
    } catch (e) { console.error(e); }
  };

  const tierIcons: Record<string, React.ReactNode> = {
    'Reguler':  <Medal  size={14} color="#94A3B8" />,
    'Silver':   <Award  size={14} color="#64748B" />,
    'Gold':     <Star   size={14} color="#F59E0B" />,
    'Platinum': <Crown  size={14} color="#8B5CF6" />,
  };

  return (
    <View style={styles.root}>
      <View style={styles.body}>

        {/* SIDEBAR */}
        <View style={styles.sidebar}>
          <MemberFilterWeb
            members={members}
            tiers={tiers}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            tierFilter={tierFilter}
            onTierChange={setTierFilter}
            onFiltered={setFilteredMembers}
          />
        </View>

        {/* KOLOM KANAN */}
        <View style={styles.rightCol}>

          {/* TOOLBAR */}
          <View style={styles.toolbar}>
            <View style={styles.stats}>
              <StatChip
                icon={<Users size={14} color={COLORS.primary} />}
                value={totalCount}
                label="Total Member"
                bg="rgba(28,58,90,0.07)"
                color={COLORS.primary}
              />
              {tiers.map(tier => (
                stats.byTier[tier.name] > 0 && (
                  <StatChip
                    key={tier.name}
                    icon={tierIcons[tier.name] ?? <Medal size={14} color={tier.color} />}
                    value={stats.byTier[tier.name]}
                    label={tier.name}
                    bg={tier.color + '18'}
                    color={tier.color}
                  />
                )
              ))}
              <StatChip
                icon={<Star size={14} color="#10B981" />}
                value={'Rp ' + (stats.totalSpend >= 1_000_000
                  ? (stats.totalSpend / 1_000_000).toFixed(1) + 'jt'
                  : (stats.totalSpend / 1_000).toFixed(0) + 'rb')}
                label="Total Belanja"
                bg="#F0FDF4"
                color="#10B981"
              />
              {!hasActiveFilter && totalPages > 1 && (
                <Text style={styles.pageInfo}>Hal. {currentPage} / {totalPages}</Text>
              )}
              {hasActiveFilter && filteredMembers.length !== members.length && (
                <Text style={styles.pageInfo}>{filteredMembers.length} tampil</Text>
              )}
            </View>

            <View style={styles.toolbarRight}>
              <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
                <RotateCcw size={14} color={COLORS.primary} />
                <Text style={styles.refreshBtnText}>Perbarui</Text>
              </TouchableOpacity>
              {user?.role === 'admin' && (
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                  <Plus size={16} color="#FFF" />
                  <Text style={styles.addBtnText}>Tambah Member</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* LIST */}
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {loading || pageLoading ? (
              <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 80 }} />
            ) : (
              <MemberListWeb
                data={filteredMembers}
                tiers={tiers}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                isAdmin={user?.role === 'admin'}
                onViewPress={(m) => { setSelectedMember(m); setShowDetailModal(true); }}
                onEditPress={(m) => { setSelectedMember(m); setShowEditModal(true); }}
                onDeletePress={handleDelete}
                usePagination={!hasActiveFilter}
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
              />
            )}
          </ScrollView>
        </View>
      </View>

      <AddMemberModal
        visible={showAddModal}
        tenantId={tenantId || ''}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadFirstPage}
      />
      <EditMemberModal
        visible={showEditModal}
        member={selectedMember}
        tenantId={tenantId || ''}
        tiers={tiers}
        onClose={() => { setShowEditModal(false); setSelectedMember(null); }}
        onSuccess={loadFirstPage}
      />
      <MemberDetailModal
        visible={showDetailModal}
        member={selectedMember}
        tenantId={tenantId || ''}
        tiers={tiers}
        onClose={() => { setShowDetailModal(false); setSelectedMember(null); }}
        onAdjustPoints={async () => { await loadFirstPage(); }}
      />
    </View>
  );
};

const StatChip = ({ icon, value, label, bg, color }: {
  icon: React.ReactNode; value: number | string; label: string; bg: string; color: string;
}) => (
  <View style={[styles.statChip, { backgroundColor: bg }]}>
    {icon}
    <Text style={[styles.statVal, { color }]}>{value}</Text>
    <Text style={[styles.statLabel, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  root:         { flex: 1, overflow: 'hidden' as any },
  body:         { flex: 1, flexDirection: 'row', overflow: 'hidden' as any },
  sidebar:      { width: 268, backgroundColor: '#FFF', borderRightWidth: 1, borderRightColor: '#E2E8F0', overflow: 'hidden' as any },
  rightCol:     { flex: 1, flexDirection: 'column', overflow: 'hidden' as any },
  toolbar:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 12 },
  toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stats:        { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' as any },
  statChip:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statVal:      { fontSize: 13, fontFamily: 'PoppinsBold' },
  statLabel:    { fontSize: 11, fontFamily: 'PoppinsRegular' },
  pageInfo:     { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#94A3B8', marginLeft: 4 },
  refreshBtn:     { backgroundColor: 'rgba(28,58,90,0.07)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, gap: 6, cursor: 'pointer' as any },
  refreshBtnText: { color: COLORS.primary, fontFamily: 'PoppinsBold', fontSize: 13 },
  addBtn:       { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 9, gap: 6, cursor: 'pointer' as any },
  addBtnText:   { color: '#FFF', fontFamily: 'PoppinsBold', fontSize: 13 },
  listScroll:   { flex: 1 },
  listContent:  { padding: 18, paddingBottom: 40 },
});

export default MemberManagementWeb;