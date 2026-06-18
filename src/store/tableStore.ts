import { create } from 'zustand';
import {
  ColumnDef,
  SortItem,
  FilterCondition,
  PaginationState,
  SelectionState,
} from '../types/table';
import { toggleSortState } from '../utils/sort';

export interface TableStoreState<T = any> {
  columns: ColumnDef<T>[];
  data: T[];
  rowIdKey: string;
  sortState: SortItem[];
  filterState: Record<string, FilterCondition>;
  pagination: PaginationState;
  selection: SelectionState;
  loading: boolean;
  scrollTop: number;
  scrollLeft: number;
  expandedFilterColumn: string | null;
  draggedColumn: string | null;
  columnWidths: Record<string, number>;
  enableSelection: boolean;
  selectionColumnWidth: number;

  setColumns: (columns: ColumnDef<T>[]) => void;
  setData: (data: T[]) => void;
  setLoading: (loading: boolean) => void;
  setSort: (columnId: string, multiSort: boolean) => void;
  clearSort: () => void;
  setFilter: (columnId: string, condition: FilterCondition | null) => void;
  clearFilters: () => void;
  setExpandedFilterColumn: (columnId: string | null) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setPaginationMode: (mode: 'pagination' | 'infinite') => void;
  loadMore: (count: number) => void;
  toggleRowSelection: (rowId: string) => void;
  selectAll: (rowIds: string[]) => void;
  clearSelection: () => void;
  setScrollTop: (scrollTop: number) => void;
  setScrollLeft: (scrollLeft: number) => void;
  startDragColumn: (columnId: string) => void;
  updateColumnWidth: (columnId: string, width: number) => void;
  endDragColumn: () => void;
}

function createInitialColumnWidths<T>(columns: ColumnDef<T>[]): Record<string, number> {
  const widths: Record<string, number> = {};
  columns.forEach((col) => {
    widths[col.id] = col.width;
  });
  return widths;
}

export const createTableStore = <T extends Record<string, any>>(initialProps: {
  columns: ColumnDef<T>[];
  data: T[];
  rowIdKey: string;
  pageSize?: number;
  enableSelection?: boolean;
  selectionColumnWidth?: number;
}) => {
  const {
    columns,
    data,
    rowIdKey,
    pageSize = 50,
    enableSelection = false,
    selectionColumnWidth = 48,
  } = initialProps;

  return create<TableStoreState<T>>((set, get) => ({
    columns,
    data,
    rowIdKey,
    sortState: [],
    filterState: {},
    pagination: {
      mode: 'pagination',
      page: 1,
      pageSize,
      total: data.length,
      loadedCount: data.length,
    },
    selection: {
      selectedIds: new Set<string>(),
      indeterminateIds: new Set<string>(),
    },
    loading: false,
    scrollTop: 0,
    scrollLeft: 0,
    expandedFilterColumn: null,
    draggedColumn: null,
    columnWidths: createInitialColumnWidths(columns),
    enableSelection,
    selectionColumnWidth,

    setColumns: (newColumns) =>
      set({
        columns: newColumns,
        columnWidths: createInitialColumnWidths(newColumns),
      }),

    setData: (newData) =>
      set((state) => ({
        data: newData,
        pagination: {
          ...state.pagination,
          total: newData.length,
          loadedCount: Math.min(newData.length, state.pagination.page * state.pagination.pageSize),
        },
      })),

    setLoading: (loading) => set({ loading }),

    setSort: (columnId, multiSort) =>
      set((state) => ({
        sortState: toggleSortState(state.sortState, columnId, multiSort),
      })),

    clearSort: () => set({ sortState: [] }),

    setFilter: (columnId, condition) =>
      set((state) => {
        const newFilterState = { ...state.filterState };
        if (condition === null) {
          delete newFilterState[columnId];
        } else {
          newFilterState[columnId] = condition;
        }
        return {
          filterState: newFilterState,
          pagination: {
            ...state.pagination,
            page: 1,
          },
        };
      }),

    clearFilters: () =>
      set((state) => ({
        filterState: {},
        pagination: {
          ...state.pagination,
          page: 1,
        },
      })),

    setExpandedFilterColumn: (columnId) => set({ expandedFilterColumn: columnId }),

    setPage: (page) =>
      set((state) => ({
        pagination: {
          ...state.pagination,
          page,
          loadedCount: Math.min(state.pagination.total, page * state.pagination.pageSize),
        },
      })),

    setPageSize: (pageSize) =>
      set((state) => ({
        pagination: {
          ...state.pagination,
          pageSize,
          page: 1,
          loadedCount: Math.min(state.pagination.total, pageSize),
        },
      })),

    setPaginationMode: (mode) =>
      set((state) => {
        const newState = {
          pagination: {
            ...state.pagination,
            mode,
            page: 1,
          },
        };
        if (mode === 'infinite') {
          newState.pagination.loadedCount = Math.min(
            state.pagination.total,
            state.pagination.pageSize
          );
        } else {
          newState.pagination.loadedCount = state.pagination.total;
        }
        return newState;
      }),

    loadMore: (count) =>
      set((state) => {
        const newLoadedCount = Math.min(
          state.pagination.total,
          state.pagination.loadedCount + count
        );
        const newPage = Math.ceil(newLoadedCount / state.pagination.pageSize);
        return {
          pagination: {
            ...state.pagination,
            loadedCount: newLoadedCount,
            page: newPage,
          },
        };
      }),

    toggleRowSelection: (rowId) =>
      set((state) => {
        const newSelectedIds = new Set(state.selection.selectedIds);
        if (newSelectedIds.has(rowId)) {
          newSelectedIds.delete(rowId);
        } else {
          newSelectedIds.add(rowId);
        }
        return {
          selection: {
            ...state.selection,
            selectedIds: newSelectedIds,
          },
        };
      }),

    selectAll: (rowIds) =>
      set((state) => {
        const currentPageIds = new Set(rowIds);
        const allSelected = rowIds.every((id) => state.selection.selectedIds.has(id));

        const newSelectedIds = new Set(state.selection.selectedIds);
        if (allSelected) {
          currentPageIds.forEach((id) => newSelectedIds.delete(id));
        } else {
          currentPageIds.forEach((id) => newSelectedIds.add(id));
        }
        return {
          selection: {
            ...state.selection,
            selectedIds: newSelectedIds,
          },
        };
      }),

    clearSelection: () =>
      set({
        selection: {
          selectedIds: new Set<string>(),
          indeterminateIds: new Set<string>(),
        },
      }),

    setScrollTop: (scrollTop) => set({ scrollTop }),
    setScrollLeft: (scrollLeft) => set({ scrollLeft }),

    startDragColumn: (columnId) => set({ draggedColumn: columnId }),

    updateColumnWidth: (columnId, width) =>
      set((state) => {
        const column = state.columns.find((c) => c.id === columnId);
        const minWidth = column?.minWidth ?? 50;
        const finalWidth = Math.max(width, minWidth);
        return {
          columnWidths: {
            ...state.columnWidths,
            [columnId]: finalWidth,
          },
        };
      }),

    endDragColumn: () => set({ draggedColumn: null }),
  }));
};

export type TableStore<T = any> = ReturnType<typeof createTableStore<T>>;
