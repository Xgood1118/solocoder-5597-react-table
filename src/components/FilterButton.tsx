import React from 'react';

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
}

export function FilterButton({ active, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`ml-1 p-1 rounded transition-colors ${
        active
          ? 'bg-blue-100 text-blue-600'
          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
      }`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
        />
      </svg>
    </button>
  );
}
