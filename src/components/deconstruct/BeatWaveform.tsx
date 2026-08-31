'use client';

import { useEffect, useId, useMemo, useRef, useState, type PointerEvent } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { cn, formatTimestamp } from '@/lib/utils';
import {
  BEAT_TYPE_META,
  type BeatEnvelopePoint,
  type BeatPeak,
} from '@/lib/deconstruct-view-model';

interface BeatWaveformProps {
  peaks: BeatPeak[];
  envelope: BeatEnvelopePoint[];
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  status?: 'idle' | 'running' | 'ready' | 'error';
  className?: string;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function BeatWaveform({
  peaks,
  envelope,
  duration,
  currentTime,
  onSeek,
  status = 'idle',
  className,
}: BeatWaveformProps) {
  const end = Math.max(duration, 0.01);
  const gid = useId().replace(/:/g, '');
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; start: number; span: number } | null>(null);
  const [hover, setHover] = useState<BeatPeak | null>(null);
  const [viewStart, setViewStart] = useState(0);
  const [viewEnd, setViewEnd] = useState(end);

  useEffect(() => {
    setViewStart(0);
    setViewEnd(end);
  }, [end]);

  useEffect(() => {
    const node = trackRef.current;
    if (!node) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const rect = node.getBoundingClientRect();
      const pct = rect.width ? Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) : 0.5;
      const center = viewStart + pct * Math.max(0.4, viewEnd - viewStart);
      const factor = e.deltaY > 0 ? 1.18 : 0.85;
      const nextSpan = Math.min(end, Math.max(0.4, (viewEnd - viewStart) * factor));
      const s = Math.min(Math.max(0, center - nextSpan / 2), Math.max(0, end - nextSpan));
      setViewStart(s);
      setViewEnd(s + nextSpan);
    };
    node.addEventListener('wheel', onWheelNative, { passive: false });
    return () => node.removeEventListener('wheel', onWheelNative);
  }, [end, viewStart, viewEnd]);

  const span = Math.max(0.4, viewEnd - viewStart);
  const playPct = clamp(((currentTime - viewStart) / span) * 100, 0, 100);

  const visiblePeaks = useMemo(
    () => peaks.filter((p) => p.time >= viewStart - 0.05 && p.time <= viewEnd + 0.05),
    [peaks, viewStart, viewEnd]
  );

  const activeBeat = useMemo(() => {
    let best: BeatPeak | null = null;
    let bestDist = 0.09;
    for (const p of peaks) {
      const d = Math.abs(p.time - currentTime);
      if (d < bestDist) {
        best = p;
        bestDist = d;
      }
    }
    return best;
  }, [peaks, currentTime]);

  const { linePath, fillPath } = useMemo(() => {
    const w = 1000;
    const h = 72;
    const base = h - 6;
    const pts = envelope.length
      ? envelope
      : [
          { time: 0, energy: 0.04 },
          { time: end, energy: 0.04 },
        ];

    const coords: Array<{ x: number; y: number }> = [];
    for (const p of pts) {
      const x = ((p.time - viewStart) / span) * w;
      if (x < -20 || x > w + 20) continue;
      const y = base - Math.min(1, Math.max(0, p.energy)) * (h - 14);
      coords.push({ x, y });
    }
    if (!coords.length) {
      const flat = `M 0 ${base} L ${w} ${base}`;
      return { linePath: flat, fillPath: `${flat} L ${w} ${h} L 0 ${h} Z` };
    }
    if (coords[0]!.x > 0) coords.unshift({ x: 0, y: coords[0]!.y });
    if (coords[coords.length - 1]!.x < w) {
      coords.push({ x: w, y: coords[coords.length - 1]!.y });
    }

    const line = coords
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ');
    return { linePath: line, fillPath: `${line} L ${w} ${h} L 0 ${h} Z` };
  }, [envelope, end, viewStart, span]);

  const setView = (start: number, finish: number) => {
    const nextSpan = clamp(finish - start, 0.4, end);
    const s = clamp(start, 0, Math.max(0, end - nextSpan));
    setViewStart(s);
    setViewEnd(s + nextSpan);
  };

  const zoomAt = (centerTime: number, factor: number) => {
    const nextSpan = clamp(span * factor, 0.4, end);
    setView(centerTime - nextSpan / 2, centerTime + nextSpan / 2);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button[data-beat]')) return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, start: viewStart, span };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !trackRef.current) return;
    const w = trackRef.current.getBoundingClientRect().width || 1;
    const dt = ((e.clientX - drag.x) / w) * drag.span;
    setView(drag.start - dt, drag.start - dt + drag.span);
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div className={cn('relative', className)}>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2.5">
          {(Object.keys(BEAT_TYPE_META) as Array<keyof typeof BEAT_TYPE_META>).map((key) => {
            const meta = BEAT_TYPE_META[key];
            const used = peaks.some((p) => p.beatType === key);
            if (!used) return null;
            return (
              <span key={key} className="inline-flex items-center gap-1 text-[9px] text-zinc-500">
                <span
                  className={cn(
                    'inline-block h-1.5 w-1.5',
                    meta.shape === 'diamond' ? 'rotate-45' : 'rounded-full'
                  )}
                  style={{ background: meta.color }}
                />
                {meta.label}
              </span>
            );
          })}
          {status === 'running' ? (
            <span className="text-[9px] text-zinc-600">Reading audio…</span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
            onClick={() => zoomAt((viewStart + viewEnd) / 2, 1.25)}
            aria-label="Zoom out"
          >
            <Minus className="h-3 w-3" />
          </button>
          <button
            type="button"
            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
            onClick={() => zoomAt((viewStart + viewEnd) / 2, 0.8)}
            aria-label="Zoom in"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            type="button"
            className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
            onClick={() => setView(0, end)}
            aria-label="Fit timeline"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="relative cursor-ew-resize select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="relative mb-1 h-3">
          {visiblePeaks.map((peak) => {
            const left = ((peak.time - viewStart) / span) * 100;
            const meta = BEAT_TYPE_META[peak.beatType];
            const active = activeBeat?.id === peak.id;
            return (
              <span
                key={`dot-${peak.id}`}
                className="absolute top-0.5 -translate-x-1/2"
                style={{ left: `${left}%` }}
              >
                <span
                  className={cn(
                    'block h-1.5 w-1.5',
                    meta.shape === 'diamond' ? 'rotate-45' : 'rounded-full',
                    active && 'ring-2 ring-white/70'
                  )}
                  style={{
                    background: meta.color,
                    boxShadow: active ? `0 0 8px ${meta.color}` : undefined,
                  }}
                />
              </span>
            );
          })}
        </div>

        <svg
          viewBox="0 0 1000 72"
          preserveAspectRatio="none"
          className="h-16 w-full"
          role="img"
          aria-label="Audio energy and beat onsets"
        >
          <defs>
            <linearGradient id={`beatFill-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(244, 114, 182, 0.22)" />
              <stop offset="100%" stopColor="rgba(244, 114, 182, 0)" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((y) => (
            <line
              key={y}
              x1="0"
              y1={72 * y}
              x2="1000"
              y2={72 * y}
              stroke="rgba(161,161,170,0.08)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path d={fillPath} fill={`url(#beatFill-${gid})`} />
          <path
            d={linePath}
            fill="none"
            stroke="rgba(244, 114, 182, 0.8)"
            strokeWidth="1.4"
            vectorEffect="non-scaling-stroke"
          />
          {visiblePeaks.map((peak) => {
            const x = ((peak.time - viewStart) / span) * 1000;
            const h = 8 + peak.strength * 48;
            const meta = BEAT_TYPE_META[peak.beatType];
            return (
              <line
                key={`stem-${peak.id}`}
                x1={x}
                x2={x}
                y1={66}
                y2={66 - h}
                stroke={meta.color}
                strokeOpacity="0.55"
                strokeWidth="1.2"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white/75 shadow-[0_0_8px_rgba(255,255,255,0.35)]"
          style={{ left: `${playPct}%` }}
        />

        {visiblePeaks.map((peak) => {
          const left = ((peak.time - viewStart) / span) * 100;
          const active = activeBeat?.id === peak.id;
          return (
            <button
              key={peak.id}
              type="button"
              data-beat=""
              className={cn(
                'absolute bottom-0 top-0 z-[5] w-2.5 -translate-x-1/2',
                active && 'bg-white/5'
              )}
              style={{ left: `${left}%` }}
              onMouseEnter={() => setHover(peak)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSeek(peak.time)}
              aria-label={`${BEAT_TYPE_META[peak.beatType].label} at ${formatTimestamp(peak.time)}`}
            />
          );
        })}

        {hover ? (
          <div
            className="pointer-events-none absolute bottom-full z-20 mb-1 -translate-x-1/2 rounded-md bg-zinc-900 px-2 py-1.5 text-[10px] text-zinc-300 ring-1 ring-zinc-700"
            style={{ left: `${((hover.time - viewStart) / span) * 100}%` }}
          >
            <p className="font-mono text-zinc-200">{formatTimestamp(hover.time)}</p>
            <p>
              {BEAT_TYPE_META[hover.beatType].label}
              <span className="mx-1 text-zinc-600">·</span>
              {(hover.strength * 100).toFixed(0)}%
            </p>
            <p className="text-zinc-500">
              Confidence {(hover.confidence * 100).toFixed(0)}%
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
