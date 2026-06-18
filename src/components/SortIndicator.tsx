import React from 'react';

interface SortIndicatorProps {
  direction: 'asc' | 'desc' | null;
  order?: number;
}

export function SortIndicator({ direction, order }: SortIndicatorProps) {
  return (
    <div className="flex flex-col items-center -space-y-1 ml-1 text-slate-400">
      <svg
        className={`w-3 h-3 transition-colors ${direction === 'asc' ? 'text-blue-600 fill-blue-600' : ''}`}
        viewBox="0 0 12 12"
      >
        <path d="M6 2L2 7h8L6 2z" />
      </svg>
      <svg
        className={`w-3 h-3 transition-colors ${direction === 'desc' ? 'text-blue-600 fill-blue-600' : ''}`}
        viewBox="0 0 12 12"
      >
        <path d="M6 10L10 5H2L6 10z" />
      </svg>
      {order && direction && (
        <span className="text-[10px] text-blue-600 font-semibold leading-none">{order}</span>
      )}
    </div>
  );
}
