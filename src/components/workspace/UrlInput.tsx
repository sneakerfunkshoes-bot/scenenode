'use client';

import { Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  loading?: boolean;
}

export function UrlInput({ value, onChange, onAnalyze, loading }: UrlInputProps) {
  return (
    <div className="glass-panel flex flex-col gap-2 rounded-md p-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Link2
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-silver-dim"
        />
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste YouTube / TikTok / Instagram Reels URL…"
          className="w-full rounded-sm border border-silver/12 bg-obsidian/70 py-2.5 pl-10 pr-3 font-body text-sm text-silver outline-none placeholder:text-silver-dim/60 focus:border-silver/35"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onAnalyze();
          }}
        />
      </div>
      <button
        type="button"
        onClick={onAnalyze}
        disabled={loading}
        className={cn(
          'shrink-0 rounded-sm border border-silver/30 bg-silver/10 px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.14em] text-silver transition hover:bg-silver/20 disabled:opacity-50'
        )}
      >
        {loading ? 'Analyzing…' : 'Break Down'}
      </button>
    </div>
  );
}
