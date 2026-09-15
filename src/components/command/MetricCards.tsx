'use client';

import { IndianRupee, Radio, Server, Users } from 'lucide-react';
import type { CommandMetricCard } from '@/types/command-center';

const ICONS = {
  revenue: IndianRupee,
  users: Users,
  health: Server,
  posts: Radio,
};

const TONE = {
  ok: 'text-emerald-400 border-emerald-500/20',
  warn: 'text-amber-300 border-amber-500/20',
  error: 'text-red-400 border-red-500/25',
  neutral: 'text-zinc-200 border-zinc-800',
};

export function MetricCards({ metrics }: { metrics: CommandMetricCard[] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((card) => {
        const Icon = ICONS[card.id];
        return (
          <article
            key={card.id}
            className={`rounded-2xl border bg-zinc-950/80 p-4 ${TONE[card.tone]}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">{card.label}</p>
              <Icon className="h-4 w-4 opacity-70" />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{card.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{card.hint}</p>
          </article>
        );
      })}
    </section>
  );
}
