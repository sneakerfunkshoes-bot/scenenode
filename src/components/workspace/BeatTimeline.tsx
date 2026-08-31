'use client';

import type { BeatMarker } from '@/types';
import { cn } from '@/lib/utils';

interface BeatTimelineProps {
  beats: BeatMarker[];
  duration: number;
}

export function BeatTimeline({ beats, duration }: BeatTimelineProps) {
  return (
    <div className="glass-panel rounded-md p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-silver-dim">
          Beat Timeline
        </h3>
        <span className="font-mono text-[10px] text-silver-dim">
          {duration.toFixed(1)}s
        </span>
      </div>
      <div className="relative h-16 overflow-hidden rounded-sm border border-silver/10 bg-obsidian/80">
        {/* Grid lines */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r border-silver/[0.04]"
            />
          ))}
        </div>
        {/* Playhead hint */}
        <div className="absolute bottom-0 left-0 top-0 w-px bg-silver/50" />
        {/* Beat markers */}
        {beats.map((beat) => {
          const left = (beat.time / duration) * 100;
          const isDownbeat = beat.intensity >= 0.95;
          return (
            <div
              key={beat.id}
              className={cn(
                'absolute bottom-0 w-px -translate-x-1/2',
                isDownbeat ? 'bg-silver' : 'bg-silver/45'
              )}
              style={{
                left: `${left}%`,
                height: isDownbeat ? '100%' : `${40 + beat.intensity * 40}%`,
              }}
              title={`${beat.time.toFixed(2)}s`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[9px] text-silver-dim">
        <span>0:00</span>
        <span>{`${Math.floor(duration / 60)}:${Math.floor(duration % 60)
          .toString()
          .padStart(2, '0')}`}</span>
      </div>
    </div>
  );
}
