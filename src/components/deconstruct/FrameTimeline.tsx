'use client';

import { cn } from '@/lib/utils';
import {
  EFFECT_CATEGORY_META,
  type EffectCardView,
  type PacingEvent,
  type TimelineFrameView,
} from '@/lib/deconstruct-view-model';

interface AnalysisTimelineProps {
  frames: TimelineFrameView[];
  events: PacingEvent[];
  effects: EffectCardView[];
  duration: number;
  selectedId?: string | null;
  currentTime: number;
  onSelectFrame: (frame: TimelineFrameView) => void;
  onSelectEvent?: (ev: PacingEvent) => void;
  onSelectEffect?: (fx: EffectCardView) => void;
}

export function FrameTimeline(props: AnalysisTimelineProps) {
  return <AnalysisTimeline {...props} />;
}

export function AnalysisTimeline({
  frames,
  events,
  effects,
  duration,
  selectedId,
  currentTime,
  onSelectFrame,
  onSelectEvent,
  onSelectEffect,
}: AnalysisTimelineProps) {
  const end = Math.max(duration, 0.01);
  const beatEvents = events.filter(
    (e) =>
      e.kind === 'beat' ||
      e.kind === 'cut' ||
      e.kind === 'transition' ||
      e.kind === 'scene' ||
      e.kind === 'speed'
  );

  return (
    <section className="rounded-xl bg-zinc-900/35 p-4 sm:p-5">
      <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        Frame-by-Frame Analysis Timeline
      </h3>

      {/* Layer 1 — Scene track */}
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600">
        Scene Track
      </p>
      <div
        className={cn('mb-4 grid gap-2', frames.length > 7 && 'overflow-x-auto pb-1')}
        style={{
          gridTemplateColumns:
            frames.length > 7
              ? `repeat(${frames.length}, minmax(100px, 1fr))`
              : `repeat(${Math.max(frames.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {frames.map((frame, i) => {
          const active =
            frame.id === selectedId ||
            frame.effectId === selectedId ||
            Math.abs(frame.time - currentTime) < 0.35;
          return (
            <button
              key={frame.id}
              type="button"
              onClick={() => onSelectFrame(frame)}
              className={cn(
                'group min-w-0 overflow-hidden rounded-lg text-left transition',
                active
                  ? 'bg-zinc-800 ring-1 ring-sky-500/35'
                  : 'bg-zinc-950/50 hover:bg-zinc-900'
              )}
            >
              <div
                className={cn(
                  'flex aspect-[9/10] items-end bg-gradient-to-br from-zinc-700/80 via-zinc-900 to-black p-2 transition group-hover:from-zinc-600/70',
                  active && 'from-sky-900/40'
                )}
              >
                <span className="font-mono text-[11px] text-zinc-200">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <p className="truncate px-2 py-1.5 font-mono text-[9px] text-zinc-500">
                {frame.timeLabel}
              </p>
            </button>
          );
        })}
      </div>

      {/* Layer 2 — Beat track (markers only) */}
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600">
        Beat Track
      </p>
      <div className="relative mb-4 h-9 rounded-lg bg-zinc-950/50 px-2">
        <div className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-zinc-800" />
        <div
          className="absolute top-1/2 z-10 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
          style={{ left: `${Math.min(98, (currentTime / end) * 100)}%` }}
        />
        {beatEvents.map((ev) => (
          <button
            key={ev.id}
            type="button"
            title={`${ev.kind === 'beat' ? 'Beat' : ev.label} at ${ev.timeLabel}`}
            onClick={() => onSelectEvent?.(ev)}
            className="absolute top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2 text-sm text-zinc-400 transition hover:scale-125 hover:text-white"
            style={{ left: `${Math.min(97, Math.max(2, (ev.time / end) * 100))}%` }}
          >
            {ev.symbol}
          </button>
        ))}
      </div>

      {/* Layer 3 — Effects track */}
      <EffectsTrack
        effects={effects}
        duration={end}
        selectedId={selectedId}
        currentTime={currentTime}
        onSelectEffect={onSelectEffect}
      />
    </section>
  );
}

function EffectsTrack({
  effects,
  duration,
  selectedId,
  currentTime,
  onSelectEffect,
}: {
  effects: EffectCardView[];
  duration: number;
  selectedId?: string | null;
  currentTime: number;
  onSelectEffect?: (fx: EffectCardView) => void;
}) {
  const end = Math.max(duration, 0.01);
  const lanes: number[] = [];
  const placements = effects.map((fx) => {
    const start = fx.time;
    const stop = fx.time + Math.max(fx.duration, 0.35);
    let lane = 0;
    while (lanes[lane] !== undefined && lanes[lane] > start + 0.05) lane += 1;
    lanes[lane] = stop;
    return { fx, lane };
  });
  const laneCount = Math.max(1, lanes.length);

  return (
    <div>
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600">
        Effects Track
      </p>
      <div
        className="relative w-full rounded-lg bg-zinc-950/35 p-2"
        style={{ minHeight: Math.max(52, laneCount * 44 + 8) }}
      >
        <div
          className="absolute top-0 z-20 h-full w-px bg-white/40"
          style={{ left: `${Math.min(99, (currentTime / end) * 100)}%` }}
        />
        {placements.map(({ fx, lane }) => {
          const leftPct = Math.max(0, (fx.time / end) * 100);
          const widthPct = Math.max(5.5, (fx.duration / end) * 100);
          const clampedWidth = Math.min(widthPct, 100 - leftPct);
          const meta = EFFECT_CATEGORY_META[fx.category];
          const active = fx.id === selectedId;

          return (
            <button
              key={fx.id}
              type="button"
              title={`${fx.recipe.headline} · ${fx.timeLabel}–${fx.endTimeLabel}`}
              onClick={() => onSelectEffect?.(fx)}
              className={cn(
                'absolute overflow-hidden rounded-md px-2.5 py-2 text-left transition',
                'ring-1 ring-inset ring-white/[0.06] hover:ring-white/15',
                meta.tint,
                active && 'z-10 ring-sky-400/35'
              )}
              style={{
                left: `${leftPct}%`,
                width: `${clampedWidth}%`,
                top: 4 + lane * 44,
                minWidth: 88,
                height: 36,
              }}
            >
              <span className={cn('absolute inset-x-0 top-0 h-0.5', meta.bar)} />
              <span className="block truncate text-[11px] font-medium text-zinc-100">
                {fx.recipe.headline}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
