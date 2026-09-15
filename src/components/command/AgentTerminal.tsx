'use client';

import { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import type { AgentLogLine } from '@/types/command-center';

const LEVEL: Record<AgentLogLine['level'], string> = {
  ok: 'text-emerald-400',
  info: 'text-sky-300',
  warn: 'text-amber-300',
  error: 'text-red-400',
};

export function AgentTerminal({ logs }: { logs: AgentLogLine[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logs]);

  const chronological = [...logs].reverse();

  return (
    <section className="flex min-h-[280px] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#07070a]">
      <header className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">AI agent log</h2>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600">
          digital workforce · live
        </p>
      </header>
      <div
        ref={scroller}
        className="command-terminal flex-1 overflow-y-auto px-4 py-3 font-mono text-[12px] leading-6"
      >
        {chronological.map((line) => (
          <div
            key={line.id}
            className="grid grid-cols-[88px_88px_1fr] gap-3 sm:grid-cols-[96px_120px_1fr]"
          >
            <time className="text-zinc-600 tabular-nums">
              {new Date(line.timestamp).toLocaleTimeString([], {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </time>
            <span className={`truncate ${LEVEL[line.level]}`}>{line.source}</span>
            <p className="text-zinc-300">{line.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
