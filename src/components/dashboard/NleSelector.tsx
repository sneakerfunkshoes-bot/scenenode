'use client';

import { motion } from 'framer-motion';
import { useBreakdown } from '@/context/BreakdownContext';
import { NLE_LIST } from '@/lib/breakdown-mock';
import type { NleSoftware } from '@/types/breakdown';
import { cn } from '@/lib/utils';

export function NleSelector() {
  const { nle, setNle } = useBreakdown();

  return (
    <div className="relative flex flex-wrap items-center justify-start gap-2 text-xs">
      <div className="relative flex flex-wrap gap-2">
        {NLE_LIST.map((tool) => {
          const active = nle === tool;
          return (
            <button
              key={tool}
              type="button"
              onClick={() => setNle(tool as NleSoftware)}
              className={cn(
                'relative rounded-lg px-3 py-1 text-xs transition-colors',
                active ? 'font-medium text-white' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {active && (
                <motion.span
                  layoutId="nle-active-pill"
                  className="absolute inset-0 rounded-lg border border-zinc-700 bg-zinc-800"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative z-10">{tool}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
