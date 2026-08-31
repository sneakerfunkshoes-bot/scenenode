'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  AnalyzeStage,
  BreakdownEffect,
  NleSoftware,
  TutorialStep,
  VideoBreakdownRecord,
} from '@/types/breakdown';
import { stageLabelForNle } from '@/types/breakdown';
import { getCachedBreakdown, setCachedBreakdown } from '@/lib/breakdown-cache';
import { takeStudioHandoff } from '@/lib/studio-handoff';

export const DEFAULT_AI_MODEL = 'scenenode AI';

interface BreakdownContextValue {
  url: string;
  setUrl: (url: string) => void;
  nle: NleSoftware;
  setNle: (nle: NleSoftware) => void;
  aiModel: string;
  setAiModel: (model: string) => void;
  stage: AnalyzeStage;
  stageLabel: string;
  isAnalyzing: boolean;
  scanTags: string[];
  error: string | null;
  analysisSource: 'gemini' | 'mock' | 'cache' | null;
  breakdown: VideoBreakdownRecord | null;
  selectedEffectId: string | null;
  setSelectedEffectId: (id: string | null) => void;
  selectedEffect: BreakdownEffect | null;
  activeTutorialSteps: TutorialStep[];
  currentTime: number;
  setCurrentTime: (t: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  skipBy: (delta: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
  volume: number;
  setVolume: (v: number) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  aiPromptRequest: number;
  aiPromptText: string;
  requestAiPrompt: (text: string) => void;
  analyzeEdit: (force?: boolean) => Promise<void>;
  reset: () => void;
}

const BreakdownContext = createContext<BreakdownContextValue | null>(null);

function applyNle(record: VideoBreakdownRecord, nle: NleSoftware): VideoBreakdownRecord {
  return { ...record, nleSoftware: nle };
}

export function BreakdownProvider({ children }: { children: ReactNode }) {
  const [url, setUrl] = useState('');
  const [nle, setNle] = useState<NleSoftware>('DaVinci Resolve');
  const [aiModel, setAiModel] = useState(DEFAULT_AI_MODEL);
  const [stage, setStage] = useState<AnalyzeStage>('idle');
  const [scanTags, setScanTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analysisSource, setAnalysisSource] = useState<
    'gemini' | 'mock' | 'cache' | null
  >(null);
  const [breakdown, setBreakdown] = useState<VideoBreakdownRecord | null>(null);
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);
  const [currentTime, setCurrentTimeState] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(25);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [aiPromptRequest, setAiPromptRequest] = useState(0);
  const [aiPromptText, setAiPromptText] = useState('');
  const runId = useRef(0);
  const duration = breakdown?.trackDuration ?? 0;

  const isAnalyzing =
    stage === 'extracting_beats' ||
    stage === 'identifying_transitions' ||
    stage === 'generating_steps';

  const stageLabel = stageLabelForNle(stage, nle);

  const selectedEffect = useMemo(() => {
    if (!breakdown || !selectedEffectId) return breakdown?.effects[0] ?? null;
    return breakdown.effects.find((e) => e.id === selectedEffectId) ?? null;
  }, [breakdown, selectedEffectId]);

  const activeTutorialSteps = useMemo(() => {
    if (!selectedEffect) return [];
    return selectedEffect.tutorials[nle] ?? [];
  }, [selectedEffect, nle]);

  const setCurrentTime = useCallback(
    (t: number) => {
      const max = breakdown?.trackDuration ?? 0;
      setCurrentTimeState(Math.min(max, Math.max(0, t)));
    },
    [breakdown?.trackDuration]
  );

  const skipBy = useCallback(
    (delta: number) => {
      setCurrentTimeState((prev) => {
        const max = breakdown?.trackDuration ?? 0;
        return Math.min(max, Math.max(0, prev + delta));
      });
    },
    [breakdown?.trackDuration]
  );

  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);
  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);
  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.min(100, Math.max(0, v)));
    if (v > 0) setIsMuted(false);
  }, []);

  const finishBreakdown = useCallback(
    (record: VideoBreakdownRecord, source: 'gemini' | 'mock' | 'cache') => {
      const applied = applyNle(record, nle);
      setBreakdown(applied);
      setSelectedEffectId(applied.effects[0]?.id ?? null);
      setAnalysisSource(source);
      setStage('complete');
      setCurrentTimeState(0);
      setIsPlaying(false);
    },
    [nle]
  );

  const runScanAnimation = useCallback(
    async (record: VideoBreakdownRecord, source: 'gemini' | 'mock' | 'cache') => {
      const id = runId.current;
      setScanTags([]);
      setStage('extracting_beats');

      const tags = [
        `[0.2s] Detecting Audio BPM… ${record.bpm} BPM`,
        `[0.8s] Isolating Transitions… ${record.effects.length} Found`,
        `[1.4s] Song Match… ${record.songTitle} — ${record.songArtist}`,
        `[1.8s] Extracting Color Profile… ${record.effects[0]?.description.includes('CC:') ? 'Graded' : 'High Contrast'}`,
      ];

      await new Promise((r) => setTimeout(r, 400));
      if (runId.current !== id) return;
      setScanTags([tags[0]!]);
      setStage('identifying_transitions');

      await new Promise((r) => setTimeout(r, 500));
      if (runId.current !== id) return;
      setScanTags((t) => [...t, tags[1]!]);

      await new Promise((r) => setTimeout(r, 500));
      if (runId.current !== id) return;
      setScanTags((t) => [...t, tags[2]!]);
      setStage('generating_steps');

      await new Promise((r) => setTimeout(r, 450));
      if (runId.current !== id) return;
      setScanTags((t) => [...t, tags[3]!]);

      await new Promise((r) => setTimeout(r, 350));
      if (runId.current !== id) return;
      finishBreakdown(record, source);
    },
    [finishBreakdown]
  );

  useEffect(() => {
    const handoff = takeStudioHandoff();
    if (!handoff) return;
    setUrl(handoff.url);
    setNle(handoff.nle);
    const applied = applyNle(handoff.breakdown, handoff.nle);
    setBreakdown(applied);
    setSelectedEffectId(applied.effects[0]?.id ?? null);
    setAnalysisSource('cache');
    setStage('complete');
    setCachedBreakdown(handoff.url, applied);
  }, []);

  useEffect(() => {
    setCurrentTimeState(0);
    setIsPlaying(false);
  }, [breakdown?.id]);

  useEffect(() => {
    if (!isPlaying || duration <= 0) return;
    const tick = window.setInterval(() => {
      setCurrentTimeState((prev) => {
        const next = prev + 0.1;
        if (next >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(tick);
  }, [isPlaying, duration]);

  const requestAiPrompt = useCallback((text: string) => {
    setAiPromptText(text);
    setAiPromptRequest((n) => n + 1);
  }, []);

  const analyzeEdit = useCallback(
    async (force = false) => {
      const trimmed = url.trim();
      if (!trimmed) {
        setError('Paste a TikTok, Reel, or Shorts URL first.');
        setStage('error');
        return;
      }

      const id = ++runId.current;
      setBreakdown(null);
      setSelectedEffectId(null);
      setError(null);
      setAnalysisSource(null);
      setScanTags([]);
      setCurrentTimeState(0);
      setIsPlaying(false);

      const cached = !force ? getCachedBreakdown(trimmed) : null;
      if (cached) {
        await runScanAnimation(cached, 'cache');
        return;
      }

      setStage('extracting_beats');
      const stageTimer = window.setTimeout(() => {
        if (runId.current === id) setStage('identifying_transitions');
      }, 1600);
      const stageTimer2 = window.setTimeout(() => {
        if (runId.current === id) setStage('generating_steps');
      }, 4200);

      try {
        const res = await fetch('/api/analyze-edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ link: trimmed, nle }),
        });

        const data = (await res.json()) as {
          breakdown?: VideoBreakdownRecord;
          source?: 'gemini' | 'mock';
          warning?: string;
          error?: string;
        };

        if (runId.current !== id) return;

        if (!res.ok || !data.breakdown) {
          throw new Error(data.error || 'Analysis failed');
        }

        setCachedBreakdown(trimmed, data.breakdown);
        if (data.warning) setError(data.warning);
        await runScanAnimation(data.breakdown, data.source ?? 'gemini');
      } catch (err) {
        if (runId.current !== id) return;
        setError(err instanceof Error ? err.message : 'Analysis failed');
        setStage('error');
      } finally {
        window.clearTimeout(stageTimer);
        window.clearTimeout(stageTimer2);
      }
    },
    [url, nle, runScanAnimation]
  );

  const reset = useCallback(() => {
    runId.current += 1;
    setStage('idle');
    setError(null);
    setAnalysisSource(null);
    setScanTags([]);
    setBreakdown(null);
    setSelectedEffectId(null);
    setCurrentTimeState(0);
    setIsPlaying(false);
  }, []);

  const value: BreakdownContextValue = {
    url,
    setUrl,
    nle,
    setNle,
    aiModel,
    setAiModel,
    stage,
    stageLabel,
    isAnalyzing,
    scanTags,
    error,
    analysisSource,
    breakdown,
    selectedEffectId,
    setSelectedEffectId,
    selectedEffect,
    activeTutorialSteps,
    currentTime,
    setCurrentTime,
    isPlaying,
    togglePlay,
    skipBy,
    isMuted,
    toggleMute,
    volume,
    setVolume,
    commandPaletteOpen,
    setCommandPaletteOpen,
    aiPromptRequest,
    aiPromptText,
    requestAiPrompt,
    analyzeEdit,
    reset,
  };

  return (
    <BreakdownContext.Provider value={value}>{children}</BreakdownContext.Provider>
  );
}

export function useBreakdown(): BreakdownContextValue {
  const ctx = useContext(BreakdownContext);
  if (!ctx) {
    throw new Error('useBreakdown must be used within BreakdownProvider');
  }
  return ctx;
}
