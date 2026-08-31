'use client';

import type { BreakdownData } from '@/types';
import { BpmMeter } from './BpmMeter';
import { BeatTimeline } from './BeatTimeline';
import { EffectList } from './EffectList';

interface BreakdownDashboardProps {
  data: BreakdownData | null;
  loading?: boolean;
}

export function BreakdownDashboard({ data, loading }: BreakdownDashboardProps) {
  if (loading) {
    return (
      <div className="glass-panel flex flex-1 flex-col items-center justify-center gap-3 rounded-md p-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-silver/20 border-t-silver" />
        <p className="font-mono text-xs uppercase tracking-widest text-silver-dim">
          Mapping beats & effects…
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-panel flex flex-1 flex-col items-center justify-center gap-2 rounded-md p-10 text-center">
        <p className="font-display text-lg font-semibold text-silver/80">Video Breakdown</p>
        <p className="max-w-sm font-body text-sm text-silver-dim">
          Paste a social video URL or import media to generate BPM, beat markers, and effect timestamps.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
        <BpmMeter bpm={data.bpm} />
        <BeatTimeline beats={data.beats} duration={data.duration} />
      </div>
      <EffectList effects={data.effects} />
    </div>
  );
}
