'use client';

import { useMemo } from 'react';
import {
  ChevronRight,
  Eye,
  FolderTree,
  ListOrdered,
  Music,
  Sliders,
  Sticker,
} from 'lucide-react';
import { useBreakdown } from '@/context/BreakdownContext';
import { ExportPresetButton } from './ExportPresetButton';
import { AudioBeatGraph } from './AudioBeatGraph';
import { cn, formatTimestamp } from '@/lib/utils';
import { toInspectorEffectView } from '@/lib/edit-inspector-meta';

export function EditInspector() {
  const {
    breakdown,
    nle,
    selectedEffectId,
    setSelectedEffectId,
    setCurrentTime,
  } = useBreakdown();

  const inspectorEffects = useMemo(() => {
    const sorted = [...(breakdown?.effects ?? [])].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    return sorted.map((fx, i) =>
      toInspectorEffectView(fx, nle, i, sorted, breakdown?.bpm ?? 128)
    );
  }, [breakdown?.effects, breakdown?.bpm, nle]);

  const selected =
    inspectorEffects.find((fx) => fx.id === selectedEffectId) ?? inspectorEffects[0] ?? null;

  if (!breakdown) return null;

  const selectEffect = (id: string, time: number) => {
    setSelectedEffectId(id);
    setCurrentTime(time);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-8 font-sans text-zinc-100 select-none">
      <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-zinc-400">
            <Music className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-white">
              {breakdown.songTitle} — {breakdown.songArtist}
            </h2>
            <span className="font-mono text-[10px] text-zinc-400">
              {breakdown.bpm} BPM · Visual Scene & FX Sync
            </span>
          </div>
        </div>

        <span className="rounded-lg border border-zinc-700/80 bg-zinc-800 px-2.5 py-1 font-mono text-[11px] text-zinc-300">
          Edit Duration: {formatTimestamp(breakdown.trackDuration)}
        </span>
      </div>

      <AudioBeatGraph />

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 space-y-2.5 lg:col-span-5">
          <h3 className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <Sliders className="h-3.5 w-3.5 text-zinc-400" />
            Timeline Breakdown ({inspectorEffects.length})
          </h3>

          <div className="space-y-2">
            {inspectorEffects.map((fx) => (
              <button
                key={fx.id}
                type="button"
                onClick={() => selectEffect(fx.id, fx.time)}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between rounded-xl border p-3 transition',
                  selected?.id === fx.id
                    ? 'border-zinc-500 bg-zinc-900 shadow-md'
                    : 'border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700'
                )}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="shrink-0 whitespace-nowrap rounded border border-zinc-700 bg-zinc-800 px-2 py-1 font-mono text-[10px] font-bold text-zinc-300">
                    {fx.timestamp}
                  </span>
                  <div className="min-w-0 text-left">
                    <h4 className="line-clamp-1 text-xs font-bold text-white">{fx.name}</h4>
                    <span className="font-mono text-[10px] text-zinc-400">{fx.category}</span>
                  </div>
                </div>

                <ChevronRight
                  className={cn(
                    'h-4 w-4 shrink-0 transition',
                    selected?.id === fx.id ? 'translate-x-0.5 text-zinc-400' : 'text-zinc-600'
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-12 flex flex-col justify-between space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 lg:col-span-7">
          {selected ? (
            <>
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase text-zinc-400">
                      {selected.software}
                    </span>
                    <h3 className="text-base font-bold text-white">{selected.name}</h3>
                  </div>
                  <span className="rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 font-mono text-xs font-bold text-zinc-300">
                    {selected.timestamp}
                  </span>
                </div>

                <div className="space-y-1 rounded-xl border border-zinc-700 bg-zinc-900 p-3">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-zinc-400">
                    <Eye className="h-3.5 w-3.5" />
                    What Happens On Screen:
                  </span>
                  <p className="text-xs font-medium leading-relaxed text-zinc-200">
                    {selected.sceneContext}
                  </p>
                </div>

                <div className="space-y-1 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-zinc-400">
                    <Sticker className="h-3.5 w-3.5" />
                    Overlays & Stickers Used:
                  </span>
                  <p className="font-mono text-xs font-bold text-zinc-300">
                    {selected.overlayElements}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-800/80 bg-black/60 p-2.5">
                  <span className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-zinc-400">
                    <FolderTree className="h-3.5 w-3.5 text-zinc-400" />
                    Effect Location in Software:
                  </span>
                  <p className="font-mono text-xs text-zinc-300">{selected.location}</p>
                </div>

                <div className="space-y-1.5">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-zinc-400">
                    <ListOrdered className="h-3.5 w-3.5 text-zinc-400" />
                    How to Apply (Step-By-Step):
                  </span>

                  <div className="space-y-2 rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-3">
                    {selected.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 font-mono text-[10px] font-bold text-zinc-400">
                          {idx + 1}
                        </span>
                        <p className="leading-snug">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800 pt-3 font-mono text-[10px] text-zinc-500">
                <span>Category: {selected.category}</span>
                <span className="text-zinc-300">Ready to replicate</span>
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
