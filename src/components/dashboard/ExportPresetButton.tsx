'use client';

import { Download } from 'lucide-react';
import { useBreakdown } from '@/context/BreakdownContext';
import { exportBreakdownMarkers, exportFormatForNle } from '@/lib/export-presets';
import { cn } from '@/lib/utils';
import type { NleSoftware, VideoBreakdownRecord } from '@/types/breakdown';

function formatLabel(nle: NleSoftware) {
  const fmt = exportFormatForNle(nle);
  if (fmt === 'drx') return 'DaVinci PowerGrade';
  if (fmt === 'ffx') return 'After Effects .ffx';
  if (fmt === 'fcpxml') return 'Premiere FCPXML';
  if (fmt === 'jsx') return 'After Effects JSX';
  return 'JSON Markers';
}

interface ExportMarkersButtonProps {
  breakdown: VideoBreakdownRecord;
  nle: NleSoftware;
  className?: string;
}

export function ExportMarkersButton({
  breakdown,
  nle,
  className,
}: ExportMarkersButtonProps) {
  const fmt = exportFormatForNle(nle);

  return (
    <button
      type="button"
      onClick={() => exportBreakdownMarkers(breakdown, nle, fmt)}
      className={cn(
        'flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800',
        className
      )}
    >
      <Download className="h-3.5 w-3.5" />
      Export Preset · {formatLabel(nle)}
    </button>
  );
}

export function ExportPresetButton() {
  const { breakdown, nle } = useBreakdown();
  if (!breakdown) return null;
  return <ExportMarkersButton breakdown={breakdown} nle={nle} />;
}
