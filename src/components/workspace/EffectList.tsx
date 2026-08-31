'use client';

import type { EffectMarker, EffectType } from '@/types';
import { formatTimestamp, cn } from '@/lib/utils';
import { Zap, Scissors, Flashlight, Blend } from 'lucide-react';

const TYPE_META: Record<
  EffectType,
  { icon: typeof Zap; tone: string }
> = {
  SFX: { icon: Zap, tone: 'text-silver border-silver/30 bg-silver/10' },
  Cut: { icon: Scissors, tone: 'text-silver-muted border-silver/20 bg-silver/5' },
  Flash: { icon: Flashlight, tone: 'text-silver border-silver/40 bg-silver/15' },
  Transition: { icon: Blend, tone: 'text-silver-muted border-silver/25 bg-obsidian-300' },
};

interface EffectListProps {
  effects: EffectMarker[];
}

export function EffectList({ effects }: EffectListProps) {
  return (
    <div className="glass-panel flex min-h-0 flex-1 flex-col rounded-md">
      <div className="flex items-center justify-between border-b border-silver/10 px-4 py-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver-dim">
          Effect Map
        </h3>
        <span className="font-mono text-[10px] text-silver-dim">
          {effects.length} markers
        </span>
      </div>
      <ul className="flex-1 overflow-y-auto divide-y divide-silver/5">
        {effects.map((effect) => {
          const meta = TYPE_META[effect.type];
          const Icon = meta.icon;
          return (
            <li
              key={effect.id}
              className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-silver/[0.04]"
            >
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide',
                  meta.tone
                )}
              >
                <Icon size={11} />
                {effect.type}
              </span>
              <span className="flex-1 truncate font-body text-sm text-silver-muted">
                {effect.label}
              </span>
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-silver">
                {formatTimestamp(effect.timestamp)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
