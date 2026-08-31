'use client';

import type { ReactNode } from 'react';
import { cn, formatTimestamp } from '@/lib/utils';
import {
  EFFECT_CATEGORY_META,
  type BeatEnvelopePoint,
  type BeatPeak,
  type EffectCardView,
  type PacingEvent,
  type TimelineFrameView,
} from '@/lib/deconstruct-view-model';
import { BeatWaveform } from './BeatWaveform';

interface MasterTimelineProps {
  frames: TimelineFrameView[];
  beats: BeatPeak[];
  envelope: BeatEnvelopePoint[];
  cuts: PacingEvent[];
  effects: EffectCardView[];
  transitions: EffectCardView[];
  duration: number;
  currentTime: number;
  selectedEffectId?: string | null;
  beatStatus?: 'idle' | 'running' | 'ready' | 'error';
  onSeek: (time: number, effectId?: string) => void;
}

function MarkerTrack({
  end,
  playPct,
  children,
  className,
}: {
  end: number;
  playPct: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-zinc-950/40', className)}>
      <div
        className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white/50"
        style={{ left: `${playPct}%` }}
      />
      {children}
    </div>
  );
}

export function MasterTimeline({
  frames,
  beats,
  envelope,
  cuts,
  effects,
  transitions,
  duration,
  currentTime,
  selectedEffectId,
  beatStatus,
  onSeek,
}: MasterTimelineProps) {
  const end = Math.max(duration, 0.01);
  const playPct = Math.min(100, (currentTime / end) * 100);

  const scenes = frames.map((frame, i) => {
    const next = frames[i + 1];
    const stop = next?.time ?? end;
    return { ...frame, end: stop };
  });

  return (
    <section className="workspace-fade-in workspace-fade-in-delay w-full min-w-0 overflow-hidden rounded-xl bg-zinc-900/35 p-4 sm:p-5">
      <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        Timeline
      </h3>

      <div className="mb-1 flex justify-between font-mono text-[9px] text-zinc-600">
        <span>0:00</span>
        <span>{formatTimestamp(end)}</span>
      </div>

      <div className="mb-4 rounded-lg bg-zinc-950/50 px-2 py-2 ring-1 ring-inset ring-white/[0.04]">
        <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-600">
          🎵 Beats · {beats.length}
        </p>
        <BeatWaveform
          peaks={beats}
          envelope={envelope}
          duration={end}
          currentTime={currentTime}
          status={beatStatus}
          onSeek={(t) => onSeek(t)}
        />
      </div>

      <div className="relative mb-4">
        <p className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-600">
          ✂️ Cuts
        </p>
        <MarkerTrack end={end} playPct={playPct} className="h-11">
          {scenes.map((scene, i) => {
            const left = (scene.time / end) * 100;
            const width = Math.max(4, ((scene.end - scene.time) / end) * 100);
            return (
              <button
                key={scene.id}
                type="button"
                onClick={() => onSeek(scene.time, scene.effectId)}
                className="absolute top-1.5 flex h-8 max-w-[calc(100%-4px)] items-center justify-center rounded-md bg-zinc-900/80 px-1 text-[10px] font-medium text-zinc-400 ring-1 ring-inset ring-white/[0.06] hover:ring-white/12"
                style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
                title={scene.label}
              >
                <span className="truncate px-1">{String(i + 1).padStart(2, '0')}</span>
              </button>
            );
          })}
          {cuts.map((cut) => (
            <span
              key={cut.id}
              className="pointer-events-none absolute top-0 z-[5] h-full w-px bg-zinc-500/60"
              style={{ left: `${(cut.time / end) * 100}%` }}
              title={cut.label}
            />
          ))}
        </MarkerTrack>
      </div>

      <div className="relative mb-4">
        <p className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-600">
          ✨ Effects
        </p>
        <MarkerTrack end={end} playPct={playPct} className="min-h-[44px] p-1">
          {effects.map((fx) => {
            const left = (fx.time / end) * 100;
            const width = Math.max(3, (fx.duration / end) * 100);
            const meta = EFFECT_CATEGORY_META[fx.category];
            const active = fx.id === selectedEffectId;
            return (
              <button
                key={fx.id}
                type="button"
                onClick={() => onSeek(fx.time, fx.id)}
                title={fx.recipe.headline}
                className={cn(
                  'absolute top-1 flex h-9 max-w-[calc(100%-8px)] items-center overflow-hidden rounded-md px-2 transition',
                  'ring-1 ring-inset ring-white/[0.06] hover:ring-white/12',
                  meta.tint,
                  active && 'ring-sky-400/35'
                )}
                style={{
                  left: `${left}%`,
                  width: `${Math.min(width, 100 - left)}%`,
                }}
              >
                <span className={cn('absolute inset-x-0 top-0 h-0.5', meta.bar)} />
                <span className="truncate text-[10px] font-medium text-zinc-200">
                  {fx.recipe.headline}
                </span>
              </button>
            );
          })}
        </MarkerTrack>
      </div>

      <div className="relative">
        <p className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-600">
          🔄 Transitions
        </p>
        <MarkerTrack end={end} playPct={playPct} className="min-h-[40px] p-1">
          {transitions.map((fx) => {
            const left = (fx.time / end) * 100;
            const width = Math.max(3, (fx.duration / end) * 100);
            const active = fx.id === selectedEffectId;
            return (
              <button
                key={fx.id}
                type="button"
                onClick={() => onSeek(fx.time, fx.id)}
                title={fx.recipe.headline}
                className={cn(
                  'absolute top-1 flex h-8 max-w-[calc(100%-8px)] items-center overflow-hidden rounded-md bg-emerald-500/[0.08] px-2 transition',
                  'ring-1 ring-inset ring-white/[0.06] hover:ring-white/12',
                  active && 'ring-sky-400/35'
                )}
                style={{
                  left: `${left}%`,
                  width: `${Math.min(width, 100 - left)}%`,
                }}
              >
                <span className="truncate text-[10px] font-medium text-zinc-200">
                  {fx.recipe.headline}
                </span>
              </button>
            );
          })}
        </MarkerTrack>
      </div>
    </section>
  );
}
