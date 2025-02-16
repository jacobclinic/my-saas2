import { useMemo, useState, useEffect } from 'react';
import type { PaginationState } from '@tanstack/react-table';

interface UseTablePaginationProps<T> {
  data: T[];
  pageSize?: number;
}

export function useTablePagination<T>({ data, pageSize = 10 }: UseTablePaginationProps<T>) {
  const [pageIndex, setPageIndex] = useState(0);

  // Reset to first page when data changes (e.g., due to filtering)
  useEffect(() => {
    setPageIndex(0);
  }, [data]);

  const paginatedData = useMemo(() => {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, pageIndex, pageSize]);

  const pageCount = Math.ceil(data.length / pageSize);

  const handlePaginationChange = (pagination: PaginationState) => {
    setPageIndex(pagination.pageIndex);
  };
  console.log("pageIndex", pageIndex);

  return {
    paginatedData,
    pageIndex,
    pageSize,
    pageCount,
    handlePaginationChange,
  };
}