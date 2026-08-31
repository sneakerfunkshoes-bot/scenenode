'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Pause,
  Play,
} from 'lucide-react';
import { cn, formatTimestamp } from '@/lib/utils';
import type { AnnotationView } from '@/lib/deconstruct-view-model';
import { youtubeVideoId } from '@/lib/video-url';
import { YouTubeInlinePlayer } from '@/components/inspect/YouTubeInlinePlayer';

interface ReferenceVideoPanelProps {
  videoUrl: string;
  previewVideoUrl?: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  annotations: AnnotationView[];
  onTogglePlay: () => void;
  onTimeChange: (t: number) => void;
  onPlayingChange: (playing: boolean) => void;
}

export function ReferenceVideoPanel({
  videoUrl,
  previewVideoUrl,
  duration,
  currentTime,
  isPlaying,
  annotations,
  onTogglePlay,
  onTimeChange,
  onPlayingChange,
}: ReferenceVideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [activeAnn, setActiveAnn] = useState<AnnotationView | null>(null);
  const ytId = youtubeVideoId(videoUrl);
  const hasLocal = Boolean(previewVideoUrl);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Math.abs(video.currentTime - currentTime) < 0.12) return;
    video.currentTime = currentTime;
  }, [currentTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) void video.play().catch(() => onPlayingChange(false));
    else video.pause();
  }, [isPlaying, onPlayingChange]);

  const stepFrame = (dir: -1 | 1) => {
    onPlayingChange(false);
    onTimeChange(Math.max(0, Math.min(duration, currentTime + dir * (1 / 24))));
  };

  const onScrub = useCallback(
    (value: number) => {
      onTimeChange(value);
      if (videoRef.current) videoRef.current.currentTime = value;
    },
    [onTimeChange]
  );

  return (
    <section className="flex h-auto min-h-0 flex-col justify-start rounded-xl bg-zinc-900/35 p-3 sm:p-4">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-2 sm:mb-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Reference Video
        </h3>
        <button
          type="button"
          onClick={() => {
            setShowAnnotations((v) => !v);
            setActiveAnn(null);
          }}
          className={cn(
            'rounded-md px-2 py-1 text-[10px] transition',
            showAnnotations
              ? 'bg-zinc-800/80 text-zinc-300'
              : 'text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300'
          )}
          aria-pressed={showAnnotations}
        >
          Analysis Markers
        </button>
      </div>

      <div className="relative mx-auto w-full max-w-[320px] shrink-0">
        <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-black ring-1 ring-zinc-800/80">
          {hasLocal ? (
            <video
              ref={videoRef}
              src={previewVideoUrl || undefined}
              className="h-full w-full object-contain"
              playsInline
              preload="metadata"
              onTimeUpdate={() => {
                if (videoRef.current) onTimeChange(videoRef.current.currentTime);
              }}
              onEnded={() => onPlayingChange(false)}
            />
          ) : ytId ? (
            <YouTubeInlinePlayer
              videoId={ytId}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onTimeChange={onTimeChange}
              onPlayingChange={onPlayingChange}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-xs text-zinc-500">
              Preview unavailable
            </div>
          )}

          {showAnnotations ? (
            <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
              {annotations.map((a) => (
                <g key={a.id}>
                  <line
                    x1={`${a.x + 6}%`}
                    y1={`${a.y + 4}%`}
                    x2={`${a.anchorX}%`}
                    y2={`${a.anchorY}%`}
                    stroke="rgba(148,163,184,0.45)"
                    strokeWidth="1"
                  />
                  <circle
                    cx={`${a.anchorX}%`}
                    cy={`${a.anchorY}%`}
                    r="2.5"
                    fill="rgba(186,230,253,0.85)"
                  />
                </g>
              ))}
            </svg>
          ) : null}

          {showAnnotations
            ? annotations.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setActiveAnn((cur) => (cur?.id === a.id ? null : a))}
                  className="absolute z-10 -translate-x-1 -translate-y-1 rounded border border-sky-500/25 bg-black/70 px-1.5 py-0.5 text-[9px] text-sky-100/90 backdrop-blur-sm transition hover:border-sky-400/50"
                  style={{ left: `${a.x}%`, top: `${a.y}%` }}
                >
                  {a.label}
                </button>
              ))
            : null}

          {hasLocal || ytId ? (
            <button
              type="button"
              onClick={onTogglePlay}
              className={cn(
                'absolute inset-0 z-[15] flex items-center justify-center transition',
                isPlaying
                  ? 'pointer-events-none bg-transparent opacity-0'
                  : 'bg-black/35'
              )}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-lg">
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="ml-0.5 h-6 w-6" />
                )}
              </span>
            </button>
          ) : null}

          {activeAnn ? (
            <div
              className="absolute z-20 max-w-[150px] rounded-lg border border-zinc-700 bg-zinc-950/95 p-2 shadow-xl"
              style={{
                left: `${Math.min(55, activeAnn.x)}%`,
                top: `${Math.min(72, activeAnn.y + 8)}%`,
              }}
            >
              <p className="text-[10px] font-semibold text-zinc-100">{activeAnn.label}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-zinc-400">{activeAnn.detail}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 shrink-0 space-y-2 sm:mt-5">
        <input
          type="range"
          min={0}
          max={Math.max(duration, 0.1)}
          step={0.01}
          value={currentTime}
          onChange={(e) => onScrub(Number(e.target.value))}
          className="w-full accent-zinc-300"
          aria-label="Scrub timeline"
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => stepFrame(-1)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Previous frame"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-black hover:bg-zinc-200"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => stepFrame(1)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Next frame"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="ml-auto font-mono text-[11px] text-zinc-500">
            {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
          </p>
          <button
            type="button"
            className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
