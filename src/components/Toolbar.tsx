import React, { useState } from 'react';
import { ColumnDef, FilterCondition, SortItem } from '../types/table';
import { FilterPanel } from './FilterPanel';

interface ToolbarProps<T> {
  columns: ColumnDef<T>[];
  sortState: SortItem[];
  filterState: Record<string, FilterCondition>;
  selectedCount: number;
  expandedFilterColumn: string | null;
  onClearSort: () => void;
  onClearFilters: () => void;
  onClearSelection: () => void;
  onSetExpandedFilterColumn: (columnId: string | null) => void;
  onSetFilter: (columnId: string, condition: FilterCondition | null) => void;
  onExportXLSX: () => void;
  onExportCSV: () => void;
}

export function Toolbar<T extends Record<string, any>>({
  columns,
  sortState,
  filterState,
  selectedCount,
  expandedFilterColumn,
  onClearSort,
  onClearFilters,
  onClearSelection,
  onSetExpandedFilterColumn,
  onSetFilter,
  onExportXLSX,
  onExportCSV,
}: ToolbarProps<T>) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const filterCount = Object.keys(filterState).length;

  const expandedColumn = expandedFilterColumn
    ? columns.find((c) => c.id === expandedFilterColumn)
    : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2">
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-sm text-blue-700">
              已选择 <span className="font-semibold">{selectedCount}</span> 项
            </span>
            <button
              onClick={onClearSelection}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline ml-1"
            >
              清除选择
            </button>
          </div>
        )}

        {sortState.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
            <span className="text-sm text-amber-700">
              排序 <span className="font-semibold">{sortState.length}</span> 列
            </span>
            <button
              onClick={onClearSort}
              className="text-xs text-amber-600 hover:text-amber-800 hover:underline ml-1"
            >
              清除排序
            </button>
          </div>
        )}

        {filterCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
            <span className="text-sm text-green-700">
              筛选 <span className="font-semibold">{filterCount}</span> 条件
            </span>
            <button
              onClick={onClearFilters}
              className="text-xs text-green-600 hover:text-green-800 hover:underline ml-1"
            >
              清除筛选
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 relative">
        <div className="relative">
          <button
            onClick={() => setShowExportMenu((v) => !v)}
            onBlur={() => setTimeout(() => setShowExportMenu(false), 200)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            导出
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
              <button
                onClick={onExportXLSX}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                导出 Excel (.xlsx)
              </button>
              <button
                onClick={onExportCSV}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                导出 CSV
              </button>
            </div>
          )}
        </div>

        {expandedColumn && expandedFilterColumn && (
          <FilterPanel
            column={expandedColumn}
            currentFilter={filterState[expandedFilterColumn] ?? null}
            onApply={(condition) => onSetFilter(expandedFilterColumn, condition)}
            onClose={() => onSetExpandedFilterColumn(null)}
          />
        )}
      </div>
    </div>
  );
}
