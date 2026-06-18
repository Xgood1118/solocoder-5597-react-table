import React, { useState, useEffect, useRef } from 'react';
import { ColumnDef, FilterCondition, FilterOperator } from '../types/table';
import { getOperatorsForDataType, operatorLabels } from '../utils/filter';

interface FilterPanelProps<T> {
  column: ColumnDef<T>;
  currentFilter: FilterCondition | null;
  onApply: (condition: FilterCondition | null) => void;
  onClose: () => void;
}

export function FilterPanel<T extends Record<string, any>>({
  column,
  currentFilter,
  onApply,
  onClose,
}: FilterPanelProps<T>) {
  const operators = getOperatorsForDataType(column.dataType);
  const [operator, setOperator] = useState<FilterOperator>(
    currentFilter?.operator ?? operators[0]
  );
  const [value, setValue] = useState<any>(currentFilter?.value ?? '');
  const [value2, setValue2] = useState<any>(currentFilter?.value2 ?? '');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    setOperator(currentFilter?.operator ?? operators[0]);
    setValue(currentFilter?.value ?? '');
    setValue2(currentFilter?.value2 ?? '');
  }, [currentFilter, operators]);

  const needsValue2 = operator === 'between';

  const handleApply = () => {
    if (
      operator === 'isEmpty' ||
      operator === 'isNull' ||
      operator === 'isNotNull' ||
      operator === 'isTrue' ||
      operator === 'isFalse'
    ) {
      onApply({ operator, value: null });
    } else if (needsValue2) {
      onApply({ operator, value, value2 });
    } else if (value !== '' && value !== null && value !== undefined) {
      onApply({ operator, value });
    } else {
      onApply(null);
    }
    onClose();
  };

  const handleClear = () => {
    onApply(null);
    setValue('');
    setValue2('');
    setOperator(operators[0]);
    onClose();
  };

  const renderValueInput = (val: any, onChange: (v: any) => void, placeholder = '') => {
    switch (column.dataType) {
      case 'number':
        return (
          <input
            type="number"
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={val}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={placeholder}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={val}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        );
      case 'enum':
        return (
          <select
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={val}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">请选择</option>
            {column.enumValues?.map((ev) => (
              <option key={ev} value={ev}>
                {ev}
              </option>
            ))}
          </select>
        );
      case 'boolean':
        return null;
      default:
        if (operator === 'in' || operator === 'notIn') {
          return (
            <input
              type="text"
              className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={Array.isArray(val) ? val.join(',') : val}
              onChange={(e) =>
                onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))
              }
              placeholder="多个值用逗号分隔"
            />
          );
        }
        return (
          <input
            type="text"
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={val}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        );
    }
  };

  const hideValueInputs =
    operator === 'isEmpty' ||
    operator === 'isNull' ||
    operator === 'isNotNull' ||
    operator === 'isTrue' ||
    operator === 'isFalse';

  return (
    <div
      ref={panelRef}
      className="absolute z-50 top-full mt-1 right-0 bg-white rounded-lg shadow-xl border border-slate-200 p-3 w-64"
      style={{ minWidth: '240px' }}
    >
      <div className="mb-3">
        <label className="block text-xs font-medium text-slate-600 mb-1">操作符</label>
        <select
          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={operator}
          onChange={(e) => setOperator(e.target.value as FilterOperator)}
        >
          {operators.map((op) => (
            <option key={op} value={op}>
              {operatorLabels[op]}
            </option>
          ))}
        </select>
      </div>

      {!hideValueInputs && (
        <>
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {needsValue2 ? '起始值' : '值'}
            </label>
            {renderValueInput(value, setValue)}
          </div>
          {needsValue2 && (
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">结束值</label>
              {renderValueInput(value2, setValue2)}
            </div>
          )}
          {operator === 'inLastNDays' && (
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">天数 N</label>
              <input
                type="number"
                className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={value}
                onChange={(e) =>
                  setValue(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="输入天数"
              />
            </div>
          )}
        </>
      )}

      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={handleClear}
          className="flex-1 px-3 py-1.5 text-sm text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
        >
          清除
        </button>
        <button
          onClick={handleApply}
          className="flex-1 px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
        >
          确定
        </button>
      </div>
    </div>
  );
}
