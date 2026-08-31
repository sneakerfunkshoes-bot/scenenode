'use client';

import { useMemo, useState } from 'react';
import { useBreakdown } from '@/context/BreakdownContext';
import type { EffectKind } from '@/types/breakdown';
import { formatTimestamp, cn } from '@/lib/utils';

type Tab = 'all' | EffectKind;

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'CC', label: 'CC' },
  { id: 'Rotation', label: 'Rotation' },
  { id: 'Stutter', label: 'Stutters' },
  { id: 'Transition', label: 'Transitions' },
  { id: 'Flash', label: 'Flash' },
  { id: 'Overlay', label: 'Overlays' },
];

export function BreakdownTabs() {
  const { breakdown, selectedEffectId, setSelectedEffectId, setCurrentTime } =
    useBreakdown();
  const [tab, setTab] = useState<Tab>('all');

  const items = useMemo(() => {
    if (!breakdown) return [];
    if (tab === 'all') return breakdown.effects;
    return breakdown.effects.filter((e) => e.type === tab);
  }, [breakdown, tab]);

  if (!breakdown) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-800/80 bg-zinc-950 p-4">
      <div className="flex gap-2 overflow-x-auto border-b border-zinc-800/80 pb-2 text-xs">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'whitespace-nowrap rounded-lg px-3 py-1 transition',
              tab === id
                ? 'border border-zinc-700 bg-zinc-800 font-medium text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {items.map((effect) => (
          <button
            key={effect.id}
            type="button"
            onClick={() => {
              setSelectedEffectId(effect.id);
              setCurrentTime(effect.timestamp);
            }}
            className={cn(
              'flex w-full cursor-pointer items-center justify-between rounded-xl border p-3 text-left text-xs transition',
              selectedEffectId === effect.id
                ? 'border-zinc-700 bg-zinc-900 text-white shadow-md'
                : 'border-zinc-800/60 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
            )}
          >
            <div className="space-y-1">
              <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-mono text-[9px] text-zinc-300">
                {effect.type.toUpperCase()}
              </span>
              <p className="line-clamp-1 font-medium text-zinc-200">{effect.description}</p>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-zinc-500">
              {formatTimestamp(effect.timestamp)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
