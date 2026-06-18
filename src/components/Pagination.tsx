import React from 'react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  mode: 'pagination' | 'infinite';
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onModeChange: (mode: 'pagination' | 'infinite') => void;
}

const PAGE_SIZES = [20, 50, 100, 200, 500];

export function Pagination({
  page,
  pageSize,
  total,
  mode,
  onPageChange,
  onPageSizeChange,
  onModeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(total, page * pageSize);

  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (page > 3) pages.push('...');

    const start = Math.max(2, page - 2);
    const end = Math.min(totalPages - 1, page + 2);

    for (let i = start; i <= end; i++) pages.push(i);

    if (page < totalPages - 3) pages.push('...');

    pages.push(totalPages);

    return pages;
  };

  const PageButton = ({
    pageNum,
    active,
    disabled,
    onClick,
    children,
  }: {
    pageNum?: number;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[32px] h-8 px-2 rounded text-sm transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : disabled
          ? 'text-slate-300 cursor-not-allowed'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-t border-slate-200 bg-white">
      <div className="flex items-center gap-4 text-sm text-slate-600">
        <span>
          共 <span className="font-semibold text-slate-800">{total.toLocaleString()}</span> 条
        </span>
        {mode === 'pagination' && (
          <span>
            显示 <span className="font-semibold">{startItem}</span> -{' '}
            <span className="font-semibold">{endItem}</span>
          </span>
        )}

        <div className="flex items-center gap-2">
          <label className="text-slate-500">每页</label>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 px-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} 条
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 border border-slate-300 rounded overflow-hidden">
          <button
            onClick={() => onModeChange('pagination')}
            className={`h-8 px-3 text-sm transition-colors ${
              mode === 'pagination'
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            分页
          </button>
          <button
            onClick={() => onModeChange('infinite')}
            className={`h-8 px-3 text-sm transition-colors ${
              mode === 'infinite'
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            无限滚动
          </button>
        </div>
      </div>

      {mode === 'pagination' && (
        <div className="flex items-center gap-1">
          <PageButton
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
          >
            «
          </PageButton>
          <PageButton
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            ‹
          </PageButton>

          {getPageNumbers().map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
                ...
              </span>
            ) : (
              <PageButton
                key={p}
                pageNum={p}
                active={p === page}
                onClick={() => onPageChange(p)}
              >
                {p}
              </PageButton>
            )
          )}

          <PageButton
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            ›
          </PageButton>
          <PageButton
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
          >
            »
          </PageButton>
        </div>
      )}
    </div>
  );
}
