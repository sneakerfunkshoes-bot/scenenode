'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalyzedBeat, BeatEnvelopePoint, NleSoftware, VideoBreakdownRecord } from '@/types/breakdown';
import {
  buildAnalysisSummary,
  buildAnnotations,
  buildBeatEnvelope,
  buildBeatPeaks,
  buildColorStyleHint,
  buildColorTone,
  buildEffectCards,
  buildTransitionCards,
  buildPacingEvents,
  buildRecreationSteps,
  buildTimelineFrames,
  stepForTime,
  type EffectCardView,
} from '@/lib/deconstruct-view-model';
import { trackClientError } from '@/lib/client-analytics';
import { analyzeVideoAudio } from '@/lib/audio-beat-analyze';
import { ColorGradingPanel } from './ColorGradingPanel';
import { PresetRecipePanel } from './PresetRecipePanel';
import { MasterTimeline } from './MasterTimeline';
import { RecreationGuide } from './RecreationGuide';
import { ReferenceVideoPanel } from './ReferenceVideoPanel';
import { DeconstructChat } from './DeconstructChat';
import { NleSelectorCompact } from './NleSelectorCompact';
import { WorkspaceShell, type WorkspaceNavId } from './WorkspaceShell';
import { WorkspaceLibrary, type LibraryMode } from './WorkspaceLibrary';
import type { InspectHistoryItem } from '@/lib/inspect-history';

interface DeconstructCompleteProps {
  breakdown: VideoBreakdownRecord;
  nle: NleSoftware;
  sourceUrl: string;
  currentTime: number;
  isPlaying: boolean;
  selectedEffectId: string | null;
  onSelectEffect: (id: string, time?: number) => void;
  onTogglePlay: () => void;
  onTimeChange: (t: number) => void;
  onPlayingChange: (p: boolean) => void;
  onOpenStudio: () => void;
  onReset: () => void;
  warning?: string | null;
  activeNav?: WorkspaceNavId;
  onNavChange?: (id: WorkspaceNavId) => void;
  libraryMode?: LibraryMode | null;
  onOpenHistoryItem?: (item: InspectHistoryItem) => void;
  onNleChange?: (nle: NleSoftware) => void;
  guideTitle?: string;
}

export function DeconstructComplete({
  breakdown,
  nle,
  sourceUrl,
  currentTime,
  isPlaying,
  selectedEffectId,
  onSelectEffect,
  onTogglePlay,
  onTimeChange,
  onPlayingChange,
  onReset,
  warning,
  activeNav = 'dashboard',
  onNavChange,
  libraryMode = null,
  onOpenHistoryItem,
  onNleChange,
  guideTitle = 'Recreation Guide',
}: DeconstructCompleteProps) {
  const [mobileTab, setMobileTab] = useState<'recipes' | 'color' | 'guide'>('recipes');
  const [activeStep, setActiveStep] = useState(1);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [liveBeats, setLiveBeats] = useState<AnalyzedBeat[] | null>(null);
  const [liveEnvelope, setLiveEnvelope] = useState<BeatEnvelopePoint[] | null>(null);
  const [beatStatus, setBeatStatus] = useState<'idle' | 'running' | 'ready' | 'error'>('idle');

  const color = useMemo(() => buildColorTone(breakdown), [breakdown]);
  const colorHint = useMemo(() => buildColorStyleHint(breakdown), [breakdown]);
  const pacing = useMemo(() => buildPacingEvents(breakdown), [breakdown]);
  const beats = useMemo(
    () => buildBeatPeaks(breakdown, liveBeats),
    [breakdown, liveBeats]
  );
  const envelope = useMemo(
    () => buildBeatEnvelope(breakdown, beats, liveEnvelope),
    [breakdown, beats, liveEnvelope]
  );
  const steps = useMemo(() => buildRecreationSteps(breakdown, nle), [breakdown, nle]);
  const effects = useMemo(() => buildEffectCards(breakdown.effects), [breakdown.effects]);
  const transitions = useMemo(
    () => buildTransitionCards(breakdown.effects),
    [breakdown.effects]
  );
  const frames = useMemo(() => buildTimelineFrames(breakdown), [breakdown]);
  const annotations = useMemo(() => buildAnnotations(breakdown), [breakdown]);
  const summary = useMemo(() => buildAnalysisSummary(breakdown), [breakdown]);

  const selectedEffect =
    [...effects, ...transitions].find((fx) => fx.id === selectedEffectId) ??
    effects[0] ??
    transitions[0] ??
    null;

  useEffect(() => {
    setActiveStep(stepForTime(steps, [...effects, ...transitions], currentTime));
  }, [currentTime, steps, effects, transitions, selectedEffectId]);

  useEffect(() => {
    setSidebarVisible(Boolean(libraryMode));
  }, [libraryMode]);

  useEffect(() => {
    const src = breakdown.previewVideoUrl;
    const canDecode = (() => {
      if (!src) return false;
      if (src.startsWith('blob:') || src.startsWith('data:') || src.startsWith('/')) return true;
      try {
        return new URL(src, window.location.origin).origin === window.location.origin;
      } catch {
        return false;
      }
    })();

    if (!canDecode || !src) {
      setLiveBeats(null);
      setLiveEnvelope(null);
      setBeatStatus('idle');
      return;
    }

    let cancelled = false;
    setBeatStatus('running');
    void analyzeVideoAudio(src)
      .then((result) => {
        if (cancelled) return;
        setLiveBeats(result.beats);
        setLiveEnvelope(result.envelope);
        setBeatStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setLiveBeats(null);
        setLiveEnvelope(null);
        setBeatStatus('error');
        trackClientError('beat-analysis', 'Client beat decode failed');
      });

    return () => {
      cancelled = true;
    };
  }, [breakdown.id, breakdown.previewVideoUrl]);

  const jumpTo = (time: number, effectId?: string) => {
    onPlayingChange(false);
    onTimeChange(time);
    if (effectId) onSelectEffect(effectId, time);
  };

  const onEffect = (fx: EffectCardView) => {
    jumpTo(fx.time, fx.id);
  };

  const summaryMetrics = (
    <>
      <span className="inline-flex items-center gap-1.5 text-emerald-400/90">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Analysis Complete
      </span>
      <span className="text-zinc-700" aria-hidden>
        ·
      </span>
      <span className="font-mono text-zinc-400">{summary.durationLabel}</span>
      <span className="text-zinc-700" aria-hidden>
        ·
      </span>
      <span>{summary.scenes} Scenes</span>
      <span className="text-zinc-700" aria-hidden>
        ·
      </span>
      <span>{summary.cuts} Cuts</span>
      <span className="text-zinc-700" aria-hidden>
        ·
      </span>
      <span>{beats.length} Beats</span>
    </>
  );

  const actions = (
    <button
      type="button"
      onClick={onReset}
      className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
    >
      New Analysis
    </button>
  );

  const videoPanel = (
    <ReferenceVideoPanel
      videoUrl={sourceUrl || breakdown.videoUrl}
      previewVideoUrl={breakdown.previewVideoUrl}
      duration={breakdown.trackDuration}
      currentTime={currentTime}
      isPlaying={isPlaying}
      annotations={annotations}
      onTogglePlay={onTogglePlay}
      onTimeChange={onTimeChange}
      onPlayingChange={onPlayingChange}
    />
  );

  const askAi = (
    <DeconstructChat
      nle={nle}
      breakdown={breakdown}
      selectedEffectId={selectedEffect?.id}
      currentTime={currentTime}
      variant="inline"
    />
  );

  const guide = (
    <RecreationGuide
      steps={steps}
      activeStepOrder={activeStep}
      highlightedEffectId={selectedEffect?.id}
      onActiveStepChange={setActiveStep}
      title={guideTitle}
      footerTop={askAi}
      onFocusStep={(s) => {
        if (s.effectId) {
          const fx = [...effects, ...transitions].find((e) => e.id === s.effectId);
          if (fx) jumpTo(fx.time, fx.id);
        }
      }}
    />
  );

  const centerStack = (
    <div className="flex min-w-0 flex-col gap-3">
      <MasterTimeline
        frames={frames}
        beats={beats}
        envelope={envelope}
        cuts={pacing}
        effects={effects}
        transitions={transitions}
        duration={breakdown.trackDuration}
        currentTime={currentTime}
        selectedEffectId={selectedEffect?.id}
        beatStatus={beatStatus}
        onSeek={jumpTo}
      />
      <PresetRecipePanel
        effects={effects}
        selectedId={selectedEffect?.id}
        onSelect={onEffect}
      />
    </div>
  );

  const colorBand = (
    <ColorGradingPanel data={color} styleHint={colorHint} layout="band" />
  );

  return (
    <WorkspaceShell
      title={
        libraryMode === 'projects'
          ? 'My Projects'
          : libraryMode === 'history'
            ? 'History'
            : 'Reference Edit Analysis'
      }
      status={libraryMode ? (
        <span>{libraryMode === 'projects' ? 'Saved analyses' : 'Recent analyses'}</span>
      ) : null}
      summary={libraryMode ? undefined : summaryMetrics}
      actions={libraryMode ? undefined : actions}
      toolbar={
        libraryMode || !onNleChange ? undefined : (
          <NleSelectorCompact value={nle} onChange={onNleChange} label="Recreate in" />
        )
      }
      activeNav={activeNav}
      onNavChange={onNavChange}
      sidebarVisible={sidebarVisible}
      onSidebarToggle={() => setSidebarVisible((v) => !v)}
    >
      {libraryMode && onOpenHistoryItem ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <WorkspaceLibrary
            mode={libraryMode}
            onOpen={onOpenHistoryItem}
            onNewAnalysis={onReset}
          />
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          {warning ? (
            <p className="shrink-0 bg-zinc-900/40 px-4 py-2 text-xs text-zinc-400">{warning}</p>
          ) : null}

          {/* Mobile layout — reel preview pinned above tabs */}
          <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden md:hidden">
            <div className="shrink-0 border-b border-zinc-800/60 p-3">{videoPanel}</div>
            <div className="flex shrink-0 flex-wrap gap-1 border-b border-zinc-800/60 p-2">
              {(
                [
                  ['recipes', 'Breakdown'],
                  ['color', 'Color'],
                  ['guide', 'Guide'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMobileTab(id)}
                  className={
                    mobileTab === id
                      ? 'shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-xs text-white'
                      : 'shrink-0 rounded-lg px-3 py-2 text-xs text-zinc-500'
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-3 pb-safe">
              {mobileTab === 'color' ? (
                <ColorGradingPanel data={color} styleHint={colorHint} layout="band" />
              ) : null}
              {mobileTab === 'recipes' ? (
                <div className="space-y-3">
                  <MasterTimeline
                    frames={frames}
                    beats={beats}
                    envelope={envelope}
                    cuts={pacing}
                    effects={effects}
                    transitions={transitions}
                    duration={breakdown.trackDuration}
                    currentTime={currentTime}
                    selectedEffectId={selectedEffect?.id}
                    beatStatus={beatStatus}
                    onSeek={jumpTo}
                  />
                  <PresetRecipePanel
                    effects={effects}
                    selectedId={selectedEffect?.id}
                    onSelect={onEffect}
                  />
                </div>
              ) : null}
              {mobileTab === 'guide' ? (
                <div className="h-[min(70vh,640px)]">{guide}</div>
              ) : null}
            </div>
          </div>

          {/* Desktop layout */}
          <div className="analysis-workspace workspace-fade-in hidden min-h-0 flex-1 overflow-x-hidden overflow-y-auto md:block">
              <div
                className={cn(
                  'grid min-h-[calc(100svh-8rem)] items-start gap-3 px-3 pt-2 xl:gap-4 xl:px-4',
                  'grid-cols-[minmax(240px,0.85fr)_minmax(0,1.55fr)_minmax(300px,1fr)]'
                )}
              >
                <div className="min-w-0">{videoPanel}</div>
                {centerStack}
                <div className="relative min-h-0 min-w-0 self-stretch">{guide}</div>
              </div>
              <div className="px-3 pb-6 pt-3 xl:px-4">{colorBand}</div>
            </div>
        </div>
      )}
    </WorkspaceShell>
  );
}
