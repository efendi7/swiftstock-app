import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { COLORS } from '@constants/colors';
import { usePagination } from '@hooks/usePagination';

interface Props {
  currentPage:  number;
  totalPages:   number;
  totalCount:   number;
  pageSize:     number;
  onPageChange: (page: number) => void;
  entityLabel?: string;
  showInfo?:    boolean;
  onRefresh?:   () => void;
}

interface PageBtnProps {
  children:  React.ReactNode;
  onPress:   () => void;
  disabled?: boolean;
  active?:   boolean;
}

const PageBtn = React.memo(({ children, onPress, disabled, active }: PageBtnProps) => (
  <TouchableOpacity
    style={[s.btn, active && s.btnActive, disabled && s.btnDisabled]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.75}
  >
    {children}
  </TouchableOpacity>
));

const Pagination: React.FC<Props> = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  entityLabel = 'data',
  showInfo    = true,
  onRefresh,
}) => {
  if (totalPages <= 1 && !onRefresh) return null;

  const { safePage, startIdx, pageNums, handleChange } = usePagination({
    currentPage,
    totalPages,
    totalCount,
    pageSize,
  });

  const go = (page: number) => handleChange(page, onPageChange);

  return (
    <View style={s.wrap}>

      {showInfo && (
        <Text style={s.info}>
          {totalPages > 1 ? (
            <>
              Hal. <Text style={s.bold}>{safePage}</Text>
              {'  ·  '}
              <Text style={s.bold}>
                {totalCount === 0 ? 0 : startIdx + 1}–{Math.min(startIdx + pageSize, totalCount)}
              </Text>
              {' dari '}
              <Text style={s.bold}>{totalCount}</Text>
              {` ${entityLabel}`}
            </>
          ) : (
            <><Text style={s.bold}>{totalCount}</Text>{` ${entityLabel}`}</>
          )}
        </Text>
      )}

      {totalPages > 1 && (
        <View style={s.pages}>
          <PageBtn onPress={() => go(safePage - 1)} disabled={safePage === 1}>
            <ChevronLeft size={14} color={safePage === 1 ? '#CBD5E1' : '#475569'} />
          </PageBtn>

          {pageNums[0] > 1 && (
            <>
              <PageBtn onPress={() => go(1)}>
                <Text style={s.pageTxt}>1</Text>
              </PageBtn>
              {pageNums[0] > 2 && <Text style={s.ellipsis}>…</Text>}
            </>
          )}

          {pageNums.map(n => (
            <PageBtn key={n} onPress={() => go(n)} active={n === safePage}>
              <Text style={[s.pageTxt, n === safePage && s.pageTxtActive]}>{n}</Text>
            </PageBtn>
          ))}

          {pageNums[pageNums.length - 1] < totalPages && (
            <>
              {pageNums[pageNums.length - 1] < totalPages - 1 && (
                <Text style={s.ellipsis}>…</Text>
              )}
              <PageBtn onPress={() => go(totalPages)}>
                <Text style={s.pageTxt}>{totalPages}</Text>
              </PageBtn>
            </>
          )}

          <PageBtn onPress={() => go(safePage + 1)} disabled={safePage === totalPages}>
            <ChevronRight size={14} color={safePage === totalPages ? '#CBD5E1' : '#475569'} />
          </PageBtn>
        </View>
      )}

      {onRefresh && (
        <TouchableOpacity style={s.refreshBtn} onPress={onRefresh}>
          <Text style={s.refreshTxt}>↻  Perbarui</Text>
        </TouchableOpacity>
      )}

    </View>
  );
};

const s = StyleSheet.create({
  wrap: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    flexWrap:       'wrap',
    gap:            10,
    marginTop:      16,
    paddingTop:     14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  } as ViewStyle,
  info:          { fontSize: 12, fontFamily: 'PoppinsRegular', color: '#64748B' },
  bold:          { fontFamily: 'PoppinsBold', color: '#1E293B' },
  pages:         { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ellipsis:      { fontSize: 12, color: '#94A3B8', paddingHorizontal: 2 },
  btn: {
    minWidth:          32,
    height:            32,
    borderRadius:      8,
    borderWidth:       1,
    borderColor:       '#E2E8F0',
    backgroundColor:   '#FFF',
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 6,
  },
  btnActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  btnDisabled:   { backgroundColor: '#F8FAFC', borderColor: '#F1F5F9' },
  pageTxt:       { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#475569' },
  pageTxtActive: { color: '#FFF', fontFamily: 'PoppinsBold' },
  refreshBtn: {
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      7,
    borderWidth:       1,
    borderColor:       '#E2E8F0',
  },
  refreshTxt: { fontSize: 12, fontFamily: 'PoppinsMedium', color: '#475569' },
});

export default Pagination;