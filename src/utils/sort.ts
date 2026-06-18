import { ColumnDef, SortItem } from '../types/table';

function getCompareValue<T>(row: T, column: ColumnDef<T>): any {
  const value = (row as any)[column.id];
  return value;
}

function compareValues<T>(
  a: T,
  b: T,
  column: ColumnDef<T>,
  direction: 'asc' | 'desc'
): number {
  const valA = getCompareValue(a, column);
  const valB = getCompareValue(b, column);

  if (valA === null || valA === undefined) {
    if (valB === null || valB === undefined) return 0;
    return direction === 'asc' ? 1 : -1;
  }
  if (valB === null || valB === undefined) {
    return direction === 'asc' ? -1 : 1;
  }

  let result = 0;

  switch (column.dataType) {
    case 'number': {
      const numA = Number(valA);
      const numB = Number(valB);
      result = numA - numB;
      break;
    }
    case 'string': {
      result = String(valA).localeCompare(String(valB), 'zh-CN', {
        sensitivity: 'accent',
        numeric: true,
      });
      break;
    }
    case 'date': {
      const dateA = valA instanceof Date ? valA.getTime() : new Date(valA).getTime();
      const dateB = valB instanceof Date ? valB.getTime() : new Date(valB).getTime();
      result = dateA - dateB;
      break;
    }
    case 'boolean': {
      const boolA = Boolean(valA);
      const boolB = Boolean(valB);
      if (boolA === boolB) {
        result = 0;
      } else if (column.booleanTrueFirst !== false) {
        result = boolA ? -1 : 1;
      } else {
        result = boolA ? 1 : -1;
      }
      break;
    }
    case 'enum': {
      const enumA = column.enumValues?.indexOf(String(valA)) ?? -1;
      const enumB = column.enumValues?.indexOf(String(valB)) ?? -1;
      if (enumA === -1 && enumB === -1) {
        result = String(valA).localeCompare(String(valB));
      } else {
        result = enumA - enumB;
      }
      break;
    }
    default:
      result = String(valA).localeCompare(String(valB));
  }

  return direction === 'asc' ? result : -result;
}

export function sortData<T>(
  data: T[],
  columns: ColumnDef<T>[],
  sortState: SortItem[]
): T[] {
  if (sortState.length === 0) return data;

  const sortedData = [...data];
  sortedData.sort((a, b) => {
    for (const sortItem of sortState) {
      const column = columns.find((col) => col.id === sortItem.columnId);
      if (!column) continue;

      const result = compareValues(a, b, column, sortItem.direction);
      if (result !== 0) return result;
    }
    return 0;
  });

  return sortedData;
}

export function toggleSortState(
  sortState: SortItem[],
  columnId: string,
  multiSort: boolean
): SortItem[] {
  const existingIndex = sortState.findIndex((s) => s.columnId === columnId);

  if (!multiSort) {
    if (existingIndex === -1) {
      return [{ columnId, direction: 'asc' }];
    }
    const existing = sortState[existingIndex];
    if (existing.direction === 'asc') {
      return [{ columnId, direction: 'desc' }];
    }
    if (existing.direction === 'desc') {
      return [];
    }
    return [{ columnId, direction: 'asc' }];
  }

  if (existingIndex === -1) {
    return [...sortState, { columnId, direction: 'asc' }];
  }

  const existing = sortState[existingIndex];
  const newState = [...sortState];

  if (existing.direction === 'asc') {
    newState[existingIndex] = { columnId, direction: 'desc' };
  } else if (existing.direction === 'desc') {
    newState.splice(existingIndex, 1);
  } else {
    newState[existingIndex] = { columnId, direction: 'asc' };
  }

  return newState;
}
