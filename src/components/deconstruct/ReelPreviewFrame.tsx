'use client';

import { cn } from '@/lib/utils';

interface ReelPreviewFrameProps {
  children: React.ReactNode;
  className?: string;
  /** Tailwind max-width class, e.g. max-w-[320px] */
  maxWidthClass?: string;
}

/** Stable 9:16 reel frame — avoids iOS flex + aspect-ratio collapse on mobile. */
export function ReelPreviewFrame({
  children,
  className,
  maxWidthClass = 'max-w-[320px]',
}: ReelPreviewFrameProps) {
  return (
    <div className={cn('relative mx-auto w-full shrink-0', maxWidthClass, className)}>
      <div className="relative aspect-[9/16] w-full min-h-[220px] overflow-hidden rounded-xl bg-black ring-1 ring-zinc-800/80 sm:min-h-[260px]">
        {children}
      </div>
    </div>
  );
}
