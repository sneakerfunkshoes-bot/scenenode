'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  EFFECT_CATEGORY_META,
  type ColorToneView,
  type EffectCardView,
  type PacingEvent,
} from '@/lib/deconstruct-view-model';

export function AnalysisSection({
  title,
  children,
  className,
  action,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn('rounded-xl bg-zinc-900/40 p-4', className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EffectChip({
  effect,
  active,
  onSelect,
}: {
  effect: EffectCardView;
  active?: boolean;
  onSelect?: () => void;
}) {
  const meta = EFFECT_CATEGORY_META[effect.category];
  const recipe = effect.recipe;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'min-w-[180px] flex-1 rounded-lg text-left transition ring-1 ring-inset',
        meta.tint,
        active ? 'ring-sky-400/35' : 'ring-white/[0.06] hover:ring-white/12'
      )}
    >
      <span className={cn('block h-0.5 w-full rounded-t-lg', meta.bar)} />
      <span className="block space-y-1.5 px-2.5 py-2">
        <span className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-500">
          <span>{effect.icon}</span>
          {recipe.family}
        </span>
        <span className="block text-[12px] font-semibold text-zinc-100">{recipe.headline}</span>
        <span className="flex flex-wrap gap-1">
          {[recipe.primary, ...recipe.combined.slice(0, 1)].map((chip) => (
            <span
              key={chip}
              className="rounded bg-zinc-950/50 px-1.5 py-0.5 text-[9px] text-zinc-400 ring-1 ring-inset ring-white/[0.04]"
            >
              {chip}
            </span>
          ))}
        </span>
        <span className="block text-[10px] text-zinc-500">
          + {recipe.supporting.slice(0, 2).join('  + ')}
        </span>
        <span className="block font-mono text-[9px] text-zinc-600">
          {recipe.timeLabel}
          <span className="mx-1 text-zinc-700">━</span>
          {recipe.endTimeLabel}
        </span>
      </span>
    </button>
  );
}

export function ColorToneBlock({
  data,
  layout = 'stack',
}: {
  data: ColorToneView;
  layout?: 'stack' | 'band';
}) {
  const rows = [
    { key: 'SHADOW', ...data.shadow },
    { key: 'MIDTONE', ...data.midtone },
    { key: 'HIGHLIGHT', ...data.highlight },
  ] as const;

  const tones = (
    <div className={cn('grid gap-2', layout === 'band' ? 'grid-cols-3' : 'grid-cols-3')}>
      {rows.map((row) => (
        <div key={row.key} className="space-y-1.5">
          <p className="text-[9px] uppercase tracking-wider text-zinc-600">{row.key}</p>
          <div className="flex items-center gap-2">
            <span
              className="h-5 w-5 shrink-0 rounded-sm ring-1 ring-white/10"
              style={{ background: row.hex }}
            />
            <span className="truncate text-[11px] text-zinc-300">{row.label}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const meters = (
    <div className={cn(layout === 'band' ? 'grid grid-cols-2 gap-x-4 gap-y-2' : 'space-y-2')}>
      <Meter label="Contrast" value={data.contrast} />
      <Meter label="Saturation" value={data.saturation} />
      {typeof data.temperature === 'number' ? (
        <Meter label="Temperature" value={data.temperature} />
      ) : null}
      {typeof data.tint === 'number' ? <Meter label="Tint" value={data.tint} /> : null}
    </div>
  );

  const curve = (
    <div>
      <p className="mb-1 text-[9px] uppercase tracking-wider text-zinc-600">Tone Curve</p>
      <svg viewBox="0 0 100 36" className="h-10 w-full text-zinc-400">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          points={data.curve
            .map((y, i) => `${(i / (data.curve.length - 1)) * 100},${34 - y * 0.3}`)
            .join(' ')}
        />
      </svg>
    </div>
  );

  if (layout === 'band') {
    return (
      <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(160px,0.7fr)]">
        {tones}
        {meters}
        {curve}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tones}
      {meters}
      {curve}
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] text-zinc-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="relative h-1 overflow-hidden rounded-full bg-zinc-800/80">
        <div className="h-full rounded-full bg-zinc-400/70" style={{ width: `${value}%` }} />
        <span
          className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-zinc-200"
          style={{ left: `calc(${value}% - 4px)` }}
        />
      </div>
    </div>
  );
}

const KIND_STYLE: Record<PacingEvent['kind'], string> = {
  beat: 'text-rose-300/90',
  cut: 'text-sky-300/90',
  transition: 'text-emerald-300/90',
  speed: 'text-amber-300/90',
  scene: 'text-zinc-300',
};

export function PacingTimeline({
  events,
  duration,
  currentTime,
  onSelect,
}: {
  events: PacingEvent[];
  duration: number;
  currentTime: number;
  onSelect: (ev: PacingEvent) => void;
  compact?: boolean;
}) {
  const end = Math.max(duration, 0.01);
  const [focus, setFocus] = useState<PacingEvent | null>(null);

  return (
    <div className="space-y-2">
      <div className="relative h-10 rounded-lg bg-zinc-950/45 px-3">
        <div className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-zinc-700/80" />
        <div
          className="absolute top-1/2 z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
          style={{ left: `${Math.min(98, (currentTime / end) * 100)}%` }}
        />
        {events.map((ev) => (
          <button
            key={ev.id}
            type="button"
            title={`${ev.label} ${ev.timeLabel}`}
            onClick={() => {
              setFocus(ev);
              onSelect(ev);
            }}
            className={cn(
              'absolute top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2 text-sm transition hover:scale-125',
              KIND_STYLE[ev.kind]
            )}
            style={{ left: `${Math.min(98, Math.max(1.5, (ev.time / end) * 100))}%` }}
          >
            {ev.symbol}
          </button>
        ))}
      </div>
      {focus ? (
        <p className="px-1 text-[11px] text-zinc-500">
          <span className={KIND_STYLE[focus.kind]}>{focus.symbol}</span>{' '}
          {focus.kind === 'beat' ? `Beat at ${focus.timeLabel}` : `${focus.label} · ${focus.timeLabel}`}
        </p>
      ) : null}
    </div>
  );
}

/** @deprecated use EffectChip grid */
export function EffectCard({
  effect,
  active,
  onSelect,
}: {
  effect: EffectCardView;
  active?: boolean;
  onSelect?: () => void;
}) {
  return <EffectChip effect={effect} active={active} onSelect={onSelect} />;
}

/** @deprecated use PacingTimeline */
export function PacingList({
  events,
  onSelect,
}: {
  events: PacingEvent[];
  onSelect?: (ev: PacingEvent) => void;
}) {
  return (
    <ul className="space-y-1">
      {events.map((ev) => (
        <li key={ev.id}>
          <button
            type="button"
            onClick={() => onSelect?.(ev)}
            className="flex w-full justify-between rounded-lg px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-900"
          >
            <span>
              {ev.symbol} {ev.label}
            </span>
            <span className="font-mono text-[10px]">{ev.timeLabel}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
