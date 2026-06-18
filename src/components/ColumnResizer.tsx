import React, { useState, useCallback, useRef, useEffect } from 'react';

interface ColumnResizerProps {
  columnId: string;
}

export function ColumnResizer({ columnId }: ColumnResizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const resizerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const headerCell = (e.target as HTMLElement).closest('[style*="width"]') as HTMLElement;
      if (!headerCell) return;

      const computedWidth = headerCell.getBoundingClientRect().width;
      startXRef.current = e.clientX;
      startWidthRef.current = computedWidth;
      setIsDragging(true);

      const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startXRef.current;
        const newWidth = Math.max(50, startWidthRef.current + deltaX);

        const event = new CustomEvent('hp-table:resize-column', {
          detail: { columnId, width: newWidth },
        });
        document.dispatchEvent(event);

        if (resizerRef.current) {
          resizerRef.current.style.position = 'fixed';
          resizerRef.current.style.left = `${moveEvent.clientX}px`;
          resizerRef.current.style.top = '0';
          resizerRef.current.style.height = '100vh';
        }
      };

      const onMouseUp = () => {
        const endEvent = new CustomEvent('hp-table:resize-column-end', {
          detail: { columnId },
        });
        document.dispatchEvent(endEvent);
        setIsDragging(false);
        if (resizerRef.current) {
          resizerRef.current.style.position = '';
          resizerRef.current.style.left = '';
          resizerRef.current.style.top = '';
          resizerRef.current.style.height = '';
        }
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [columnId]
  );

  return (
    <div
      ref={resizerRef}
      onMouseDown={onMouseDown}
      className={`absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-10 ${
        isDragging ? 'bg-blue-500' : ''
      }`}
      style={{ transform: 'translateX(50%)' }}
    />
  );
}
