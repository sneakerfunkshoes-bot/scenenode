'use client';

import { NLE_LIST } from '@/lib/breakdown-mock';
import type { NleSoftware } from '@/types/breakdown';
import { cn } from '@/lib/utils';

const SHORT_LABEL: Record<NleSoftware, string> = {
  'DaVinci Resolve': 'Resolve',
  'Premiere Pro': 'Premiere',
  'After Effects': 'AE',
  CapCut: 'CapCut',
  'VN Editor': 'VN',
};

interface NleSelectorCompactProps {
  value: NleSoftware;
  onChange: (nle: NleSoftware) => void;
  className?: string;
  label?: string;
}

export function NleSelectorCompact({
  value,
  onChange,
  className,
  label = 'Recreate in',
}: NleSelectorCompactProps) {
  return (
    <div className={cn('w-full min-w-0', className)}>
      {label ? (
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
          {label}
        </p>
      ) : null}
      <div
        className="-mx-0.5 flex max-w-full gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="Select editing software"
      >
        {NLE_LIST.map((tool) => {
          const active = value === tool;
          return (
            <button
              key={tool}
              type="button"
              onClick={() => onChange(tool)}
              aria-pressed={active}
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium transition sm:px-3 sm:py-1.5 sm:text-[11px]',
                active
                  ? 'border-zinc-500 bg-zinc-900 text-white'
                  : 'border-zinc-800/90 bg-transparent text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
              )}
            >
              <span className="sm:hidden">{SHORT_LABEL[tool]}</span>
              <span className="hidden sm:inline">{tool}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
