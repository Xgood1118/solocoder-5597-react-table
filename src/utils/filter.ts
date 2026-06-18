import { ColumnDef, FilterCondition, FilterOperator } from '../types/table';
import { isBefore, isAfter, differenceInDays, subDays } from 'date-fns';

function getValue(row: any, columnId: string): any {
  return row[columnId];
}

function applyTextFilter(value: any, condition: FilterCondition): boolean {
  const { operator, value: filterValue } = condition;
  const str = value == null ? '' : String(value);
  const filterStr = String(filterValue || '');

  switch (operator as any) {
    case 'contains':
      return str.toLowerCase().includes(filterStr.toLowerCase());
    case 'equals':
      return str === filterStr;
    case 'startsWith':
      return str.toLowerCase().startsWith(filterStr.toLowerCase());
    case 'endsWith':
      return str.toLowerCase().endsWith(filterStr.toLowerCase());
    case 'isEmpty':
      return str === '' || value === null || value === undefined;
    default:
      return true;
  }
}

function applyNumberFilter(value: any, condition: FilterCondition): boolean {
  const { operator, value: filterValue, value2 } = condition;
  if (value === null || value === undefined || value === '') return false;

  const num = Number(value);
  const fv = Number(filterValue);

  switch (operator as any) {
    case 'eq':
      return num === fv;
    case 'neq':
      return num !== fv;
    case 'gt':
      return num > fv;
    case 'lt':
      return num < fv;
    case 'gte':
      return num >= fv;
    case 'lte':
      return num <= fv;
    case 'between':
      return num >= fv && num <= Number(value2);
    default:
      return true;
  }
}

function applyDateFilter(value: any, condition: FilterCondition): boolean {
  const { operator, value: filterValue, value2 } = condition;
  if (value === null || value === undefined || value === '') return false;

  const date = value instanceof Date ? value : new Date(value);

  switch (operator as any) {
    case 'before': {
      const target = filterValue instanceof Date ? filterValue : new Date(filterValue);
      return isBefore(date, target);
    }
    case 'after': {
      const target = filterValue instanceof Date ? filterValue : new Date(filterValue);
      return isAfter(date, target);
    }
    case 'between': {
      const start = filterValue instanceof Date ? filterValue : new Date(filterValue);
      const end = value2 instanceof Date ? value2 : new Date(value2);
      return !isBefore(date, start) && !isAfter(date, end);
    }
    case 'inLastNDays': {
      const days = Number(filterValue);
      const threshold = subDays(new Date(), days);
      return !isBefore(date, threshold);
    }
    default:
      return true;
  }
}

function applyBooleanFilter(value: any, condition: FilterCondition): boolean {
  const { operator } = condition;
  const bool = Boolean(value);

  switch (operator as any) {
    case 'isTrue':
      return bool === true;
    case 'isFalse':
      return bool === false;
    default:
      return true;
  }
}

function applyEnumFilter(value: any, condition: FilterCondition): boolean {
  const { operator, value: filterValue } = condition;
  const values = Array.isArray(filterValue) ? filterValue : [filterValue];
  const str = String(value);

  switch (operator as any) {
    case 'in':
      return values.includes(str);
    case 'notIn':
      return !values.includes(str);
    default:
      return true;
  }
}

function applyNullFilter(value: any, condition: FilterCondition): boolean {
  const { operator } = condition;
  const isNull = value === null || value === undefined || value === '';

  switch (operator as any) {
    case 'isNull':
      return isNull;
    case 'isNotNull':
      return !isNull;
    default:
      return true;
  }
}

export function applyFilter<T>(
  row: T,
  column: ColumnDef<T>,
  condition: FilterCondition
): boolean {
  const value = getValue(row, column.id);
  const { operator } = condition;

  const textOperators: FilterOperator[] = ['contains', 'equals', 'startsWith', 'endsWith', 'isEmpty'];
  const numberOperators: FilterOperator[] = ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'between'];
  const dateOperators: FilterOperator[] = ['before', 'after', 'between', 'inLastNDays'];
  const boolOperators: FilterOperator[] = ['isTrue', 'isFalse'];
  const enumOperators: FilterOperator[] = ['in', 'notIn'];
  const nullOperators: FilterOperator[] = ['isNull', 'isNotNull'];

  if (nullOperators.includes(operator)) {
    return applyNullFilter(value, condition);
  }
  if (textOperators.includes(operator)) {
    return applyTextFilter(value, condition);
  }
  if (numberOperators.includes(operator)) {
    return applyNumberFilter(value, condition);
  }
  if (dateOperators.includes(operator)) {
    return applyDateFilter(value, condition);
  }
  if (boolOperators.includes(operator)) {
    return applyBooleanFilter(value, condition);
  }
  if (enumOperators.includes(operator)) {
    return applyEnumFilter(value, condition);
  }

  return true;
}

export function filterData<T>(
  data: T[],
  columns: ColumnDef<T>[],
  filterState: Record<string, FilterCondition>
): T[] {
  if (Object.keys(filterState).length === 0) return data;

  return data.filter((row) => {
    for (const [columnId, condition] of Object.entries(filterState)) {
      const column = columns.find((col) => col.id === columnId);
      if (!column) continue;
      if (!applyFilter(row, column, condition)) {
        return false;
      }
    }
    return true;
  });
}

export const operatorLabels: Record<FilterOperator, string> = {
  contains: '包含',
  equals: '等于',
  startsWith: '开头是',
  endsWith: '结尾是',
  isEmpty: '为空',
  eq: '=',
  neq: '≠',
  gt: '>',
  lt: '<',
  gte: '≥',
  lte: '≤',
  between: '在...之间',
  before: '之前',
  after: '之后',
  inLastNDays: '最近N天',
  isTrue: '是',
  isFalse: '否',
  in: '在列表中',
  notIn: '不在列表中',
  isNull: '为空',
  isNotNull: '不为空',
};

export function getOperatorsForDataType(dataType: string): FilterOperator[] {
  const baseNull: FilterOperator[] = ['isNull', 'isNotNull'];

  switch (dataType) {
    case 'string':
      return ['contains', 'equals', 'startsWith', 'endsWith', 'isEmpty', ...baseNull];
    case 'number':
      return ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'between', ...baseNull];
    case 'date':
      return ['before', 'after', 'between', 'inLastNDays', ...baseNull];
    case 'boolean':
      return ['isTrue', 'isFalse', ...baseNull];
    case 'enum':
      return ['in', 'notIn', ...baseNull];
    default:
      return baseNull;
  }
}
