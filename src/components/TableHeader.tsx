import React, { useRef, useEffect } from 'react';
import { ColumnDef, SortItem } from '../types/table';
import { SortIndicator } from './SortIndicator';
import { FilterButton } from './FilterButton';
import { ColumnResizer } from './ColumnResizer';

interface TableHeaderProps<T> {
  columns: ColumnDef<T>[];
  columnWidths: Record<string, number>;
  sortState: SortItem[];
  scrollLeft: number;
  headerRef?: React.RefObject<HTMLDivElement>;
  onSort: (columnId: string, multiSort: boolean) => void;
  onFilterClick: (columnId: string) => void;
  expandedFilterColumn: string | null;
  enableSelection: boolean;
  selectionColumnWidth: number;
  allSelected: boolean;
  indeterminate: boolean;
  onSelectAll: () => void;
}

export function TableHeader<T extends Record<string, any>>({
  columns,
  columnWidths,
  sortState,
  scrollLeft,
  headerRef,
  onSort,
  onFilterClick,
  expandedFilterColumn,
  enableSelection,
  selectionColumnWidth,
  allSelected,
  indeterminate,
  onSelectAll,
}: TableHeaderProps<T>) {
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (innerRef.current) {
      innerRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollLeft]);

  const leftFixedCols = columns.filter((c) => c.fixed === 'left');
  const rightFixedCols = columns.filter((c) => c.fixed === 'right');
  const scrollableCols = columns.filter((c) => !c.fixed);

  let leftFixedWidth = 0;
  for (const col of leftFixedCols) {
    leftFixedWidth += columnWidths[col.id] ?? col.width;
  }
  if (enableSelection) {
    leftFixedWidth += selectionColumnWidth;
  }

  let rightFixedWidth = 0;
  for (const col of rightFixedCols) {
    rightFixedWidth += columnWidths[col.id] ?? col.width;
  }

  const getSortInfo = (columnId: string) => {
    const idx = sortState.findIndex((s) => s.columnId === columnId);
    if (idx === -1) return null;
    return { direction: sortState[idx].direction, order: idx + 1 };
  };

  const renderCell = (col: ColumnDef<T>) => {
    const width = columnWidths[col.id] ?? col.width;
    const sortInfo = getSortInfo(col.id);
    const isSortable = col.sortable !== false;
    const isFilterable = col.filterable !== false;
    const isExpanded = expandedFilterColumn === col.id;

    return (
      <div
        key={col.id}
        className="flex-shrink-0 flex items-center px-3 py-2 border-b border-r border-slate-200 bg-slate-50 font-medium text-slate-700 text-sm select-none relative"
        style={{ width }}
      >
        <div
          className={`flex items-center gap-1 flex-1 min-w-0 ${isSortable ? 'cursor-pointer hover:text-blue-600' : ''}`}
          onClick={isSortable ? (e) => onSort(col.id, e.shiftKey) : undefined}
        >
          <span className="truncate">{col.title}</span>
          {isSortable && (
            <SortIndicator
              direction={sortInfo?.direction ?? null}
              order={sortInfo?.order}
            />
          )}
        </div>
        {isFilterable && (
          <FilterButton
            active={isExpanded || !!sortInfo}
            onClick={() => onFilterClick(col.id)}
          />
        )}
        <ColumnResizer columnId={col.id} />
      </div>
    );
  };

  const renderSelectionCell = () => (
    <div
      className="flex-shrink-0 flex items-center justify-center border-b border-r border-slate-200 bg-slate-50"
      style={{ width: selectionColumnWidth }}
    >
      <input
        type="checkbox"
        className="w-4 h-4 cursor-pointer accent-blue-600"
        checked={allSelected}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate;
        }}
        onChange={onSelectAll}
      />
    </div>
  );

  const totalScrollableWidth = scrollableCols.reduce(
    (sum, col) => sum + (columnWidths[col.id] ?? col.width),
    0
  );

  return (
    <div
      ref={(el) => {
        (headerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        (innerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      className="flex w-full overflow-hidden border-t border-l border-slate-200 bg-slate-50"
      style={{ position: 'sticky', top: 0, zIndex: 30 }}
    >
      <div className="flex" style={{ position: 'sticky', left: 0, zIndex: 20 }}>
        {enableSelection && renderSelectionCell()}
        {leftFixedCols.map(renderCell)}
      </div>

      <div className="flex overflow-hidden" style={{ flex: 1 }}>
        <div
          className="flex"
          style={{
            transform: `translateX(-${scrollLeft}px)`,
            width: totalScrollableWidth + leftFixedWidth + rightFixedWidth,
          }}
        >
          <div style={{ width: leftFixedWidth, flexShrink: 0 }} />
          {scrollableCols.map(renderCell)}
          <div style={{ width: rightFixedWidth, flexShrink: 0 }} />
        </div>
      </div>

      <div
        className="flex"
        style={{ position: 'sticky', right: 0, zIndex: 20, flexShrink: 0 }}
      >
        {rightFixedCols.map(renderCell)}
      </div>
    </div>
  );
}
