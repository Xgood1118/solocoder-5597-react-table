import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ColumnDef } from '../types/table';

const ROW_BUFFER = 5;
const COL_BUFFER = 3;
const DEFAULT_ROW_HEIGHT = 48;
const HEADER_HEIGHT = 48;

export interface VirtualScrollResult {
  containerRef: React.RefObject<HTMLDivElement>;
  headerRef: React.RefObject<HTMLDivElement>;
  bodyRef: React.RefObject<HTMLDivElement>;
  startRowIndex: number;
  endRowIndex: number;
  startColIndex: number;
  endColIndex: number;
  rowOffsets: number[];
  rowHeights: number[];
  colOffsets: number[];
  totalHeight: number;
  totalWidth: number;
  viewportHeight: number;
  viewportWidth: number;
  scrollTop: number;
  scrollLeft: number;
  setRowHeight: (index: number, height: number) => void;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  headerHeight: number;
  measureRowHeight: (rowIndex: number, element: HTMLDivElement | null) => void;
}

export function useVirtualScroll<T>(
  data: T[],
  columns: ColumnDef<T>[],
  columnWidths: Record<string, number>,
  estimatedRowHeight: number = DEFAULT_ROW_HEIGHT,
  getRowHeightFn?: (row: T) => number
): VirtualScrollResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);
  const [viewportWidth, setViewportWidth] = useState(1000);

  const rowHeightsRef = useRef<number[]>(
    data.map((row) => (getRowHeightFn ? getRowHeightFn(row) : estimatedRowHeight))
  );
  const [rowHeightsVersion, setRowHeightsVersion] = useState(0);

  const measuredHeightsRef = useRef<Map<number, number>>(new Map());
  const sentinelTopRef = useRef<HTMLDivElement>(null);
  const sentinelBottomRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    rowHeightsRef.current = data.map((row) => {
      if (measuredHeightsRef.current.has(row as any)) {
        return measuredHeightsRef.current.get(row as any)!;
      }
      return getRowHeightFn ? getRowHeightFn(row) : estimatedRowHeight;
    });
    setRowHeightsVersion((v) => v + 1);
  }, [data, estimatedRowHeight, getRowHeightFn]);

  const { rowOffsets, totalHeight } = useMemo(() => {
    const offsets: number[] = [];
    let total = 0;
    for (let i = 0; i < data.length; i++) {
      offsets.push(total);
      total += rowHeightsRef.current[i] || estimatedRowHeight;
    }
    return { rowOffsets: offsets, totalHeight: total };
  }, [data, estimatedRowHeight, rowHeightsVersion]);

  const { colOffsets, totalWidth } = useMemo(() => {
    const offsets: number[] = [];
    let total = 0;
    for (const col of columns) {
      offsets.push(total);
      total += columnWidths[col.id] ?? col.width;
    }
    return { colOffsets: offsets, totalWidth: total };
  }, [columns, columnWidths]);

  const findStartIndex = useCallback(
    (offset: number): number => {
      if (offset <= 0 || data.length === 0) return 0;
      if (offset >= totalHeight) return Math.max(0, data.length - 1);

      let low = 0;
      let high = data.length - 1;
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (rowOffsets[mid] < offset) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      return Math.max(0, low - 1);
    },
    [data.length, totalHeight, rowOffsets]
  );

  const findEndIndex = useCallback(
    (startIdx: number, viewportH: number): number => {
      if (data.length === 0) return 0;
      const startOffset = rowOffsets[startIdx] ?? 0;
      const endOffset = startOffset + viewportH;
      let i = startIdx;
      while (i < data.length && (rowOffsets[i] ?? 0) <= endOffset) {
        i++;
      }
      return Math.min(data.length, i + 1);
    },
    [data.length, rowOffsets]
  );

  const findStartColIndex = useCallback(
    (offset: number): number => {
      if (offset <= 0 || columns.length === 0) return 0;
      let idx = 0;
      let accumulated = 0;
      for (let i = 0; i < columns.length; i++) {
        if (accumulated >= offset) {
          idx = Math.max(0, i - 1);
          break;
        }
        accumulated += columnWidths[columns[i].id] ?? columns[i].width;
        if (i === columns.length - 1) idx = columns.length - 1;
      }
      return idx;
    },
    [columns, columnWidths]
  );

  const findEndColIndex = useCallback(
    (startIdx: number, viewportW: number): number => {
      if (columns.length === 0) return 0;
      const startOffset = colOffsets[startIdx] ?? 0;
      const endOffset = startOffset + viewportW;
      let i = startIdx;
      while (i < columns.length && (colOffsets[i] ?? 0) <= endOffset) {
        i++;
      }
      return Math.min(columns.length, i + 1);
    },
    [columns.length, colOffsets]
  );

  const startRowIndex = Math.max(0, findStartIndex(scrollTop) - ROW_BUFFER);
  const endRowIndex = Math.min(
    data.length,
    findEndIndex(startRowIndex, viewportHeight) + ROW_BUFFER
  );

  const scrollableColumns = columns.filter((c) => !c.fixed);
  const scrollableColStartIdx = useMemo(() => {
    const fixedLeftCount = columns.filter((c) => c.fixed === 'left').length;
    return fixedLeftCount;
  }, [columns]);

  const startColIndexRaw = findStartColIndex(Math.max(0, scrollLeft));
  const startColIndex = Math.max(scrollableColStartIdx, startColIndexRaw - COL_BUFFER);
  const endColIndex = Math.min(
    columns.length,
    findEndColIndex(Math.max(startColIndex, scrollableColStartIdx), viewportWidth) + COL_BUFFER
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setViewportWidth(width);
        setViewportHeight(height);
      }
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const onScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      setScrollTop(target.scrollTop);
      setScrollLeft(target.scrollLeft);

      if (headerRef.current) {
        headerRef.current.scrollLeft = target.scrollLeft;
      }
    },
    []
  );

  const setRowHeight = useCallback((index: number, height: number) => {
    if (rowHeightsRef.current[index] !== height) {
      rowHeightsRef.current[index] = height;
      setRowHeightsVersion((v) => v + 1);
    }
  }, []);

  const measureRowHeight = useCallback(
    (rowIndex: number, element: HTMLDivElement | null) => {
      if (!element) return;
      const height = element.getBoundingClientRect().height;
      if (height > 0 && rowHeightsRef.current[rowIndex] !== height) {
        setRowHeight(rowIndex, height);
      }
    },
    [setRowHeight]
  );

  return {
    containerRef,
    headerRef,
    bodyRef,
    startRowIndex,
    endRowIndex,
    startColIndex,
    endColIndex,
    rowOffsets,
    rowHeights: rowHeightsRef.current,
    colOffsets,
    totalHeight,
    totalWidth,
    viewportHeight,
    viewportWidth,
    scrollTop,
    scrollLeft,
    setRowHeight,
    onScroll,
    headerHeight: HEADER_HEIGHT,
    measureRowHeight,
  };
}

export { DEFAULT_ROW_HEIGHT, HEADER_HEIGHT };
