'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ResizeHandleProps {
  onDrag: (deltaX: number) => void;
  className?: string;
}

export function ResizeHandle({ onDrag, className }: ResizeHandleProps) {
  const dragging = useRef(false);
  const lastX = useRef(0);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    lastX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return;
      const delta = e.clientX - lastX.current;
      lastX.current = e.clientX;
      if (delta !== 0) onDrag(delta);
    },
    [onDrag]
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={cn(
        'group relative z-20 w-1 shrink-0 cursor-col-resize bg-transparent',
        'hover:bg-[#C0C0C0]/25 active:bg-[#C0C0C0]/40',
        className
      )}
    >
      <div className="absolute inset-y-0 -left-1 -right-1" />
      <div className="absolute inset-y-0 left-0 w-px bg-[#C0C0C0]/12 transition group-hover:bg-[#C0C0C0]/40" />
    </div>
  );
}

interface UseResizablePanelsOptions {
  leftDefault?: number;
  rightDefault?: number;
  leftMin?: number;
  leftMax?: number;
  rightMin?: number;
  rightMax?: number;
}

export function useResizablePanels({
  leftDefault = 240,
  rightDefault = 320,
  leftMin = 180,
  leftMax = 420,
  rightMin = 260,
  rightMax = 480,
}: UseResizablePanelsOptions = {}) {
  const [leftWidth, setLeftWidth] = useState(leftDefault);
  const [rightWidth, setRightWidth] = useState(rightDefault);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 900) {
        setLeftWidth((w) => Math.min(w, 200));
        setRightWidth((w) => Math.min(w, 280));
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onLeftDrag = useCallback(
    (delta: number) => {
      setLeftWidth((w) => Math.min(leftMax, Math.max(leftMin, w + delta)));
    },
    [leftMin, leftMax]
  );

  const onRightDrag = useCallback(
    (delta: number) => {
      // Dragging the right handle: moving right shrinks the right panel
      setRightWidth((w) => Math.min(rightMax, Math.max(rightMin, w - delta)));
    },
    [rightMin, rightMax]
  );

  return { leftWidth, rightWidth, onLeftDrag, onRightDrag };
}
