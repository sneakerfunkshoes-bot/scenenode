'use client';

import { Check, Loader2 } from 'lucide-react';
import { DECONSTRUCT_PROCESS_STEPS } from '@/lib/deconstruct-stages';
import { cn } from '@/lib/utils';

interface ProcessingSequenceProps {
  /** 0-based active step index */
  activeIndex: number;
  liveLabel?: string | null;
  className?: string;
}

export function ProcessingSequence({
  activeIndex,
  liveLabel,
  className,
}: ProcessingSequenceProps) {
  const total = DECONSTRUCT_PROCESS_STEPS.length;
  const clamped = Math.min(Math.max(activeIndex, 0), total - 1);
  const progress = ((clamped + 1) / total) * 100;

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950/95 p-5 shadow-2xl sm:p-6',
        className
      )}
    >
      <div className="mb-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
          Step {clamped + 1} of {total}
        </p>
        <h3 className="mt-2 text-lg font-semibold text-white">
          {liveLabel || DECONSTRUCT_PROCESS_STEPS[clamped]}
        </h3>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-900">
          <div
            className="h-full rounded-full bg-sky-500 transition-[width] duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {DECONSTRUCT_PROCESS_STEPS.map((step, idx) => {
          const done = idx < clamped;
          const active = idx === clamped;
          return (
            <li
              key={step}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition',
                active
                  ? 'border-zinc-600 bg-zinc-900 text-white'
                  : done
                    ? 'border-transparent text-zinc-400'
                    : 'border-transparent text-zinc-600'
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]',
                  active && 'text-sky-300',
                  done && 'text-emerald-400',
                  !active && !done && 'text-zinc-600'
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : active ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                )}
              </span>
              <span className={cn('min-w-0 flex-1 leading-snug', active && 'font-medium')}>
                {step}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
