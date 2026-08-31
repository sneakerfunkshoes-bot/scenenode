'use client';

import { ScanProgressPanel } from '@/components/inspect/ScanProgressPanel';
import { useBreakdown } from '@/context/BreakdownContext';

export function AnalyzeLoading() {
  const { isAnalyzing } = useBreakdown();
  if (!isAnalyzing) return null;

  return (
    <div className="flex min-h-[320px] items-center justify-center px-4 py-8">
      <ScanProgressPanel variant="dashboard" />
    </div>
  );
}
