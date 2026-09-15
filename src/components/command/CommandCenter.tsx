'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, Lock } from 'lucide-react';
import { AgentTerminal } from '@/components/command/AgentTerminal';
import { ExecutiveBriefingCard } from '@/components/command/ExecutiveBriefing';
import { FleetGrid } from '@/components/command/FleetGrid';
import { MetricCards } from '@/components/command/MetricCards';
import type { CommandCenterSummary } from '@/types/command-center';

export function CommandCenter() {
  const [summary, setSummary] = useState<CommandCenterSummary | null>(null);
  const [error, setError] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);
  const [refreshingBrief, setRefreshingBrief] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/command/summary', {
        cache: 'no-store',
        credentials: 'include',
      });
      if (res.status === 401) {
        setUnauthorized(true);
        setError('');
        return;
      }
      const data = (await res.json()) as CommandCenterSummary & { error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to load command summary');
      setUnauthorized(false);
      setSummary(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    void load();
    const poll = window.setInterval(() => void load(), 8_000);
    const clock = window.setInterval(() => setNow(new Date()), 1_000);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, [load]);

  async function regenerateBrief() {
    setRefreshingBrief(true);
    try {
      const res = await fetch('/api/command/briefing', {
        method: 'POST',
        credentials: 'include',
      });
      const data = (await res.json()) as {
        briefing?: CommandCenterSummary['briefing'];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || 'Briefing failed');
      if (data.briefing) {
        setSummary((prev) => (prev ? { ...prev, briefing: data.briefing! } : prev));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Briefing failed');
    } finally {
      setRefreshingBrief(false);
    }
  }

  if (unauthorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090b] px-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
          <Lock className="mx-auto h-6 w-6 text-zinc-500" />
          <h1 className="mt-3 text-lg font-semibold text-white">Command center locked</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in through admin, then return here. Telemetry ingest still uses{' '}
            <code className="text-zinc-300">x-ops-secret</code>.
          </p>
          <Link
            href="/admin"
            className="mt-5 inline-flex rounded-lg bg-emerald-400 px-4 py-2 text-sm font-medium text-black"
          >
            Open admin
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.07),transparent_42%),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:100%_100%,24px_24px,24px_24px]" />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-400/80">
              Velop · Master Command Center
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
              AI Employee Workspace
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-zinc-500">
              Control tower for SceneNode, the script store, the clipping engine, and the Pune
              student app.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-xs text-zinc-400">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            LIVE
            <span className="text-zinc-600">·</span>
            <time className="font-mono tabular-nums text-zinc-300">
              {now.toLocaleTimeString([], { hour12: false })}
            </time>
          </div>
        </header>

        {error ? (
          <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        {!summary ? (
          <p className="text-sm text-zinc-500">Booting command center…</p>
        ) : (
          <div className="space-y-5">
            <ExecutiveBriefingCard
              briefing={summary.briefing}
              refreshing={refreshingBrief}
              onRefresh={() => void regenerateBrief()}
            />
            <MetricCards metrics={summary.metrics} />
            <FleetGrid fleet={summary.fleet} />
            <AgentTerminal logs={summary.logs} />
          </div>
        )}
      </div>
    </main>
  );
}
