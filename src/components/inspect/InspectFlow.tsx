'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Play } from 'lucide-react';
import { createMockBreakdown } from '@/lib/breakdown-mock';
import { setCachedBreakdown } from '@/lib/breakdown-cache';
import { getExampleInspect } from '@/lib/example-inspects';
import {
  listInspectHistory,
  upsertInspectHistory,
  type InspectHistoryItem,
} from '@/lib/inspect-history';
import { analyzeWithStream } from '@/lib/analyze-stream-client';
import { trackClientError } from '@/lib/client-analytics';
import { DECONSTRUCT_PROCESS_STEPS } from '@/lib/deconstruct-stages';
import { isSupportedVideoUrl } from '@/lib/video-url';
import { formatTimestamp } from '@/lib/utils';
import type { NleSoftware, VideoBreakdownRecord } from '@/types/breakdown';
import { DeconstructComplete } from '@/components/deconstruct/DeconstructComplete';
import { ProcessingSequence } from '@/components/deconstruct/ProcessingSequence';
import { UploadMethodPanel } from '@/components/deconstruct/UploadMethodPanel';
import { WorkspaceLibrary } from '@/components/deconstruct/WorkspaceLibrary';
import {
  WorkspaceShell,
  type WorkspaceNavId,
} from '@/components/deconstruct/WorkspaceShell';

type Phase = 'empty' | 'ready' | 'processing' | 'complete';

function InspectFlowInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryUrl = searchParams.get('url') ?? '';
  const hasValidQueryUrl = Boolean(queryUrl && isSupportedVideoUrl(queryUrl));
  const fromHome = searchParams.get('from') === 'home';

  const [url, setUrl] = useState(hasValidQueryUrl ? queryUrl : '');
  const [nle] = useState<NleSoftware>('CapCut');
  const [phase, setPhase] = useState<Phase>(
    hasValidQueryUrl ? 'processing' : 'empty'
  );
  const [activeNav, setActiveNav] = useState<WorkspaceNavId>('dashboard');
  const [error, setError] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<VideoBreakdownRecord | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [streamLabel, setStreamLabel] = useState<string | null>(null);
  const [processIndex, setProcessIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [localPreview, setLocalPreview] = useState<{
    objectUrl: string;
    fileName: string;
    duration: number;
  } | null>(null);
  const [readyMeta, setReadyMeta] = useState<{
    label: string;
    source: string;
    previewUrl?: string;
    pendingUrl?: string;
    pendingFile?: File;
  } | null>(null);

  const bootedQueryUrl = useRef<string | null>(null);
  const loadedExample = useRef<string | null>(null);
  const localPreviewRef = useRef<string | null>(null);

  const clearLocalPreview = useCallback(() => {
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current);
      localPreviewRef.current = null;
    }
    setLocalPreview(null);
  }, []);

  const applyBreakdown = useCallback(
    (record: VideoBreakdownRecord, nextNle: NleSoftware, nextUrl: string) => {
      const applied = {
        ...record,
        nleSoftware: nextNle,
        videoUrl: nextUrl || record.videoUrl,
        previewVideoUrl: record.previewVideoUrl || localPreviewRef.current || undefined,
      };
      setUrl(nextUrl || record.videoUrl);
      setBreakdown(applied);
      setSelectedEffect(applied.effects[0]?.id ?? null);
      setPhase('complete');
      setActiveNav('dashboard');
      setCurrentTime(0);
      setIsPlaying(false);
      setCachedBreakdown(nextUrl || applied.videoUrl, applied);
      upsertInspectHistory(applied, nextNle, nextUrl || applied.videoUrl);
      listInspectHistory();
    },
    []
  );

  const runAnalyze = useCallback(
    async (link: string) => {
      const trimmed = link.trim();
      if (!trimmed) {
        setError('Paste a link first.');
        setPhase('empty');
        return;
      }
      if (!isSupportedVideoUrl(trimmed)) {
        setError('Use a TikTok, Instagram Reels, or YouTube Shorts URL.');
        setPhase('empty');
        return;
      }

      setError(null);
      setWarning(null);
      setPhase('processing');
      setProcessIndex(0);
      setBreakdown(null);
      setSelectedEffect(null);
      setStreamLabel('Connecting to analysis stream…');

      try {
        const record = await analyzeWithStream(trimmed, nle, (ev) => {
          if (ev.type === 'stage' || ev.type === 'worker') {
            setStreamLabel(ev.label);
          }
          if (ev.type === 'token') {
            setStreamLabel(`Vision LLM streaming… ${ev.totalChars} chars`);
          }
          if (ev.type === 'complete' && ev.warning) {
            setWarning(ev.warning);
          }
        });

        applyBreakdown(record, nle, trimmed);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Analysis failed';
        trackClientError('analyze', msg);
        setError(msg.length > 220 ? `${msg.slice(0, 220)}…` : msg);
        setPhase(readyMeta?.pendingFile ? 'ready' : 'empty');
      } finally {
        setStreamLabel(null);
      }
    },
    [nle, applyBreakdown, readyMeta?.pendingFile]
  );

  useEffect(() => {
    if (phase !== 'processing') return;
    const id = window.setInterval(() => {
      setProcessIndex((prev) =>
        prev < DECONSTRUCT_PROCESS_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 1600);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    const exampleId = searchParams.get('example');
    if (!exampleId || loadedExample.current === exampleId) return;
    const example = getExampleInspect(exampleId);
    if (!example) return;
    loadedExample.current = exampleId;
    applyBreakdown(example.breakdown, example.nle, example.url);
  }, [searchParams, applyBreakdown]);

  useEffect(() => {
    const incoming = searchParams.get('url');
    if (!incoming || !isSupportedVideoUrl(incoming)) return;
    if (bootedQueryUrl.current === incoming) return;
    bootedQueryUrl.current = incoming;
    setUrl(incoming);
    setReadyMeta({
      label: 'Link ready',
      source: incoming,
      pendingUrl: incoming,
    });
    void runAnalyze(incoming);
  }, [searchParams, runAnalyze]);

  useEffect(() => () => clearLocalPreview(), [clearLocalPreview]);

  const handleReset = () => {
    clearLocalPreview();
    setPhase('empty');
    setActiveNav('dashboard');
    setBreakdown(null);
    setSelectedEffect(null);
    setError(null);
    setWarning(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setReadyMeta(null);
    setUrl('');
    bootedQueryUrl.current = null;
    loadedExample.current = null;
    router.replace('/inspect?workspace=1');
  };

  const handleOpenHistoryItem = (item: InspectHistoryItem) => {
    applyBreakdown(item.breakdown, item.nle, item.videoUrl);
    setActiveNav('dashboard');
  };

  const handleNavChange = (id: WorkspaceNavId) => {
    if (id === 'vault') return;
    setActiveNav(id);
  };

  const handleSelectFile = (file: File) => {
    clearLocalPreview();
    const objectUrl = URL.createObjectURL(file);
    localPreviewRef.current = objectUrl;

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = objectUrl;
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 12;
      setLocalPreview({ objectUrl, fileName: file.name, duration });
      setReadyMeta({
        label: file.name,
        source: 'Local file',
        previewUrl: objectUrl,
        pendingFile: file,
      });
      setPhase('ready');
      setError(null);
    };
    video.onerror = () => {
      setLocalPreview({ objectUrl, fileName: file.name, duration: 12 });
      setReadyMeta({
        label: file.name,
        source: 'Local file',
        previewUrl: objectUrl,
        pendingFile: file,
      });
      setPhase('ready');
    };
  };

  const startLocalAnalysis = () => {
    if (!readyMeta?.pendingFile || !localPreview) return;
    setPhase('processing');
    setProcessIndex(0);
    setStreamLabel('Preparing local reference…');

    window.setTimeout(() => {
      const mock = createMockBreakdown(localPreview.objectUrl, nle);
      mock.previewVideoUrl = localPreview.objectUrl;
      mock.trackDuration = localPreview.duration || mock.trackDuration;
      mock.previewLabel = localPreview.fileName;
      setWarning(
        'Local file preview is supported. Full cloud vision analysis currently requires a TikTok / Reel / Shorts link.'
      );
      applyBreakdown(mock, nle, localPreview.objectUrl);
      setStreamLabel(null);
    }, 4200);
  };

  const startLinkFromReady = () => {
    if (readyMeta?.pendingUrl) void runAnalyze(readyMeta.pendingUrl);
  };

  const handleSelectEffect = (id: string, time?: number) => {
    setSelectedEffect(id);
    if (typeof time === 'number') setCurrentTime(time);
  };

  const handleOpenStudio = () => {
    // Legacy Breakdown Studio removed — keep the user in the analysis workspace.
  };

  const enterMotion = useMemo(
    () =>
      fromHome
        ? { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 } }
        : { initial: { opacity: 0 }, animate: { opacity: 1 } },
    [fromHome]
  );

  const libraryMode = activeNav === 'projects' || activeNav === 'history' ? activeNav : null;

  const shellTitle =
    activeNav === 'projects'
      ? 'My Projects'
      : activeNav === 'history'
        ? 'History'
        : phase === 'empty'
          ? 'Reference Analysis'
          : 'Reference Edit Analysis';

  if (phase === 'complete' && breakdown) {
    return (
      <motion.div
        {...enterMotion}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="inspect-theme h-[100svh] bg-black"
      >
        <DeconstructComplete
          breakdown={breakdown}
          nle={nle}
          sourceUrl={url}
          currentTime={currentTime}
          isPlaying={isPlaying}
          selectedEffectId={selectedEffect}
          onSelectEffect={handleSelectEffect}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onTimeChange={setCurrentTime}
          onPlayingChange={setIsPlaying}
          onOpenStudio={handleOpenStudio}
          onReset={handleReset}
          warning={warning}
          activeNav={activeNav}
          onNavChange={handleNavChange}
          libraryMode={libraryMode}
          onOpenHistoryItem={handleOpenHistoryItem}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      {...enterMotion}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="inspect-theme h-[100svh] bg-black"
    >
      <WorkspaceShell
        title={shellTitle}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        status={
          libraryMode ? (
            <span>
              {libraryMode === 'projects' ? 'Saved analyses' : 'Recent analyses'}
            </span>
          ) : phase === 'processing' ? (
            <span className="text-sky-300/90">Analyzing…</span>
          ) : phase === 'ready' ? (
            <span className="inline-flex items-center gap-1.5 text-zinc-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Reference loaded
            </span>
          ) : null
        }
      >
        {libraryMode ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <WorkspaceLibrary
              mode={libraryMode}
              onOpen={handleOpenHistoryItem}
              onNewAnalysis={() => {
                setActiveNav('dashboard');
                if (phase === 'complete') handleReset();
              }}
            />
          </div>
        ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {phase === 'processing' ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex min-h-full items-center justify-center p-6"
            >
              <ProcessingSequence activeIndex={processIndex} liveLabel={streamLabel} />
            </motion.div>
          ) : phase === 'ready' && readyMeta ? (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6"
            >
              <div className="grid gap-6 md:grid-cols-[220px_1fr]">
                <div className="mx-auto aspect-[9/16] w-full max-w-[200px] overflow-hidden rounded-xl border border-zinc-800 bg-black">
                  {readyMeta.previewUrl ? (
                    <video
                      src={readyMeta.previewUrl}
                      className="h-full w-full object-contain"
                      muted
                      playsInline
                      controls
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-4 text-center text-xs text-zinc-500">
                      Link queued for analysis
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <h2 className="text-xl font-semibold text-white">{readyMeta.label}</h2>
                  <p className="mt-1 text-sm text-zinc-500">{readyMeta.source}</p>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                    {readyMeta.pendingFile
                      ? 'We will map beats, cuts, layered effects, and color from your upload. Full cloud vision currently works best with TikTok / Reel / Shorts links.'
                      : 'We will download the clip, detect beats and cuts, map every layered effect, and build a step-by-step recreation guide for CapCut.'}
                  </p>
                  {localPreview ? (
                    <p className="mt-2 font-mono text-xs text-zinc-600">
                      {formatTimestamp(localPreview.duration)}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      readyMeta.pendingFile ? startLocalAnalysis() : startLinkFromReady()
                    }
                    className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
                  >
                    <Play className="h-4 w-4" />
                    {readyMeta.pendingFile ? 'Start analysis' : 'Start analysis'}
                  </button>
                  <p className="mt-3 text-[11px] text-zinc-600">
                    Takes about 30–90 seconds · progress updates while we work
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-3 w-fit text-xs text-zinc-500 transition hover:text-zinc-300"
                  >
                    Choose a different source
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <UploadMethodPanel
                onSubmitUrl={(link) => {
                  setUrl(link);
                  setReadyMeta({
                    label: 'Link ready',
                    source: link,
                    pendingUrl: link,
                  });
                  setError(null);
                  void runAnalyze(link);
                }}
                onSelectFile={handleSelectFile}
                error={error}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </div>
        )}
      </WorkspaceShell>
    </motion.div>
  );
}

export function InspectFlow() {
  return (
    <Suspense fallback={<div className="inspect-theme min-h-screen bg-black" />}>
      <InspectFlowInner />
    </Suspense>
  );
}
