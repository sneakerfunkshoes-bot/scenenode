'use client';

import { AnalysisSection, ColorToneBlock } from './AnalysisBlocks';
import type { ColorToneView } from '@/lib/deconstruct-view-model';

interface ColorGradingPanelProps {
  data: ColorToneView;
  styleHint?: string;
  layout?: 'stack' | 'band';
}

export function ColorGradingPanel({
  data,
  styleHint,
  layout = 'stack',
}: ColorGradingPanelProps) {
  if (layout === 'band') {
    return (
      <section className="rounded-xl bg-zinc-900 p-4 ring-1 ring-inset ring-white/[0.06]">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Color Grading
          </h3>
          {styleHint ? (
            <p className="max-w-2xl text-[11px] leading-relaxed text-zinc-400">{styleHint}</p>
          ) : null}
        </div>
        <ColorToneBlock data={data} layout="band" />
      </section>
    );
  }

  return (
    <div className="flex min-h-0 shrink-0 flex-col">
      <AnalysisSection title="Color Grading" className="bg-zinc-900/35">
        <ColorToneBlock data={data} />
        {styleHint ? (
          <p className="mt-4 border-t border-zinc-800/60 pt-3 text-[11px] leading-relaxed text-zinc-500">
            {styleHint}
          </p>
        ) : null}
      </AnalysisSection>
    </div>
  );
}
