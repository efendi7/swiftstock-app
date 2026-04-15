/**
 * components/common/Pagination.tsx
 * Komponen paginasi reusable — dipakai di ProductListWeb, CashierListWeb, dll.
 *
 * Cara pakai:
 *   <Pagination
 *     currentPage={currentPage}
 *     totalPages={totalPages}
 *     totalCount={totalCount}
 *     pageSize={PAGE_SIZE}
 *     onPageChange={handlePageChange}
 *   />
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { COLORS } from '@constants/colors';

interface Props {
  currentPage:  number;
  totalPages:   number;
  totalCount:   number;
  pageSize:     number;
  onPageChange: (page: number) => void;
  /** Label entitas, default "data" */
  entityLabel?: string;
  /** Tampilkan info "X–Y dari Z" */
  showInfo?:    boolean;
  /** Tampilkan tombol refresh */
  onRefresh?:   () => void;
}

const Pagination: React.FC<Props> = ({
  currentPage, totalPages, totalCount, pageSize,
  onPageChange, entityLabel = 'data',
  showInfo = true, onRefresh,
}) => {
  if (totalPages <= 1 && !onRefresh) return null;

  const startIdx = (currentPage - 1) * pageSize;

  // Hitung range halaman yang ditampilkan (maks 5)
  const pageNums: number[] = [];
  if (totalPages > 1) {
    let start = Math.max(1, currentPage - 2);
    let end   = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pageNums.push(i);
  }

  return (
    <View style={s.wrap}>

      {/* Info teks */}
      {showInfo && (
        <Text style={s.info}>
          {totalPages > 1 ? (
            <>
              Hal. <Text style={s.bold}>{currentPage}</Text>
              {'  ·  '}
              <Text style={s.bold}>{startIdx + 1}–{Math.min(startIdx + pageSize, totalCount)}</Text>
              {' dari '}
              <Text style={s.bold}>{totalCount}</Text>
              {` ${entityLabel}`}
            </>
          ) : (
            <><Text style={s.bold}>{totalCount}</Text>{` ${entityLabel}`}</>
          )}
        </Text>
      )}

      {/* Tombol halaman */}
      {totalPages > 1 && (
        <View style={s.pages}>
          <PageBtn
            onPress={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={14} color={currentPage === 1 ? '#CBD5E1' : '#475569'} />
          </PageBtn>

          {pageNums[0] > 1 && (
            <>
              <PageBtn onPress={() => onPageChange(1)}>
                <Text style={s.pageTxt}>1</Text>
              </PageBtn>
              {pageNums[0] > 2 && <Text style={s.ellipsis}>…</Text>}
            </>
          )}

          {pageNums.map(n => (
            <PageBtn key={n} onPress={() => onPageChange(n)} active={n === currentPage}>
              <Text style={[s.pageTxt, n === currentPage && s.pageTxtActive]}>{n}</Text>
            </PageBtn>
          ))}

          {pageNums[pageNums.length - 1] < totalPages && (
            <>
              {pageNums[pageNums.length - 1] < totalPages - 1 && <Text style={s.ellipsis}>…</Text>}
              <PageBtn onPress={() => onPageChange(totalPages)}>
                <Text style={s.pageTxt}>{totalPages}</Text>
              </PageBtn>
            </>
          )}

          <PageBtn
            onPress={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={14} color={currentPage === totalPages ? '#CBD5E1' : '#475569'} />
          </PageBtn>
        </View>
      )}

      {/* Tombol refresh */}
      {onRefresh && (
        <TouchableOpacity style={s.refreshBtn} onPress={onRefresh}>
          <Text style={s.refreshTxt}>↻  Perbarui</Text>
        </TouchableOpacity>
      )}

    </View>
  );
};

// ── PageBtn ───────────────────────────────────────────────
const PageBtn = ({ children, onPress, disabled, active }: {
  children: React.ReactNode;
  onPress:  () => void;
  disabled?: boolean;
  active?:   boolean;
}) => (
  <TouchableOpacity
    style={[s.btn, active && s.btnActive, disabled && s.btnDisabled]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.75}
  >
    {children}
  </TouchableOpacity>
);

const s = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as any, gap: 10, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  info:       { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#64748B' },
  bold:       { fontFamily: 'PoppinsBold', color: '#1E293B' },
  pages:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ellipsis:   { fontSize: 12, color: '#94A3B8', paddingHorizontal: 2 },
  btn:        { minWidth: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, cursor: 'pointer' as any },
  btnActive:  { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  btnDisabled:{ backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' },
  pageTxt:    { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#475569' },
  pageTxtActive: { color: '#FFF', fontFamily: 'PoppinsBold' },
  refreshBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 7, borderWidth: 1, borderColor: '#E2E8F0', cursor: 'pointer' as any },
  refreshTxt: { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#475569' },
});

export default Pagination;