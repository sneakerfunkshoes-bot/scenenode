'use client';

import { useState } from 'react';
import type { BreakdownData, SoftwareTool } from '@/types';
import { DEMO_BREAKDOWN } from '@/lib/mock-data';
import { UrlInput } from './UrlInput';
import { SoftwareSelector } from './SoftwareSelector';
import { ImportPanel } from './ImportPanel';
import { BreakdownDashboard } from './BreakdownDashboard';

interface MainEditorProps {
  software: SoftwareTool;
  onSoftwareChange: (tool: SoftwareTool) => void;
}

export function MainEditor({ software, onSoftwareChange }: MainEditorProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);

  const analyze = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1100));
    setBreakdown(DEMO_BREAKDOWN);
    setLoading(false);
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden p-4 md:p-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-silver md:text-2xl">
              Breakdown Studio
            </h1>
            <p className="mt-0.5 font-body text-sm text-silver-dim">
              Target NLE & source media
            </p>
          </div>
          <ImportPanel />
        </div>

        <UrlInput
          value={url}
          onChange={setUrl}
          onAnalyze={analyze}
          loading={loading}
        />

        <SoftwareSelector selected={software} onSelect={onSoftwareChange} />
      </div>

      <BreakdownDashboard data={breakdown} loading={loading} />
    </section>
  );
}
