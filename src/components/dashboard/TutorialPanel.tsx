'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, Download } from 'lucide-react';
import { useBreakdown } from '@/context/BreakdownContext';
import { formatTimestamp } from '@/lib/utils';
import { fxParamsForEffect, formatFxClipboard } from '@/lib/fx-params';
import { getNleTheme } from '@/lib/nle-theme';

export function TutorialPanel() {
  const { nle, selectedEffect, activeTutorialSteps } = useBreakdown();
  const theme = getNleTheme(nle);
  const [params, setParams] = useState<ReturnType<typeof fxParamsForEffect>>([]);
  const [copied, setCopied] = useState(false);

  const baseParams = useMemo(
    () => (selectedEffect ? fxParamsForEffect(selectedEffect) : []),
    [selectedEffect]
  );

  useEffect(() => {
    setParams([]);
  }, [selectedEffect?.id]);

  const sliders = params.length ? params : baseParams;

  if (!selectedEffect) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-8 text-center">
        <p className="text-sm text-zinc-500">Select an effect marker to view {nle} steps.</p>
      </div>
    );
  }

  const copySettings = async () => {
    await navigator.clipboard.writeText(formatFxClipboard(sliders));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const downloadPreset = () => {
    const blob = new Blob([JSON.stringify({ nle, effect: selectedEffect.description, params: sliders }, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `scenecraft-preset-${selectedEffect.id}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-800/80 bg-zinc-950 p-5">
      <div className="border-b border-zinc-800 pb-3">
        <span className="font-mono text-[10px] font-semibold uppercase" style={{ color: theme.playhead }}>
          Active Step Breakdown
        </span>
        <h4 className="mt-1 text-sm font-bold text-white">{selectedEffect.description}</h4>
        <p className="mt-1 font-mono text-xs text-zinc-500">
          Timestamp: {formatTimestamp(selectedEffect.timestamp)} · Target: {nle}
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">FX Parameters</p>
        {sliders.map((p) => (
          <div key={p.id} className="space-y-1">
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>{p.label}</span>
              <span className="font-mono text-zinc-200">
                {p.value}
                {p.unit}
              </span>
            </div>
            <input
              type="range"
              min={p.min}
              max={p.max}
              step={p.step}
              value={p.value}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setParams(
                  sliders.map((s) => (s.id === p.id ? { ...s, value: v } : s))
                );
              }}
              className="h-1 w-full cursor-pointer appearance-none rounded bg-zinc-800"
              style={{ accentColor: theme.playhead }}
            />
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => void copySettings()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 py-2 text-[11px] text-zinc-300 hover:bg-zinc-800"
          >
            <Copy className="h-3 w-3" />
            {copied ? 'Copied!' : 'Copy Settings'}
          </button>
          <button
            type="button"
            onClick={downloadPreset}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 py-2 text-[11px] text-zinc-300 hover:bg-zinc-800"
          >
            <Download className="h-3 w-3" />
            Download Preset
          </button>
        </div>
      </div>

      <div className="space-y-3 text-xs text-zinc-300">
        {activeTutorialSteps.map((step) => (
          <div
            key={`${nle}-${step.order}`}
            className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3"
          >
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
              style={{
                borderColor: `rgba(${theme.accentRgb},0.4)`,
                background: `rgba(${theme.accentRgb},0.15)`,
                color: theme.playhead,
              }}
            >
              {step.order}
            </span>
            <div>
              <h5 className="font-semibold text-white">{step.title}</h5>
              <p className="mt-0.5 text-zinc-400">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
