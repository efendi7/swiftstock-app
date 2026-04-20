import { useMemo } from 'react';

const MAX_VISIBLE_PAGES = 5;

interface UsePaginationProps {
  currentPage: number;
  totalPages:  number;
  totalCount:  number;
  pageSize:    number;
}

interface UsePaginationReturn {
  safePage:   number;
  startIdx:   number;
  pageNums:   number[];
  handleChange: (page: number, onPageChange: (p: number) => void) => void;
}

export function usePagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
}: UsePaginationProps): UsePaginationReturn {
  const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  const startIdx = (safePage - 1) * pageSize;

  const pageNums = useMemo(() => {
    if (totalPages <= 1) return [];

    let start = Math.max(1, safePage - Math.floor(MAX_VISIBLE_PAGES / 2));
    let end   = Math.min(totalPages, start + MAX_VISIBLE_PAGES - 1);

    if (end - start < MAX_VISIBLE_PAGES - 1) {
      start = Math.max(1, end - (MAX_VISIBLE_PAGES - 1));
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [safePage, totalPages]);

  const handleChange = (page: number, onPageChange: (p: number) => void) => {
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  return { safePage, startIdx, pageNums, handleChange };
}