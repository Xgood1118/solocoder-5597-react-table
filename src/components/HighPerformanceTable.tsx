import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { ColumnDef, PaginationState } from '../types/table';
import { createTableStore, TableStore } from '../store/tableStore';
import { sortData } from '../utils/sort';
import { filterData } from '../utils/filter';
import { exportToXLSX, exportToCSV } from '../utils/export';
import { useVirtualScroll } from '../hooks/useVirtualScroll';
import { Toolbar } from './Toolbar';
import { TableHeader } from './TableHeader';
import { TableBody } from './TableBody';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { SkeletonLoader } from './SkeletonLoader';

export interface HighPerformanceTableProps<T extends Record<string, any>> {
  columns: ColumnDef<T>[];
  data: T[];
  rowIdKey: string;
  loading?: boolean;
  pageSize?: number;
  enableSelection?: boolean;
  selectionColumnWidth?: number;
  height?: number;
  estimatedRowHeight?: number;
  striped?: boolean;
  className?: string;
}

export function HighPerformanceTable<T extends Record<string, any>>({
  columns,
  data,
  rowIdKey,
  loading = false,
  pageSize = 50,
  enableSelection = false,
  selectionColumnWidth = 48,
  height = 600,
  estimatedRowHeight = 48,
  striped = true,
  className = '',
}: HighPerformanceTableProps<T>) {
  const storeRef = useRef<any>(null);
  if (!storeRef.current) {
    storeRef.current = createTableStore<any>({
      columns: columns as any,
      data,
      rowIdKey,
      pageSize,
      enableSelection,
      selectionColumnWidth,
    });
  }

  const store = storeRef.current;
  const state = store();

  const [, forceUpdate] = useState(0);
  const rerender = useCallback(() => forceUpdate((v) => v + 1), []);

  useEffect(() => {
    return store.subscribe(rerender);
  }, [store, rerender]);

  useEffect(() => {
    store.getState().setColumns(columns);
  }, [columns, store]);

  useEffect(() => {
    store.getState().setData(data);
  }, [data, store]);

  useEffect(() => {
    store.getState().setLoading(loading);
  }, [loading, store]);

  const processedData = useMemo(() => {
    const filtered = filterData(data, columns, state.filterState);
    const sorted = sortData(filtered, columns, state.sortState);
    return sorted;
  }, [data, columns, state.filterState, state.sortState]);

  useEffect(() => {
    const currentTotal = store.getState().pagination.total;
    if (currentTotal !== processedData.length) {
      store.setState({
        pagination: {
          ...store.getState().pagination,
          total: processedData.length,
          loadedCount: Math.min(
            processedData.length,
            Math.max(store.getState().pagination.loadedCount, store.getState().pagination.pageSize)
          ),
        },
      });
    }
  }, [processedData.length, store]);

  const displayedData = useMemo(() => {
    if (state.pagination.mode === 'pagination') {
      return processedData;
    } else {
      return processedData.slice(0, state.pagination.loadedCount);
    }
  }, [processedData, state.pagination.mode, state.pagination.loadedCount]);

  const paginatedData = useMemo(() => {
    if (state.pagination.mode === 'pagination') {
      return processedData;
    }
    return displayedData;
  }, [processedData, displayedData, state.pagination.mode]);

  const getRowHeightFn = useCallback(
    (row: T): number => {
      for (const col of columns) {
        if (col.getRowHeight) {
          return col.getRowHeight(row);
        }
      }
      return estimatedRowHeight;
    },
    [columns, estimatedRowHeight]
  );

  const vs = useVirtualScroll(
    paginatedData,
    columns,
    state.columnWidths,
    estimatedRowHeight,
    getRowHeightFn
  );

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreRef = useRef(false);
  const scrollModeRef = useRef(state.pagination.mode);

  useEffect(() => {
    scrollModeRef.current = state.pagination.mode;
  }, [state.pagination.mode]);

  const onScrollHandler = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      vs.onScroll(e);

      if (scrollModeRef.current === 'infinite') {
        const target = e.currentTarget;
        const { scrollTop, scrollHeight, clientHeight } = target;
        if (
          scrollTop + clientHeight >= scrollHeight - 200 &&
          !loadingMoreRef.current
        ) {
          const st = store.getState();
          if (st.pagination.loadedCount < st.pagination.total) {
            loadingMoreRef.current = true;
            store.getState().loadMore(st.pagination.pageSize);
            setTimeout(() => {
              loadingMoreRef.current = false;
            }, 50);
          }
        }
      }
    },
    [vs, store]
  );

  useEffect(() => {
    loadingMoreRef.current = false;
  }, [state.pagination.loadedCount]);

  useEffect(() => {
    const handleResizeColumn = (e: any) => {
      const { columnId, width } = e.detail;
      store.getState().updateColumnWidth(columnId, width);
    };
    const handleResizeColumnEnd = (e: any) => {
      store.getState().endDragColumn();
    };
    document.addEventListener('hp-table:resize-column', handleResizeColumn);
    document.addEventListener('hp-table:resize-column-end', handleResizeColumnEnd);
    return () => {
      document.removeEventListener('hp-table:resize-column', handleResizeColumn);
      document.removeEventListener('hp-table:resize-column-end', handleResizeColumnEnd);
    };
  }, [store]);

  const currentPageIds = useMemo(() => {
    if (state.pagination.mode === 'pagination') {
      const start = (state.pagination.page - 1) * state.pagination.pageSize;
      const end = start + state.pagination.pageSize;
      return processedData.slice(start, end).map((row) => row[rowIdKey]);
    }
    return paginatedData.map((row) => row[rowIdKey]);
  }, [processedData, paginatedData, rowIdKey, state.pagination.mode, state.pagination.page, state.pagination.pageSize]);

  const { allSelected, indeterminate } = useMemo(() => {
    if (currentPageIds.length === 0) return { allSelected: false, indeterminate: false };
    const selectedCount = currentPageIds.filter((id) => state.selection.selectedIds.has(id)).length;
    if (selectedCount === 0) return { allSelected: false, indeterminate: false };
    if (selectedCount === currentPageIds.length) return { allSelected: true, indeterminate: false };
    return { allSelected: false, indeterminate: true };
  }, [currentPageIds, state.selection.selectedIds]);

  const handleSort = useCallback(
    (columnId: string, multiSort: boolean) => {
      store.getState().setSort(columnId, multiSort);
    },
    [store]
  );

  const handleFilterClick = useCallback(
    (columnId: string) => {
      const current = state.expandedFilterColumn;
      store.getState().setExpandedFilterColumn(current === columnId ? null : columnId);
    },
    [store, state.expandedFilterColumn]
  );

  const handleSetFilter = useCallback(
    (columnId: string, condition: any) => {
      store.getState().setFilter(columnId, condition);
    },
    [store]
  );

  const handleExportXLSX = useCallback(() => {
    exportToXLSX(processedData, columns, `export_${Date.now()}.xlsx`);
  }, [processedData, columns]);

  const handleExportCSV = useCallback(() => {
    exportToCSV(processedData, columns, `export_${Date.now()}.csv`);
  }, [processedData, columns]);

  const handleToggleSelection = useCallback(
    (rowId: string) => {
      store.getState().toggleRowSelection(rowId);
    },
    [store]
  );

  const handleSelectAll = useCallback(() => {
    store.getState().selectAll(currentPageIds);
  }, [store, currentPageIds]);

  const handlePageChange = useCallback(
    (page: number) => {
      store.getState().setPage(page);
      if (scrollContainerRef.current && state.pagination.mode === 'pagination') {
        const startRowIdx = (page - 1) * state.pagination.pageSize;
        let targetTop = 0;
        for (let i = 0; i < startRowIdx && i < vs.rowOffsets.length; i++) {
          targetTop = vs.rowOffsets[i] + (vs.rowHeights[i] ?? estimatedRowHeight);
        }
        scrollContainerRef.current.scrollTop = targetTop;
      }
    },
    [store, state.pagination.mode, state.pagination.pageSize, vs.rowOffsets, vs.rowHeights, estimatedRowHeight]
  );

  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      store.getState().setPageSize(pageSize);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    },
    [store]
  );

  const handlePaginationModeChange = useCallback(
    (mode: 'pagination' | 'infinite') => {
      store.getState().setPaginationMode(mode);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    },
    [store]
  );

  const paginationForUI: PaginationState = {
    ...state.pagination,
    total: processedData.length,
  };

  const showEmpty = !loading && processedData.length === 0;
  const showSkeleton = loading;

  const currentPageStartIdx =
    state.pagination.mode === 'pagination'
      ? (state.pagination.page - 1) * state.pagination.pageSize
      : 0;
  const currentPageEndIdx =
    state.pagination.mode === 'pagination'
      ? Math.min(processedData.length, state.pagination.page * state.pagination.pageSize)
      : paginatedData.length;

  return (
    <div className={`flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm ${className}`}>
      <Toolbar<T>
        columns={columns}
        sortState={state.sortState}
        filterState={state.filterState}
        selectedCount={state.selection.selectedIds.size}
        expandedFilterColumn={state.expandedFilterColumn}
        onClearSort={() => store.getState().clearSort()}
        onClearFilters={() => store.getState().clearFilters()}
        onClearSelection={() => store.getState().clearSelection()}
        onSetExpandedFilterColumn={(c) => store.getState().setExpandedFilterColumn(c)}
        onSetFilter={handleSetFilter}
        onExportXLSX={handleExportXLSX}
        onExportCSV={handleExportCSV}
      />

      {showSkeleton ? (
        <SkeletonLoader columns={columns.length} rows={Math.min(10, Math.ceil(height / estimatedRowHeight))} />
      ) : showEmpty ? (
        <EmptyState />
      ) : (
        <>
          <div
            ref={(el) => {
              (vs as any).containerRef.current = el;
              scrollContainerRef.current = el;
            }}
            onScroll={onScrollHandler}
            className="overflow-auto hp-table-scrollbar"
            style={{
              height: Math.min(height, vs.totalHeight + 48),
              maxHeight: height,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'relative',
                minWidth: '100%',
                width: vs.totalWidth < 1 ? '100%' : vs.totalWidth,
              }}
            >
              <div style={{ position: 'sticky', top: 0, zIndex: 40 }}>
                <TableHeader<T>
                  columns={columns}
                  columnWidths={state.columnWidths}
                  sortState={state.sortState}
                  scrollLeft={vs.scrollLeft}
                  headerRef={vs.headerRef}
                  onSort={handleSort}
                  onFilterClick={handleFilterClick}
                  expandedFilterColumn={state.expandedFilterColumn}
                  enableSelection={enableSelection}
                  selectionColumnWidth={selectionColumnWidth}
                  allSelected={allSelected}
                  indeterminate={indeterminate}
                  onSelectAll={handleSelectAll}
                />
              </div>

              <TableBody<T>
                data={paginatedData}
                columns={columns}
                columnWidths={state.columnWidths}
                startRowIndex={Math.max(0, vs.startRowIndex)}
                endRowIndex={Math.min(paginatedData.length, vs.endRowIndex)}
                startColIndex={vs.startColIndex}
                endColIndex={vs.endColIndex}
                rowOffsets={vs.rowOffsets}
                rowHeights={vs.rowHeights}
                colOffsets={vs.colOffsets}
                totalHeight={vs.totalHeight}
                totalWidth={vs.totalWidth}
                scrollLeft={vs.scrollLeft}
                viewportWidth={vs.viewportWidth}
                rowIdKey={rowIdKey}
                enableSelection={enableSelection}
                selectionColumnWidth={selectionColumnWidth}
                selectedIds={state.selection.selectedIds}
                onToggleSelection={handleToggleSelection}
                measureRowHeight={vs.measureRowHeight}
                striped={striped}
              />

              {state.pagination.mode === 'infinite' &&
                state.pagination.loadedCount < state.pagination.total && (
                  <div
                    className="w-full flex items-center justify-center py-4 text-sm text-slate-400"
                    style={{ position: 'absolute', bottom: 0, left: 0 }}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="animate-spin w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      加载更多...
                    </div>
                  </div>
                )}
            </div>
          </div>

          <Pagination
            page={paginationForUI.page}
            pageSize={paginationForUI.pageSize}
            total={paginationForUI.total}
            mode={paginationForUI.mode}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onModeChange={handlePaginationModeChange}
          />
        </>
      )}
    </div>
  );
}
