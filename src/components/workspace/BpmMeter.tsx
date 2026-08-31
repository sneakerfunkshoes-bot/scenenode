'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface BpmMeterProps {
  bpm: number;
}

export function BpmMeter({ bpm }: BpmMeterProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const intervalMs = (60 / bpm) * 1000;
    let pulseTimeout: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setPulse(true);
      pulseTimeout = setTimeout(() => setPulse(false), Math.min(120, intervalMs * 0.25));
    }, intervalMs);
    return () => {
      clearInterval(id);
      clearTimeout(pulseTimeout);
    };
  }, [bpm]);

  return (
    <div className="glass-panel flex items-center gap-4 rounded-md px-4 py-3">
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full border transition duration-100',
          pulse
            ? 'scale-110 border-silver/60 bg-silver/20'
            : 'border-silver/20 bg-silver/5'
        )}
      >
        <span className="font-mono text-[10px] text-silver-muted">BPM</span>
      </div>
      <div>
        <p className="font-display text-3xl font-bold tabular-nums tracking-tight text-silver">
          {bpm}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-silver-dim">
          Detected tempo
        </p>
      </div>
      <div className="ml-auto hidden items-end gap-0.5 sm:flex">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-1 rounded-full bg-silver/40 transition-all duration-150',
              pulse ? 'opacity-100' : 'opacity-40'
            )}
            style={{
              height: `${10 + ((i * 7) % 22)}px`,
              transitionDelay: `${i * 20}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
