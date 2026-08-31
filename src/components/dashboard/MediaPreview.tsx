'use client';

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Disc,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  GripVertical,
} from 'lucide-react';
import { useBreakdown } from '@/context/BreakdownContext';
import { getNleTheme } from '@/lib/nle-theme';
import { formatTimestamp, cn } from '@/lib/utils';
import type { NleSoftware } from '@/types/breakdown';

interface MediaPreviewProps {
  label: string;
  duration: number;
}

function ResolveColorWheels() {
  const wheels = [
    { label: 'Lift', color: 'border-red-400/50' },
    { label: 'Gamma', color: 'border-green-400/50' },
    { label: 'Gain', color: 'border-blue-400/50' },
  ];
  return (
    <div className="pointer-events-none absolute bottom-3 right-3 z-20 flex gap-2 opacity-90">
      {wheels.map((w) => (
        <div key={w.label} className="text-center">
          <div
            className={cn(
              'h-10 w-10 rounded-full border-2 bg-black/40 backdrop-blur-sm',
              w.color
            )}
          />
          <span className="mt-0.5 block text-[8px] text-zinc-500">{w.label}</span>
        </div>
      ))}
    </div>
  );
}

function ResolveNodeGraph() {
  return (
    <div className="pointer-events-none absolute left-3 top-12 z-20 space-y-1 opacity-80">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-zinc-400" />
          <div className="h-px w-6 bg-zinc-600" />
          <div className="rounded border border-zinc-700 bg-black/50 px-1 text-[8px] text-zinc-300">
            Node {i + 1}
          </div>
        </div>
      ))}
    </div>
  );
}

function AeMiniTimeline({ currentTime, duration, playheadColor }: { currentTime: number; duration: number; playheadColor: string }) {
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  return (
    <div className="relative h-8 border-t border-black bg-[#1f1f1f]">
      <div className="absolute top-2 h-4 rounded-sm bg-zinc-600" style={{ left: '2%', width: '96%' }} />
      <div
        className="absolute bottom-0 top-0 w-px"
        style={{ left: `${pct}%`, background: playheadColor }}
      />
    </div>
  );
}

function PreviewChrome({
  nle,
  children,
  footer,
}: {
  nle: NleSoftware;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  if (nle === 'After Effects') {
    return (
      <div className="overflow-hidden rounded-lg border border-black bg-[#232323]">
        <div className="flex h-7 items-center border-b border-black bg-[#2a2a2a] text-[11px]">
          <span className="border-r border-black bg-[#3a3a3a] px-3 text-[#eee]">Composition</span>
          <span className="border-r border-black bg-[#323232] px-3 text-white">Comp 1</span>
          <span className="ml-auto px-3 text-[10px] text-[#888]">Effects Controls ›</span>
        </div>
        <div className="relative bg-[#1a1a1a]">{children}</div>
        {footer}
      </div>
    );
  }

  if (nle === 'DaVinci Resolve') {
    return (
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-[#121212]">
        <div className="flex h-7 items-center border-b border-zinc-800 bg-[#1a1a1a] px-3 text-[11px] text-zinc-300">
          Color · Edit Page
        </div>
        <div className="relative">{children}</div>
        {footer}
      </div>
    );
  }

  if (nle === 'CapCut') {
    return (
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
        <div className="flex h-7 items-center border-b border-zinc-800 bg-zinc-900 px-3 text-[11px] text-zinc-300">
          CapCut · Preview
        </div>
        <div className="relative">{children}</div>
        {footer}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950">
      <div className="relative">{children}</div>
      {footer}
    </div>
  );
}

export function MediaPreview({ label, duration }: MediaPreviewProps) {
  const {
    nle,
    currentTime,
    setCurrentTime,
    isPlaying,
    togglePlay,
    skipBy,
    isMuted,
    toggleMute,
    volume,
    setVolume,
  } = useBreakdown();

  const theme = getNleTheme(nle);
  const [splitPct, setSplitPct] = useState(50);
  const dragging = useRef(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const onSplitMove = useCallback((clientX: number) => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.min(92, Math.max(8, ((clientX - rect.left) / rect.width) * 100));
    setSplitPct(pct);
  }, []);

  const viewport = (
    <div
      ref={viewportRef}
      className="relative flex h-[320px] w-full items-center justify-center overflow-hidden bg-zinc-900"
    >
      {/* Raw (left) */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-zinc-900"
        style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,#333,transparent_55%)] opacity-80" />
        <p className="relative z-10 text-[11px] text-zinc-600">Raw clip</p>
      </div>

      {/* Graded (right) */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          clipPath: `inset(0 0 0 ${splitPct}%)`,
          filter: 'contrast(1.12) saturate(1.15) sepia(0.08)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-zinc-950/30 to-transparent" />
        <p className="relative z-10 flex items-center gap-2 font-mono text-xs text-zinc-400">
          <Disc className={cn('h-4 w-4', isPlaying && 'animate-spin')} style={{ color: theme.playhead }} />
          {isPlaying ? 'Graded preview' : 'Preview paused'}
        </p>
      </div>

      {nle === 'DaVinci Resolve' && (
        <>
          <ResolveColorWheels />
          <ResolveNodeGraph />
        </>
      )}

      <div
        className="absolute bottom-0 top-0 z-30 w-0.5 cursor-ew-resize bg-white/90"
        style={{ left: `${splitPct}%` }}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          onSplitMove(e.clientX);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
      >
        <GripVertical className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/80" />
      </div>

      <div className="absolute left-3 top-3 z-20 rounded-md border border-zinc-800 bg-black/70 px-2.5 py-1 font-mono text-[11px] text-zinc-300 backdrop-blur-md">
        {formatTimestamp(currentTime)} / {formatTimestamp(duration)}
      </div>
      <p className="absolute bottom-3 left-1/2 z-20 max-w-[70%] -translate-x-1/2 truncate text-center text-[10px] text-zinc-500">
        {label}
      </p>
      <div className="absolute right-3 top-3 z-20 rounded bg-black/60 px-2 py-0.5 text-[9px] text-zinc-400">
        Before / After
      </div>
    </div>
  );

  const controls = (
    <div className="flex items-center justify-between gap-4 border-t border-zinc-800 bg-zinc-900/90 p-3 text-xs">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => skipBy(-5)} className="p-1.5 text-zinc-400 hover:text-white" title="-5s">
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className="rounded-full bg-white p-2 text-black hover:bg-zinc-200"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-black" />}
        </button>
        <button type="button" onClick={() => skipBy(5)} className="p-1.5 text-zinc-400 hover:text-white" title="+5s">
          <RotateCw className="h-4 w-4" />
        </button>
        <span className="hidden text-[10px] text-zinc-600 sm:inline">Space · ←/→ 1s</span>
      </div>

      <div className="flex flex-1 items-center gap-3 px-2">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800"
          style={{ accentColor: theme.playhead }}
        />
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={toggleMute} className="text-zinc-400 hover:text-white">
          {isMuted || volume === 0 ? (
            <VolumeX className="h-4 w-4 text-red-400" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={isMuted ? 0 : volume}
          onChange={(e) => setVolume(parseInt(e.target.value, 10))}
          className="h-1 w-16 cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-zinc-400"
        />
      </div>
    </div>
  );

  return (
    <motion.div
      layout
      className="relative"
      initial={{ opacity: 0.85 }}
      animate={{ opacity: 1 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={nle}
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.25 }}
          className="relative"
        >
          <PreviewChrome
            nle={nle}
            footer={
              nle === 'After Effects' ? (
                <>
                  <AeMiniTimeline
                    currentTime={currentTime}
                    duration={duration}
                    playheadColor={theme.playhead}
                  />
                  {controls}
                </>
              ) : (
                controls
              )
            }
          >
            {viewport}
          </PreviewChrome>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
