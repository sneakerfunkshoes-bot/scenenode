'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  ChevronRight,
  Eye,
  FolderTree,
  LayoutDashboard,
  Layers,
  ListOrdered,
  Palette,
  RotateCcw,
  Sliders,
  Sticker,
  Type,
  Volume2,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { condenseEffects } from '@/lib/effect-condense';
import { toInspectorEffectView } from '@/lib/edit-inspector-meta';
import type { NleSoftware, VideoBreakdownRecord } from '@/types/breakdown';
import { ExportMarkersButton } from '@/components/dashboard/ExportPresetButton';
import { InspectBeatGraph } from './InspectBeatGraph';
import { InspectPreview } from './InspectPreview';
import { InspectSongMeta } from './InspectSongMeta';
import { InspectUrlField } from './InspectUrlField';
import { LayerStackView } from './LayerStackView';
import { ParameterValuesCard } from './ParameterValuesCard';

interface InspectDashboardProps {
  breakdown: VideoBreakdownRecord;
  nle: NleSoftware;
  selectedEffectId: string | null;
  onSelectEffect: (id: string, time?: number) => void;
  onReset: () => void;
  warning?: string | null;
  sourceUrl?: string;
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onTimeChange: (time: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onOpenStudio: () => void;
  onCorrectSong: (title: string, artist: string) => void;
  onSubmitUrl?: (url: string) => void;
}

export function InspectDashboard({
  breakdown,
  nle,
  selectedEffectId,
  onSelectEffect,
  onReset,
  warning,
  sourceUrl,
  currentTime,
  isPlaying,
  onTogglePlay,
  onTimeChange,
  onPlayingChange,
  onOpenStudio,
  onCorrectSong,
  onSubmitUrl,
}: InspectDashboardProps) {
  const inspectorEffects = useMemo(() => {
    const main = condenseEffects(breakdown.effects);
    return main.map((fx, i) =>
      toInspectorEffectView(fx, nle, i, main, breakdown.bpm)
    );
  }, [breakdown.effects, breakdown.bpm, nle]);

  const selected =
    inspectorEffects.find((fx) => fx.id === selectedEffectId) ?? inspectorEffects[0] ?? null;

  const displayUrl = sourceUrl || breakdown.videoUrl;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-5xl space-y-5 px-4 pb-10 pt-6 font-sans text-zinc-100 select-none sm:px-6"
    >
      {warning ? (
        <p className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-300">
          {warning}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-[#27272a] bg-[#121212] px-3.5 py-2 font-mono text-xs text-zinc-400 transition hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
          Back to Inspector
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <ExportMarkersButton
            breakdown={breakdown}
            nle={nle}
            className="border-zinc-700 bg-[#121212] text-zinc-100 hover:bg-zinc-800"
          />
          <button
            type="button"
            onClick={onOpenStudio}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-600 bg-zinc-800 px-3.5 py-2 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-800"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Open in Studio
          </button>
        </div>
      </div>

      {onSubmitUrl ? (
        <InspectUrlField onSubmit={onSubmitUrl} variant="compact" submitLabel="Inspect" />
      ) : null}

      <InspectSongMeta breakdown={breakdown} onCorrectSong={onCorrectSong} />

      <InspectPreview
        sourceUrl={displayUrl}
        previewVideoUrl={breakdown.previewVideoUrl}
        duration={breakdown.trackDuration}
        currentTime={currentTime}
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
        onTimeChange={onTimeChange}
        onPlayingChange={onPlayingChange}
        selectedLabel={selected?.name}
      />

      <InspectBeatGraph
        duration={breakdown.trackDuration}
        beats={breakdown.beatTimestamps}
        effects={breakdown.effects}
        bpm={breakdown.bpm}
        selectedEffectId={selected?.id ?? null}
        onSelectEffect={onSelectEffect}
      />

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
                onClick={() => onSelectEffect(fx.id, fx.time)}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between rounded-xl border p-3 transition',
                  selected?.id === fx.id
                    ? 'border-zinc-500 bg-zinc-900'
                    : 'border-zinc-800 bg-[#121212] hover:border-zinc-700'
                )}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="shrink-0 whitespace-nowrap rounded border border-zinc-700 bg-[#0c0c0c] px-2 py-1 font-mono text-[10px] font-bold text-zinc-300">
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

        <div className="col-span-12 flex flex-col justify-between space-y-4 rounded-2xl border border-zinc-700 bg-[#121212] p-5 lg:col-span-7">
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
                    Visual Sequence Action
                  </span>
                  <p className="text-xs font-medium leading-relaxed text-zinc-200">
                    {selected.sceneContext}
                  </p>
                </div>

                <div className="space-y-1 rounded-xl border border-zinc-800 bg-[#0c0c0c] p-3">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-zinc-400">
                    <Type className="h-3.5 w-3.5" />
                    Glow Text & On-Screen Layer
                  </span>
                  <p className="font-mono text-xs font-bold text-zinc-300">
                    {selected.overlayElements}
                  </p>
                </div>

                <div className="space-y-1 rounded-xl border border-zinc-800 bg-[#0c0c0c] p-3">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-zinc-400">
                    <Palette className="h-3.5 w-3.5" />
                    Global CC & Color Tone
                  </span>
                  <p className="text-xs font-medium text-zinc-300">{selected.globalCC}</p>
                </div>

                <div className="space-y-1 rounded-xl border border-zinc-800 bg-[#0c0c0c] p-3">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-zinc-400">
                    <Volume2 className="h-3.5 w-3.5" />
                    Audio Beat Syncing
                  </span>
                  <p className="text-xs font-medium text-zinc-300">{selected.audioSync}</p>
                  {selected.audioTransient ? (
                    <p className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-[11px] text-zinc-300">
                      {selected.audioTransient.frequencyHz
                        ? `${selected.audioTransient.frequencyHz}Hz `
                        : ''}
                      {selected.audioTransient.trigger} → {selected.audioTransient.visualResponse}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-zinc-400">
                    <Layers className="h-3.5 w-3.5 text-zinc-400" />
                    Compositing Layer Stack
                  </span>
                  <LayerStackView layers={selected.layerStack} />
                </div>

                <div className="space-y-1.5">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-zinc-400">
                    <Sticker className="h-3.5 w-3.5 text-zinc-400" />
                    Exact Parameter Values
                  </span>
                  <ParameterValuesCard parameters={selected.parameters} />
                </div>

                <div className="rounded-xl border border-zinc-800 bg-black/40 p-2.5">
                  <span className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-zinc-400">
                    <FolderTree className="h-3.5 w-3.5 text-zinc-400" />
                    Software Tool Path
                  </span>
                  <p className="font-mono text-xs text-zinc-300">{selected.location}</p>
                </div>

                <div className="space-y-1.5">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-zinc-400">
                    <Wand2 className="h-3.5 w-3.5 text-zinc-400" />
                    <ListOrdered className="h-3.5 w-3.5" />
                    Detailed Micro-Step Replication
                  </span>
                  <div className="space-y-2 rounded-xl border border-zinc-800 bg-[#0c0c0c] p-3">
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
                <span className="flex items-center gap-1 font-bold text-zinc-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Full FX Map Ready
                </span>
              </div>
            </>
          ) : (
            <p className="py-12 text-center text-sm text-zinc-500">No effects detected yet.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
