import React from 'react';

interface SkeletonLoaderProps {
  columns: number;
  rows?: number;
  headerHeight?: number;
  rowHeight?: number;
}

export function SkeletonLoader({
  columns,
  rows = 10,
  headerHeight = 48,
  rowHeight = 48,
}: SkeletonLoaderProps) {
  return (
    <div className="w-full overflow-hidden">
      <div
        className="flex border-t border-l border-slate-200"
        style={{ height: headerHeight }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={`header-${i}`}
            className="flex-shrink-0 border-b border-r border-slate-200 p-2"
            style={{ width: `${100 / columns}%` }}
          >
            <div className="hp-skeleton h-4 w-3/4 rounded" />
          </div>
        ))}
      </div>

      <div className="border-l border-slate-200">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={`row-${rowIdx}`}
            className="flex border-b border-slate-200"
            style={{ height: rowHeight }}
          >
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div
                key={`cell-${rowIdx}-${colIdx}`}
                className="flex-shrink-0 border-r border-slate-200 p-3"
                style={{ width: `${100 / columns}%` }}
              >
                <div
                  className="hp-skeleton h-3 rounded"
                  style={{
                    width: `${60 + Math.random() * 30}%`,
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
