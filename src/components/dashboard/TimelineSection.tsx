'use client';

import { useBreakdown } from '@/context/BreakdownContext';
import { formatTimestamp } from '@/lib/utils';
import { Disc, Zap } from 'lucide-react';
import { getNleTheme } from '@/lib/nle-theme';
import { BeatGraphEditor } from './BeatGraphEditor';

export function TimelineSection() {
  const { breakdown, nle } = useBreakdown();
  const theme = getNleTheme(nle);

  if (!breakdown) return null;

  const { bpm, trackDuration, songTitle, songArtist } = breakdown;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950 p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg border"
            style={{
              borderColor: `rgba(${theme.accentRgb},0.25)`,
              background: `rgba(${theme.accentRgb},0.08)`,
            }}
          >
            <Disc className="h-5 w-5" style={{ color: theme.playhead }} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">{songTitle}</h4>
            <p className="text-xs text-zinc-500">{songArtist}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-1.5">
          <Zap className="h-3.5 w-3.5 fill-zinc-400 text-zinc-400" />
          <span className="font-mono text-xs text-zinc-300">
            BPM <strong className="text-sm text-white">{bpm}</strong>
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Timeline · Speed Graph Editor
          </span>
          <span className="font-mono text-[11px]">
            00:00 — {formatTimestamp(trackDuration)}
          </span>
        </div>
        <BeatGraphEditor />
      </div>
    </div>
  );
}
