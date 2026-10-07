/**
 * usePagination — Client-side pagination for any array: current page, page size,
 * the visible slice and "showing X–Y of Z" numbers. Goes back to page 1 whenever
 * `resetKey` changes (e.g. a new search or filter).
 */
import { useMemo, useState } from 'react';

export default function usePagination(items, { initialPageSize = 5, resetKey = '' } = {}) {
  // The page is remembered together with the filters it belongs to, so new filters start at page 1.
  const [pageState, setPageState] = useState({ key: resetKey, page: 1 });
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const requestedPage = pageState.key === resetKey ? pageState.page : 1;
  const page = Math.min(Math.max(1, requestedPage), totalPages); // stays valid when the list shrinks

  const pageItems = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page, pageSize]);

  const setPage = (nextPage) => setPageState({ key: resetKey, page: nextPage });

  const setPageSize = (size) => {
    setPageSizeState(size);
    setPageState({ key: resetKey, page: 1 });
  };

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    totalPages,
    pageItems,
    startItem: total ? (page - 1) * pageSize + 1 : 0,
    endItem: Math.min(page * pageSize, total),
  };
}
