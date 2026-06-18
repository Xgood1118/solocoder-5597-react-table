import React, { useRef } from 'react';
import { ColumnDef } from '../types/table';
import { format } from 'date-fns';

interface TableBodyProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  columnWidths: Record<string, number>;
  startRowIndex: number;
  endRowIndex: number;
  startColIndex: number;
  endColIndex: number;
  rowOffsets: number[];
  rowHeights: number[];
  colOffsets: number[];
  totalHeight: number;
  totalWidth: number;
  scrollLeft: number;
  viewportWidth: number;
  rowIdKey: string;
  enableSelection: boolean;
  selectionColumnWidth: number;
  selectedIds: Set<string>;
  onToggleSelection: (rowId: string) => void;
  measureRowHeight: (rowIndex: number, element: HTMLDivElement | null) => void;
  striped?: boolean;
}

function formatCellValue(value: any, dataType: string): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-300">-</span>;
  }

  switch (dataType) {
    case 'boolean':
      return value ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
          是
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
          否
        </span>
      );
    case 'date': {
      try {
        const d = value instanceof Date ? value : new Date(value);
        if (!isNaN(d.getTime())) {
          return format(d, 'yyyy-MM-dd');
        }
      } catch {
        /* ignore */
      }
      return String(value);
    }
    case 'number':
      return Number(value).toLocaleString('zh-CN');
    default:
      return String(value);
  }
}

export function TableBody<T extends Record<string, any>>({
  data,
  columns,
  columnWidths,
  startRowIndex,
  endRowIndex,
  startColIndex,
  endColIndex,
  rowOffsets,
  rowHeights,
  colOffsets,
  totalHeight,
  totalWidth,
  scrollLeft,
  viewportWidth,
  rowIdKey,
  enableSelection,
  selectionColumnWidth,
  selectedIds,
  onToggleSelection,
  measureRowHeight,
  striped = true,
}: TableBodyProps<T>) {
  const bodyRef = useRef<HTMLDivElement>(null);

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

  const totalScrollableWidth = scrollableCols.reduce(
    (sum, col) => sum + (columnWidths[col.id] ?? col.width),
    0
  );

  const renderRowContent = (
    row: T,
    rowIndex: number,
    cols: ColumnDef<T>[]
  ) => {
    return cols.map((col) => {
      const width = columnWidths[col.id] ?? col.width;
      const value = row[col.id];
      const isSelected = selectedIds.has(row[rowIdKey]);

      return (
        <div
          key={col.id}
          className="flex-shrink-0 flex items-center px-3 py-2 border-b border-r border-slate-200 text-sm text-slate-700 overflow-hidden"
          style={{
            width,
            height: '100%',
            minHeight: 48,
            backgroundColor: isSelected ? '#eff6ff' : undefined,
            boxSizing: 'border-box',
          }}
        >
          <div className="truncate w-full leading-tight">
            {col.render
              ? col.render(row, rowIndex)
              : formatCellValue(value, col.dataType)}
          </div>
        </div>
      );
    });
  };

  const renderSelectionCell = (row: T) => {
    const rowId = row[rowIdKey];
    const isSelected = selectedIds.has(rowId);

    return (
      <div
        className="flex-shrink-0 flex items-center justify-center border-b border-r border-slate-200"
        style={{
          width: selectionColumnWidth,
          height: '100%',
          minHeight: 48,
          boxSizing: 'border-box',
        }}
      >
        <input
          type="checkbox"
          className="w-4 h-4 cursor-pointer accent-blue-600"
          checked={isSelected}
          onChange={() => onToggleSelection(rowId)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  };

  const renderRow = (rowIndex: number) => {
    const row = data[rowIndex];
    if (!row) return null;

    const rowHeight = rowHeights[rowIndex] ?? 48;
    const rowOffset = rowOffsets[rowIndex] ?? rowIndex * 48;
    const rowId = row[rowIdKey];
    const isSelected = selectedIds.has(rowId);
    const isStriped = striped && rowIndex % 2 === 1;
    const rowBg = isSelected
      ? '#eff6ff'
      : isStriped
      ? '#f8fafc'
      : '#ffffff';

    return (
      <div
        key={rowId}
        ref={(el) => measureRowHeight(rowIndex, el)}
        data-row-index={rowIndex}
        className={`absolute left-0 right-0 flex hover:bg-blue-50/40 transition-colors`}
        style={{
          top: rowOffset,
          height: rowHeight,
          backgroundColor: rowBg,
          zIndex: 1,
        }}
      >
        <div
          className="flex"
          style={{
            position: 'sticky',
            left: 0,
            zIndex: 25,
            height: rowHeight,
            flexShrink: 0,
            backgroundColor: rowBg,
            boxShadow: leftFixedCols.length > 0 || enableSelection
              ? '2px 0 8px -2px rgba(0,0,0,0.08)'
              : undefined,
          }}
        >
          {enableSelection && renderSelectionCell(row)}
          {renderRowContent(row, rowIndex, leftFixedCols)}
        </div>

        <div
          className="flex overflow-hidden"
          style={{
            flex: 1,
            height: rowHeight,
            minWidth: 0,
            position: 'relative',
          }}
        >
          <div
            className="flex"
            style={{
              transform: `translateX(-${scrollLeft}px)`,
              width: totalScrollableWidth + leftFixedWidth + rightFixedWidth,
              height: rowHeight,
              flexShrink: 0,
            }}
          >
            <div style={{ width: leftFixedWidth, flexShrink: 0, height: rowHeight }} />
            {renderRowContent(row, rowIndex, scrollableCols)}
            <div style={{ width: rightFixedWidth, flexShrink: 0, height: rowHeight }} />
          </div>
        </div>

        {rightFixedCols.length > 0 && (
          <div
            className="flex"
            style={{
              position: 'sticky',
              right: 0,
              zIndex: 25,
              flexShrink: 0,
              height: rowHeight,
              backgroundColor: rowBg,
              boxShadow: '-2px 0 8px -2px rgba(0,0,0,0.08)',
            }}
          >
            {renderRowContent(row, rowIndex, rightFixedCols)}
          </div>
        )}
      </div>
    );
  };

  const visibleRowIndices: number[] = [];
  for (let i = startRowIndex; i < endRowIndex; i++) {
    if (i < data.length) {
      visibleRowIndices.push(i);
    }
  }

  return (
    <div
      ref={bodyRef}
      className="relative border-l border-slate-200 hp-table-scrollbar"
      style={{
        width: '100%',
        height: totalHeight,
        minHeight: '100%',
        boxSizing: 'border-box',
      }}
    >
      {visibleRowIndices.map(renderRow)}
    </div>
  );
}
