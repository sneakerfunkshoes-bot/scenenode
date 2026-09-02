'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Pause, Play, Sparkles, Volume2 } from 'lucide-react';
import { formatTimestamp } from '@/lib/utils';
import { youtubeVideoId, socialEmbedUrl } from '@/lib/video-url';
import { YouTubeInlinePlayer } from './YouTubeInlinePlayer';
import { SocialVideoEmbed } from './SocialVideoEmbed';
import { ReelPreviewFrame } from '@/components/deconstruct/ReelPreviewFrame';

interface InspectPreviewProps {
  sourceUrl: string;
  previewVideoUrl?: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onTimeChange: (time: number) => void;
  onPlayingChange: (playing: boolean) => void;
  selectedLabel?: string | null;
}

export function InspectPreview({
  sourceUrl,
  previewVideoUrl,
  duration,
  currentTime,
  isPlaying,
  onTogglePlay,
  onTimeChange,
  onPlayingChange,
  selectedLabel,
}: InspectPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytId = youtubeVideoId(sourceUrl);
  const hasLocalVideo = Boolean(previewVideoUrl);
  const hasYouTube = Boolean(ytId) && !hasLocalVideo;
  const hasSocial = Boolean(socialEmbedUrl(sourceUrl)) && !hasLocalVideo && !hasYouTube;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (Math.abs(video.currentTime - currentTime) < 0.12) return;
    video.currentTime = currentTime;
  }, [currentTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      void video.play().catch(() => onPlayingChange(false));
    } else {
      video.pause();
    }
  }, [isPlaying, onPlayingChange]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    onTimeChange(video.currentTime);
  }, [onTimeChange]);

  const handleScrub = useCallback(
    (value: number) => {
      onTimeChange(value);
      const video = videoRef.current;
      if (video) video.currentTime = value;
    },
    [onTimeChange]
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-950 px-3 py-2.5">
        <p className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <Sparkles className="h-3.5 w-3.5" />
          Source Video — Edit Alongside Breakdown
        </p>
        {selectedLabel ? (
          <span className="max-w-[50%] truncate rounded-full border border-zinc-700 bg-zinc-800 px-2.5 py-0.5 font-mono text-[10px] font-bold text-zinc-200">
            @ {formatTimestamp(currentTime)} · {selectedLabel}
          </span>
        ) : null}
      </div>

      <ReelPreviewFrame maxWidthClass="max-w-full">
        {hasLocalVideo ? (
          <video
            ref={videoRef}
            key={previewVideoUrl}
            src={previewVideoUrl!}
            className="absolute inset-0 h-full w-full object-contain"
            playsInline
            muted
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => onPlayingChange(true)}
            onPause={() => onPlayingChange(false)}
            onEnded={() => onPlayingChange(false)}
          />
        ) : hasYouTube && ytId ? (
          <YouTubeInlinePlayer
            videoId={ytId}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onTimeChange={onTimeChange}
            onPlayingChange={onPlayingChange}
          />
        ) : hasSocial ? (
          <SocialVideoEmbed sourceUrl={sourceUrl} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.18),_transparent_65%)] px-6 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-300">
              No inline preview
            </p>
            <p className="mt-2 max-w-sm text-xs text-zinc-400">
              Run a fresh inspect to download and play the source video here while you edit.
            </p>
          </div>
        )}

        {hasLocalVideo && selectedLabel ? (
          <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg border border-zinc-600 bg-black/70 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-zinc-200 backdrop-blur-sm">
            Moment @ {formatTimestamp(currentTime)}
          </div>
        ) : null}
      </ReelPreviewFrame>

      <div className="space-y-2 border-t border-zinc-800 px-3 py-3">
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.05}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => handleScrub(parseFloat(e.target.value))}
          disabled={!hasLocalVideo && !hasYouTube}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-950 accent-zinc-400 disabled:opacity-40"
          aria-label="Scrub video timeline"
        />

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onTogglePlay}
            disabled={!hasLocalVideo && !hasYouTube}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-40"
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <span className="font-mono text-[11px] text-zinc-400">
            {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
          </span>
          {hasLocalVideo ? (
            <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              <Volume2 className="h-3 w-3" />
              Audio on
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
