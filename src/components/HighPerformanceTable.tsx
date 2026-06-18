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
  const storeRef = useRef<TableStore<T> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createTableStore<T>({
      columns,
      data,
      rowIdKey,
      pageSize,
      enableSelection,
      selectionColumnWidth,
    });
  }

  const store = storeRef.current!;
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

  const displayedData = useMemo(() => {
    if (state.pagination.mode === 'pagination') {
      return processedData;
    } else {
      return processedData.slice(0, state.pagination.loadedCount);
    }
  }, [processedData, state.pagination.mode, state.pagination.loadedCount]);

  const paginatedData = useMemo(() => {
    if (state.pagination.mode === 'pagination') {
      const start = (state.pagination.page - 1) * state.pagination.pageSize;
      const end = start + state.pagination.pageSize;
      return processedData.slice(start, end);
    }
    return displayedData;
  }, [processedData, displayedData, state.pagination.mode, state.pagination.page, state.pagination.pageSize]);

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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const onScrollHandler = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      vs.onScroll(e);

      if (state.pagination.mode === 'infinite') {
        const target = e.currentTarget;
        const { scrollTop, scrollHeight, clientHeight } = target;
        if (scrollTop + clientHeight >= scrollHeight - 100) {
          if (state.pagination.loadedCount < processedData.length) {
            store.getState().loadMore(state.pagination.pageSize);
          }
        }
      }
    },
    [vs, state.pagination.mode, state.pagination.loadedCount, state.pagination.pageSize, processedData.length, store]
  );

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

  const currentPageIds = useMemo(
    () => paginatedData.map((row) => row[rowIdKey]),
    [paginatedData, rowIdKey]
  );

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
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    },
    [store]
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
            <div style={{ position: 'relative', minWidth: '100%' }}>
              <div style={{ zIndex: 30 }}>
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
                startRowIndex={vs.startRowIndex}
                endRowIndex={vs.endRowIndex}
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
