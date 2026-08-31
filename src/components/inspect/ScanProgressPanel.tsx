'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { SCAN_PROGRESS_STEPS } from '@/lib/scan-progress';
import { cn } from '@/lib/utils';

interface ScanProgressPanelProps {
  variant?: 'inspect' | 'dashboard';
  liveLabel?: string | null;
}

export function ScanProgressPanel({
  variant = 'inspect',
  liveLabel,
}: ScanProgressPanelProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentStepIndex((prev) =>
        prev < SCAN_PROGRESS_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 1800);
    return () => window.clearInterval(interval);
  }, []);

  const inspect = variant === 'inspect';
  const headline = liveLabel ?? SCAN_PROGRESS_STEPS[currentStepIndex];

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-xl space-y-6 rounded-2xl border p-6',
        inspect
          ? 'border-zinc-700 bg-zinc-950'
          : 'border-zinc-800 bg-zinc-950 shadow-xl'
      )}
    >
      <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full border',
            inspect
              ? 'border-zinc-600 bg-zinc-900'
              : 'border-zinc-700 bg-zinc-900'
          )}
        >
          <Loader2
            className={cn(
              'h-6 w-6 animate-spin',
              inspect ? 'text-zinc-400' : 'text-zinc-200'
            )}
          />
        </div>
      </div>

      <div className="space-y-2 text-center">
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-widest',
            inspect ? 'font-mono text-zinc-400' : 'font-mono text-zinc-400'
          )}
        >
          Processing Sequence ({currentStepIndex + 1} / {SCAN_PROGRESS_STEPS.length})
        </span>
        <h3 className="text-base font-bold text-white transition-all duration-300">
          {headline}
        </h3>
      </div>

      <div
        className={cn(
          'max-h-40 space-y-2 overflow-hidden rounded-xl border p-3 text-left',
          inspect ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-800 bg-zinc-900/80'
        )}
      >
        {SCAN_PROGRESS_STEPS.map((step, idx) => (
          <div
            key={step}
            className={cn(
              'flex items-center gap-2 font-mono text-xs transition-all duration-300',
              idx === currentStepIndex
                ? inspect
                  ? 'translate-x-1 font-bold text-zinc-300'
                  : 'translate-x-1 font-bold text-zinc-100'
                : idx < currentStepIndex
                  ? 'text-zinc-500 line-through'
                  : 'text-zinc-600 opacity-40'
            )}
          >
            {idx < currentStepIndex ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            ) : idx === currentStepIndex ? (
              <Loader2
                className={cn(
                  'h-3.5 w-3.5 shrink-0 animate-spin',
                  inspect ? 'text-zinc-400' : 'text-zinc-300'
                )}
              />
            ) : (
              <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-zinc-700" />
            )}
            <span className="truncate">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
