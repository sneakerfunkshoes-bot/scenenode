'use client';

import { useMemo } from 'react';
import {
  Info,
  Music,
  Pause,
  Play,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { useBreakdown } from '@/context/BreakdownContext';
import { ExportPresetButton } from './ExportPresetButton';
import { cn } from '@/lib/utils';
import { nearestEffectId, toTimelineEffectView } from '@/lib/timeline-effect-meta';

export function EditBreakdownDashboard() {
  const {
    breakdown,
    nle,
    currentTime,
    setCurrentTime,
    isPlaying,
    togglePlay,
    isMuted,
    toggleMute,
    volume,
    setVolume,
    selectedEffectId,
    setSelectedEffectId,
    activeTutorialSteps,
  } = useBreakdown();

  const duration = breakdown?.trackDuration ?? 0;

  const timelineEffects = useMemo(
    () => (breakdown?.effects ?? []).map(toTimelineEffectView),
    [breakdown?.effects]
  );

  const selected =
    timelineEffects.find((fx) => fx.id === selectedEffectId) ?? timelineEffects[0] ?? null;

  if (!breakdown) return null;

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    const id = nearestEffectId(timelineEffects, time);
    if (id) setSelectedEffectId(id);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-8 font-sans text-zinc-100">
      {/* Song header + audio controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-400 shadow-inner">
            <Music className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                {breakdown.songTitle} — {breakdown.songArtist}
              </h2>
              <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                {breakdown.bpm} BPM
              </span>
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">
              Edit audio track · includes SFX, bass boosts · profile: {nle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-zinc-800/80 bg-zinc-950 px-4 py-2">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-black transition hover:bg-zinc-100"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            )}
          </button>

          <div className="flex items-center gap-2 border-l border-zinc-800 pl-3">
            <button type="button" onClick={toggleMute} className="text-zinc-400">
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4 text-zinc-500" />
              ) : (
                <Volume2 className="h-4 w-4 text-zinc-400" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseInt(e.target.value, 10))}
              className="h-1.5 w-20 cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-zinc-400"
            />
            <span className="w-8 font-mono text-[11px] text-zinc-400">{volume}%</span>
          </div>
        </div>
      </div>

      {/* Interactive timeline */}
      <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
        <div className="flex items-center justify-between font-mono text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
            <Sliders className="h-4 w-4 text-zinc-400" />
            Edit Timeline
          </span>
          <span>
            {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
          </span>
        </div>

        <div className="relative pb-1 pt-2">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.01}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="relative z-10 h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-zinc-400"
          />
          <div className="pointer-events-none absolute left-0 right-0 top-2 h-2">
            {timelineEffects.map((fx) => (
              <button
                key={fx.id}
                type="button"
                style={{ left: `${duration > 0 ? (fx.time / duration) * 100 : 0}%` }}
                className={cn(
                  'pointer-events-auto absolute top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full border',
                  selectedEffectId === fx.id
                    ? 'z-20 scale-125 border-white bg-zinc-300'
                    : 'border-zinc-900 bg-zinc-500'
                )}
                onClick={() => {
                  setSelectedEffectId(fx.id);
                  setCurrentTime(fx.time);
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Effects list + detail */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 space-y-3 lg:col-span-6">
          <h3 className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <Zap className="h-4 w-4 text-zinc-400" />
            Applied Edit Effects ({timelineEffects.length})
          </h3>

          <div className="space-y-2">
            {timelineEffects.map((fx) => (
              <button
                key={fx.id}
                type="button"
                onClick={() => {
                  setSelectedEffectId(fx.id);
                  handleSeek(fx.time);
                }}
                className={cn(
                  'flex w-full cursor-pointer items-start justify-between rounded-xl border p-4 text-left transition',
                  selectedEffectId === fx.id
                    ? 'border-zinc-500 bg-zinc-900 shadow-lg'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-300">
                      {fx.timestamp}
                    </span>
                    <span className="text-xs font-bold text-white">{fx.title}</span>
                  </div>
                  <p className="line-clamp-2 text-[11px] text-zinc-400">{fx.explanation}</p>
                </div>
                <span className="shrink-0 rounded border border-zinc-700/50 bg-zinc-800/80 px-2 py-1 font-mono text-[10px] text-zinc-400">
                  {fx.category}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-12 flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 lg:col-span-6">
          {selected ? (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                    <Info className="h-4 w-4" />
                    Detailed Effect Breakdown
                  </span>
                  <span className="font-mono text-xs font-bold text-zinc-400">
                    {selected.timestamp}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{selected.title}</h4>
                  <p className="mt-2 rounded-xl border border-zinc-800/80 bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-300">
                    {selected.explanation}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="font-mono text-[11px] uppercase text-zinc-400">
                    Exact Value Breakdown:
                  </span>
                  <div className="space-y-2 rounded-xl border border-zinc-800/80 bg-zinc-950 p-3">
                    {selected.parameters.map((param) => (
                      <div
                        key={param.label}
                        className="flex items-center justify-between font-mono text-xs"
                      >
                        <span className="text-zinc-400">{param.label}:</span>
                        <span className="font-bold text-zinc-300">{param.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {activeTutorialSteps.length > 0 && (
                  <div className="space-y-2 border-t border-zinc-800 pt-3">
                    <span className="text-[11px] font-semibold uppercase text-zinc-500">
                      {nle} recreation steps
                    </span>
                    {activeTutorialSteps.slice(0, 3).map((step) => (
                      <p key={step.order} className="text-[11px] text-zinc-400">
                        <strong className="text-zinc-200">
                          {step.order}. {step.title}
                        </strong>{' '}
                        — {step.detail}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1 text-zinc-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Effect Status: Active
                </span>
                <span>Category: {selected.category}</span>
              </div>
            </>
          ) : (
            <p className="py-12 text-center text-sm text-zinc-500">No effects detected yet.</p>
          )}
        </div>
      </div>

      <ExportPresetButton />
    </div>
  );
}
