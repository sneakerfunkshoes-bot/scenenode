'use client';

import { useCallback, useMemo, useRef } from 'react';
import { Activity } from 'lucide-react';
import type { BreakdownEffect } from '@/types/breakdown';
import { effectSpikeY } from '@/types/breakdown';

const GRAPH_WIDTH = 600;
const GRAPH_HEIGHT = 120;
const ZERO_Y = 60;

interface GraphPoint {
  x: number;
  y: number;
  time: number;
  effectId?: string;
}

function buildBeatGraphPoints(
  duration: number,
  beats: number[],
  effects: BreakdownEffect[],
  bpm: number
): GraphPoint[] {
  if (duration <= 0) {
    return [
      { x: 0, y: 80, time: 0 },
      { x: GRAPH_WIDTH, y: 70, time: 0 },
    ];
  }

  const samples = 14;
  const points: GraphPoint[] = [];

  for (let i = 0; i <= samples; i++) {
    const tSec = (i / samples) * duration;
    const x = (tSec / duration) * GRAPH_WIDTH;

    const nearestBeat = beats.length
      ? beats.reduce((best, beat) =>
          Math.abs(beat - tSec) < Math.abs(best - tSec) ? beat : best
        )
      : tSec;
    const beatDist = beats.length ? Math.abs(nearestBeat - tSec) : 1;
    const beatBoost = beats.length
      ? Math.max(0, 1 - beatDist / Math.max(0.35, 60 / Math.max(bpm, 1)))
      : 0;

    const wobble = Math.sin(i * 1.7 + bpm * 0.02) * 8;
    let y = 78 - wobble - beatBoost * 55;

    const fx = effects.find((e) => Math.abs(e.timestamp - tSec) < duration / samples / 1.2);
    if (fx) {
      y = effectSpikeY(fx.type);
      points.push({ x, y, time: tSec, effectId: fx.id });
      continue;
    }

    points.push({ x, y, time: tSec });
  }

  for (const fx of effects) {
    const x = (fx.timestamp / duration) * GRAPH_WIDTH;
    const exists = points.some((p) => Math.abs(p.x - x) < 4);
    if (exists) continue;
    const y = effectSpikeY(fx.type);
    points.push({ x, y, time: fx.timestamp, effectId: fx.id });
  }

  return points.sort((a, b) => a.x - b.x);
}

interface InspectBeatGraphProps {
  duration: number;
  beats: number[];
  effects: BreakdownEffect[];
  bpm: number;
  selectedEffectId: string | null;
  onSelectEffect: (id: string, time: number) => void;
}

export function InspectBeatGraph({
  duration,
  beats,
  effects,
  bpm,
  selectedEffectId,
  onSelectEffect,
}: InspectBeatGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const points = useMemo(
    () => buildBeatGraphPoints(duration, beats, effects, bpm),
    [duration, beats, effects, bpm]
  );

  const pathD = points.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  const seekAt = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el || duration <= 0) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const time = ratio * duration;
      const nearest = points.reduce((best, pt) =>
        Math.abs(pt.time - time) < Math.abs(best.time - time) ? pt : best
      );
      if (nearest.effectId && Math.abs(nearest.time - time) < 0.5) {
        onSelectEffect(nearest.effectId, nearest.time);
      }
    },
    [duration, points, onSelectEffect]
  );

  return (
    <div className="space-y-2 rounded-2xl border border-zinc-700 bg-[#121212] p-4">
      <div className="flex items-center justify-between font-mono text-xs text-zinc-400">
        <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
          <Activity className="h-4 w-4 text-zinc-400" />
          Audio Velocity & Beat Spike Graph
        </span>
        <span className="flex items-center gap-1 text-[11px] font-bold text-zinc-400">
          Audio Sync Locked
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative h-[120px] w-full cursor-crosshair overflow-hidden rounded-xl border border-zinc-800 bg-[#0c0c0c] sm:h-[140px]"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          seekAt(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons !== 1) return;
          seekAt(e.clientX);
        }}
      >
        <div className="pointer-events-none absolute inset-0 grid grid-cols-12 grid-rows-4 opacity-15">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="border-b border-r border-zinc-700" />
          ))}
        </div>

        <svg
          viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <line
            x1={0}
            y1={ZERO_Y}
            x2={GRAPH_WIDTH}
            y2={ZERO_Y}
            stroke="#3f3f46"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <path
            d={pathD}
            fill="none"
            stroke="#a1a1aa"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {points.map((pt, i) => (
            <rect
              key={`${pt.x}-${i}`}
              x={pt.x - 3}
              y={pt.y - 3}
              width={6}
              height={6}
              fill={pt.effectId && selectedEffectId === pt.effectId ? '#d4d4d8' : '#ffffff'}
              stroke="#09090b"
              strokeWidth={1}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (pt.effectId) onSelectEffect(pt.effectId, pt.time);
              }}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
