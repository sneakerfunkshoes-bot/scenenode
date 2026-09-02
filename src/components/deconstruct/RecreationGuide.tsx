'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecreationStepView } from '@/lib/deconstruct-view-model';

interface RecreationGuideProps {
  steps: RecreationStepView[];
  activeStepOrder: number;
  highlightedEffectId?: string | null;
  onFocusStep?: (step: RecreationStepView) => void;
  onActiveStepChange?: (order: number) => void;
  footerTop?: ReactNode;
  title?: string;
  className?: string;
}

export function RecreationGuide({
  steps,
  activeStepOrder,
  highlightedEffectId,
  onFocusStep,
  onActiveStepChange,
  footerTop,
  title = 'Recreation Guide',
  className,
}: RecreationGuideProps) {
  const [open, setOpen] = useState(activeStepOrder);

  useEffect(() => {
    setOpen(activeStepOrder);
  }, [activeStepOrder]);

  const active = steps.find((s) => s.order === activeStepOrder) ?? steps[0];
  const prev = steps.find((s) => s.order === (active?.order ?? 1) - 1);
  const next = steps.find((s) => s.order === (active?.order ?? 0) + 1);
  const progress = steps.length ? (activeStepOrder / steps.length) * 100 : 0;

  const goTo = (step: RecreationStepView) => {
    onActiveStepChange?.(step.order);
    onFocusStep?.(step);
    setOpen(step.order);
  };

  return (
    <aside
      className={cn(
        'recreation-guide flex h-full min-h-0 w-full min-w-0 flex-col rounded-xl bg-zinc-900/35',
        className
      )}
    >
      <div className="shrink-0 border-b border-zinc-800/50 px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {title}
          </h3>
          <span className="font-mono text-[10px] text-zinc-600">
            Step {active?.order ?? 1} of {steps.length}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-zinc-800/80">
          <div
            className="h-full rounded-full bg-sky-400/70 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="recreation-guide-steps min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {steps.map((step) => {
          const isActive = step.order === activeStepOrder;
          const isOpen = open === step.order && isActive;
          const done = step.order < activeStepOrder;
          const linked = Boolean(
            highlightedEffectId && step.effectId === highlightedEffectId
          );

          return (
            <div
              key={step.order}
              className={cn(
                'rounded-xl transition duration-200',
                isActive && 'bg-sky-500/[0.07] ring-1 ring-inset ring-sky-500/25',
                linked && !isActive && 'ring-1 ring-inset ring-zinc-600/40'
              )}
            >
              <button
                type="button"
                onClick={() => goTo(step)}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2.5 text-left',
                  isActive && 'border-l-2 border-sky-400/70'
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px]',
                    done && 'bg-emerald-500/15 text-emerald-400',
                    isActive && 'bg-sky-500/20 text-sky-200',
                    !done && !isActive && 'text-zinc-500'
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : String(step.order).padStart(2, '0')}
                </span>
                <span
                  className={cn(
                    'flex-1 text-[11px] font-medium uppercase tracking-wide',
                    isActive ? 'text-white' : 'text-zinc-500'
                  )}
                >
                  {step.title}
                </span>
                {isActive ? <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" /> : null}
              </button>
              {isOpen ? (
                <ol className="space-y-1.5 px-3 pb-3 pl-11">
                  {step.bullets.map((b, i) => (
                    <li
                      key={b}
                      className="flex gap-2 text-[12px] leading-relaxed text-zinc-400"
                    >
                      <span className="font-mono text-[10px] text-zinc-600">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="recreation-guide-footer sticky bottom-0 shrink-0 border-t border-zinc-800/60 bg-zinc-950/90 p-3 backdrop-blur-sm">
        {footerTop ? <div className="relative mb-2">{footerTop}</div> : null}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!prev}
            onClick={() => prev && goTo(prev)}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-800 py-2 text-xs text-zinc-400 transition hover:bg-zinc-900 disabled:opacity-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <button
            type="button"
            disabled={!next}
            onClick={() => next && goTo(next)}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-white py-2 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-30"
          >
            Next Step
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
