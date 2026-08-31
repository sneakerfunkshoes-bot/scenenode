'use client';

import { useBreakdown } from '@/context/BreakdownContext';
import { VideoLinkBar } from './VideoLinkBar';
import { NleSelector } from './NleSelector';
import { EditInspector } from './EditInspector';
import { AnalyzeLoading } from './AnalyzeLoading';

export function CenterWorkspace() {
  const { breakdown, isAnalyzing, nle, stage, error } = useBreakdown();

  return (
    <section className="flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden bg-black">
      <div className="custom-scrollbar flex min-h-0 w-full flex-1 flex-col gap-6 overflow-y-auto p-6 pr-4">
        <div className="space-y-4 rounded-2xl border border-zinc-800/80 bg-zinc-950 p-4 shadow-xl">
          <VideoLinkBar />
          <div className="border-t border-zinc-900 pt-3">
            <NleSelector />
          </div>
        </div>

        {isAnalyzing ? (
          <AnalyzeLoading />
        ) : stage === 'error' ? (
          <div className="flex min-h-[320px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-red-900/50 bg-zinc-950 px-6 text-center">
            <p className="text-sm font-semibold text-red-300">Analysis failed</p>
            <p className="max-w-lg text-xs leading-relaxed text-zinc-400">
              {error || 'Something went wrong while analyzing the edit.'}
            </p>
          </div>
        ) : breakdown ? (
          <EditInspector />
        ) : (
          <div className="relative flex min-h-[400px] w-full flex-1 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950 px-6 text-center">
            <p className="text-sm font-semibold text-zinc-200">Paste a link to begin</p>
            <p className="max-w-md text-xs leading-relaxed text-zinc-500">
              scenenode downloads the reel, analyzes the edit, and returns color grade,
              transitions, beat markers, and {nle} recreation steps.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
