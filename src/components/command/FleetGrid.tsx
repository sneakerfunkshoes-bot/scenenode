'use client';

import Link from 'next/link';
import { Clapperboard, GraduationCap, Scissors, ScrollText } from 'lucide-react';
import type { FleetAppSnapshot, FleetHealth } from '@/types/command-center';

const ICONS = {
  scenenode: Clapperboard,
  script_marketplace: ScrollText,
  clipping_engine: Scissors,
  pune_student_app: GraduationCap,
};

const STATUS: Record<FleetHealth, { label: string; className: string; dot: string }> = {
  online: {
    label: 'Online',
    className: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
    dot: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]',
  },
  degraded: {
    label: 'Degraded',
    className: 'text-amber-200 bg-amber-400/10 border-amber-400/20',
    dot: 'bg-amber-400',
  },
  error: {
    label: 'Error',
    className: 'text-red-300 bg-red-400/10 border-red-400/25',
    dot: 'bg-red-500',
  },
  awaiting: {
    label: 'Awaiting ping',
    className: 'text-zinc-400 bg-zinc-800/80 border-zinc-700',
    dot: 'bg-zinc-500',
  },
};

function lastSeen(iso: string | null): string {
  if (!iso) return 'No events yet';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'Just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return new Date(iso).toLocaleString();
}

export function FleetGrid({ fleet }: { fleet: FleetAppSnapshot[] }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">App fleet telemetry</p>
          <h2 className="text-lg font-semibold text-white">Holding company nodes</h2>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {fleet.map((app) => {
          const Icon = ICONS[app.id];
          const status = STATUS[app.status];
          return (
            <article
              key={app.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-5 transition hover:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{app.name}</h3>
                    <p className="text-xs text-zinc-500">{app.blurb}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium ${status.className}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold tabular-nums text-white">{app.todayOutput}</p>
                  <p className="text-xs text-zinc-500">{app.outputLabel}</p>
                </div>
                <p className="text-[11px] text-zinc-600">{lastSeen(app.lastEventAt)}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {app.links.map((link) => (
                  <Link
                    key={link.href + link.label}
                    href={link.href}
                    className="rounded-lg border border-zinc-800 px-2.5 py-1 text-[11px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
