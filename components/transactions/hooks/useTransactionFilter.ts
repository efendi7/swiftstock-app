import { useMemo } from 'react';

export type FilterMode = 'all' | 'today' | 'specificMonth';
export type SortType = 'latest' | 'oldest';

interface Params {
  transactions: any[];
  searchQuery: string;
  filterMode: FilterMode;
  sortType: SortType;
  selectedMonth: number;
  selectedYear: number;
  isAdmin?: boolean;
}

export const useTransactionFilter = ({
  transactions,
  searchQuery,
  filterMode,
  sortType,
  selectedMonth,
  selectedYear,
  isAdmin = false,
}: Params) => {
  return useMemo(() => {
    let result = [...transactions];

    /* ================= SEARCH ================= */
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.invoiceNumber?.toLowerCase().includes(q) ||
        t.cashierName?.toLowerCase().includes(q) ||
        (isAdmin && t.cashierEmail?.toLowerCase().includes(q))
      );
    }

    /* ================= TIME FILTER ================= */
    if (filterMode === 'today') {
      const today = new Date().toDateString();
      result = result.filter(t =>
        t.createdAt?.toDate().toDateString() === today
      );
    }

    if (filterMode === 'specificMonth') {
      result = result.filter(t => {
        if (!t.createdAt) return false;
        const d = t.createdAt.toDate();
        return (
          d.getMonth() === selectedMonth &&
          d.getFullYear() === selectedYear
        );
      });
    }

    /* ================= SORT ================= */
    result.sort((a, b) => {
      const timeA = a.createdAt?.toDate()?.getTime() || 0;
      const timeB = b.createdAt?.toDate()?.getTime() || 0;

      return sortType === 'latest'
        ? timeB - timeA
        : timeA - timeB;
    });

    return result;
  }, [
    transactions,
    searchQuery,
    filterMode,
    sortType,
    selectedMonth,
    selectedYear,
    isAdmin,
  ]);
};
