'use client';

import { Check } from 'lucide-react';
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
  const clamped = Math.min(
    Math.max(activeIndex, 0),
    DECONSTRUCT_PROCESS_STEPS.length - 1
  );
  const progress = ((clamped + 1) / DECONSTRUCT_PROCESS_STEPS.length) * 100;

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950/95 p-6 shadow-2xl',
        className
      )}
    >
      <div className="mb-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
          Processing sequence · {clamped + 1} / {DECONSTRUCT_PROCESS_STEPS.length}
        </p>
        <h3 className="mt-2 text-lg font-semibold text-white">
          {liveLabel || DECONSTRUCT_PROCESS_STEPS[clamped]}
        </h3>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-zinc-900">
          <div
            className="h-full rounded-full bg-sky-500/70 transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2.5">
        {DECONSTRUCT_PROCESS_STEPS.map((step, idx) => {
          const done = idx < clamped;
          const active = idx === clamped;
          return (
            <li
              key={step}
              className={cn(
                'flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition',
                active
                  ? 'border-zinc-600 bg-zinc-900 text-white'
                  : done
                    ? 'border-transparent text-zinc-400'
                    : 'border-transparent text-zinc-600'
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]',
                  active && 'border-sky-500/50 bg-sky-500/10 text-sky-300',
                  done && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
                  !active && !done && 'border-zinc-800 text-zinc-600'
                )}
              >
                {done ? <Check className="h-3 w-3" /> : idx + 1}
              </span>
              <span className={cn(active && 'font-medium')}>{step}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
