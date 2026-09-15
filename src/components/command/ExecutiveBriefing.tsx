'use client';

import Link from 'next/link';
import { Sparkles, RefreshCw } from 'lucide-react';
import type { ExecutiveBriefing } from '@/types/command-center';

export function ExecutiveBriefingCard({
  briefing,
  refreshing,
  onRefresh,
}: {
  briefing: ExecutiveBriefing;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-zinc-950 to-zinc-950 p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10">
            <Sparkles className="h-4 w-4 text-emerald-300" />
          </span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-400/80">
              AI Executive Briefing
            </p>
            <p className="text-xs text-zinc-500">
              {briefing.source === 'gemini' ? 'Gemini morning brief' : 'Heuristic ops digest'} ·{' '}
              {new Date(briefing.generatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-emerald-500/40 hover:text-emerald-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Writing brief…' : 'Regenerate'}
        </button>
      </div>
      <p className="relative mt-4 max-w-4xl text-sm leading-relaxed text-zinc-100 sm:text-[15px]">
        {briefing.text}
      </p>
      <p className="relative mt-3 text-[11px] text-zinc-600">
        Fleet apps POST to <code className="text-zinc-400">/api/telemetry</code>. Product workspace
        remains at{' '}
        <Link href="/inspect" className="text-zinc-400 underline-offset-2 hover:underline">
          /inspect
        </Link>
        .
      </p>
    </section>
  );
}
