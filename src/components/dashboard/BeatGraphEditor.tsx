'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Activity, Maximize2, Pause, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBreakdown } from '@/context/BreakdownContext';
import { formatTimestamp } from '@/lib/utils';
import { getNleTheme } from '@/lib/nle-theme';
import type { BreakdownEffect, EffectKind } from '@/types/breakdown';
import { effectSpikeY } from '@/types/breakdown';

const SVG_WIDTH = 600;
const SVG_HEIGHT = 220;
const VAL_MAX = 180;
const VAL_MIN = -120;

interface GraphPoint {
  time: number;
  val: number;
  effectId?: string;
  effectType?: EffectKind;
}

function buildVelocityKeyframes(
  duration: number,
  beats: number[],
  effects: BreakdownEffect[],
  bpm: number
): GraphPoint[] {
  if (duration <= 0) return [{ time: 0, val: 20 }, { time: 100, val: 20 }];

  const samples = 18;
  const points: GraphPoint[] = [];

  for (let i = 0; i <= samples; i++) {
    const tSec = (i / samples) * duration;
    const timePct = (tSec / duration) * 100;

    const nearestBeat = beats.length
      ? beats.reduce((best, beat) =>
          Math.abs(beat - tSec) < Math.abs(best - tSec) ? beat : best
        )
      : tSec;
    const beatDist = beats.length ? Math.abs(nearestBeat - tSec) : 1;
    const beatBoost = beats.length
      ? Math.max(0, 1 - beatDist / Math.max(0.35, 60 / Math.max(bpm, 1)))
      : 0;

    const wobble = Math.sin(i * 1.9 + bpm * 0.02) * 12;
    let val = 18 + wobble + beatBoost * 35;

    const fx = effects.find((e) => Math.abs(e.timestamp - tSec) < duration / samples / 1.5);
    if (fx) {
      const spike = effectSpikeY(fx.type);
      val = 160 - spike;
      points.push({
        time: timePct,
        val,
        effectId: fx.id,
        effectType: fx.type,
      });
      continue;
    }

    points.push({ time: timePct, val });
  }

  for (const fx of effects) {
    const timePct = (fx.timestamp / duration) * 100;
    const exists = points.some((p) => Math.abs(p.time - timePct) < 0.5);
    if (exists) continue;
    const val = 160 - effectSpikeY(fx.type);
    points.push({
      time: timePct,
      val,
      effectId: fx.id,
      effectType: fx.type,
    });
  }

  return points.sort((a, b) => a.time - b.time);
}

function valToY(val: number, zeroY: number) {
  return zeroY - (val / VAL_MAX) * (SVG_HEIGHT / 2 - 20);
}

export function BeatGraphEditor() {
  const {
    breakdown,
    nle,
    currentTime,
    setCurrentTime,
    isPlaying,
    togglePlay,
    selectedEffectId,
    setSelectedEffectId,
  } = useBreakdown();

  const theme = getNleTheme(nle);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [hover, setHover] = useState<{ x: number; time: number; pt?: GraphPoint } | null>(null);

  const duration = breakdown?.trackDuration ?? 0;
  const beats = breakdown?.beatTimestamps ?? [];
  const effects = breakdown?.effects ?? [];
  const bpm = breakdown?.bpm ?? 120;

  const keyframes = useMemo(
    () => buildVelocityKeyframes(duration, beats, effects, bpm),
    [duration, beats, effects, bpm]
  );

  const zeroY = SVG_HEIGHT / 2;
  const points = useMemo(
    () =>
      keyframes.map((pt) => ({
        ...pt,
        x: (pt.time / 100) * SVG_WIDTH,
        y: valToY(pt.val, zeroY),
      })),
    [keyframes, zeroY]
  );

  const pathD = points.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  const peakVal = useMemo(
    () => Math.max(...keyframes.map((k) => Math.abs(k.val)), 100),
    [keyframes]
  );

  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const seekAt = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el || duration <= 0) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      setCurrentTime(ratio * duration);
    },
    [duration, setCurrentTime]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    seekAt(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const time = ratio * duration;
    const nearest = points.reduce((best, pt) =>
      Math.abs(pt.time - ratio * 100) < Math.abs(best.time - ratio * 100) ? pt : best
    );
    setHover({ x: ratio * 100, time, pt: nearest });
    if (dragging.current) seekAt(e.clientX);
  };

  if (!breakdown) return null;

  return (
    <div className="select-none overflow-hidden rounded-xl border border-zinc-800 bg-[#18181b] font-mono text-zinc-300 shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-[#121214] px-4 py-2.5 text-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="rounded-md bg-zinc-800 p-1.5 text-white transition hover:bg-zinc-700"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current" />
            )}
          </button>
          <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
            <Activity className="h-3.5 w-3.5 text-zinc-400" />
            Velocity & Beat Spike Graph
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-zinc-400">
          <span className="font-bold text-zinc-300">
            {Math.round(peakVal * 20)} units/sec peak
          </span>
          <span className="hidden text-zinc-500 sm:inline">Speed Graph Mode</span>
          <Maximize2 className="h-3.5 w-3.5 cursor-pointer transition hover:text-white" />
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative h-[220px] w-full cursor-crosshair overflow-hidden bg-[#1e1e22]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerLeave={() => setHover(null)}
      >
        <div className="pointer-events-none absolute inset-0 grid grid-cols-12 grid-rows-6 opacity-20">
          {Array.from({ length: 72 }).map((_, i) => (
            <div key={i} className="border-b border-r border-zinc-400/40" />
          ))}
        </div>

        <div className="pointer-events-none absolute bottom-0 left-2 top-0 flex flex-col justify-between py-2 font-mono text-[9px] text-zinc-500">
          <span>+3000</span>
          <span>+2000</span>
          <span>+1000</span>
          <span className="text-zinc-400">0</span>
          <span>-1000</span>
          <span>-2000</span>
        </div>

        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <line
            x1={0}
            y1={zeroY}
            x2={SVG_WIDTH}
            y2={zeroY}
            stroke="#3f3f46"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <path
            d={pathD}
            fill="none"
            stroke="#ffffff"
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
          {points.map((pt, i) => (
            <rect
              key={`${pt.time}-${i}`}
              x={pt.x - 3}
              y={pt.y - 3}
              width={6}
              height={6}
              fill={pt.effectId && selectedEffectId === pt.effectId ? theme.playhead : '#ffffff'}
              stroke="#09090b"
              strokeWidth={1}
              className="cursor-pointer transition-transform hover:scale-150"
              onClick={(e) => {
                e.stopPropagation();
                if (pt.effectId) {
                  setSelectedEffectId(pt.effectId);
                  setCurrentTime((pt.time / 100) * duration);
                }
              }}
            />
          ))}
        </svg>

        <div
          className="pointer-events-none absolute bottom-0 top-0 z-10 w-0.5 bg-red-500"
          style={{ left: `${playheadPct}%` }}
        >
          <div className="-mt-1 h-3 w-3 -translate-x-[5px] rotate-45 bg-red-500 shadow-md" />
        </div>

        {hover && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-none absolute bottom-full z-40 mb-2 w-48 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900 p-2 shadow-xl"
            style={{ left: `${hover.x}%` }}
          >
            <p className="font-mono text-[10px] text-zinc-300">
              {formatTimestamp(hover.time)}
              {hover.pt?.effectType ? ` — ${hover.pt.effectType}` : ''}
            </p>
            {hover.pt?.effectId && (
              <p className="mt-0.5 line-clamp-2 text-[9px] text-zinc-500">
                {effects.find((e) => e.id === hover.pt?.effectId)?.description}
              </p>
            )}
          </motion.div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-800 bg-[#121214] px-4 py-2 text-[11px] text-zinc-400">
        <div className="flex items-center gap-3">
          <span className="font-mono text-zinc-200">
            {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
          </span>
          <span className="text-zinc-600">|</span>
          <span style={{ color: theme.playhead }}>Keyframe Snap: Enabled</span>
        </div>
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
          [Space] Play · Click graph to scrub
        </span>
      </div>
    </div>
  );
}
