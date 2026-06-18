export type DataType = 'string' | 'number' | 'date' | 'boolean' | 'enum';

export type FixedPosition = 'left' | 'right' | null;

export type SortDirection = 'asc' | 'desc' | null;

export interface SortItem {
  columnId: string;
  direction: 'asc' | 'desc';
}

export type TextFilterOperator = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'isEmpty';
export type NumberFilterOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'between';
export type DateFilterOperator = 'before' | 'after' | 'between' | 'inLastNDays';
export type BooleanFilterOperator = 'isTrue' | 'isFalse';
export type EnumFilterOperator = 'in' | 'notIn';
export type NullFilterOperator = 'isNull' | 'isNotNull';

export type FilterOperator =
  | TextFilterOperator
  | NumberFilterOperator
  | DateFilterOperator
  | BooleanFilterOperator
  | EnumFilterOperator
  | NullFilterOperator;

export interface FilterCondition {
  operator: FilterOperator;
  value: any;
  value2?: any;
}

export interface ColumnDef<T = any> {
  id: string;
  title: string;
  width: number;
  minWidth?: number;
  dataType: DataType;
  sortable?: boolean;
  filterable?: boolean;
  fixed?: FixedPosition;
  enumValues?: string[];
  render?: (row: T, rowIndex: number) => React.ReactNode;
  booleanTrueFirst?: boolean;
  getRowHeight?: (row: T) => number;
}

export interface PaginationState {
  mode: 'pagination' | 'infinite';
  page: number;
  pageSize: number;
  total: number;
  loadedCount: number;
}

export interface SelectionState {
  selectedIds: Set<string>;
  indeterminateIds: Set<string>;
}

export interface TableState<T = any> {
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
}

export interface VirtualScrollState {
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
}
