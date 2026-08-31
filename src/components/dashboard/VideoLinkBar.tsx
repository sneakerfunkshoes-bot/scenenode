'use client';

import { useBreakdown } from '@/context/BreakdownContext';
import { cn } from '@/lib/utils';

export function VideoLinkBar() {
  const { url, setUrl, analyzeEdit, isAnalyzing } = useBreakdown();

  return (
    <div className="flex w-full gap-3">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste TikTok, Reel, or Shorts URL..."
        className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-2.5 font-mono text-xs text-zinc-200 outline-none transition placeholder:text-zinc-500 focus:border-zinc-600"
        onKeyDown={(e) => {
          if (e.key === 'Enter') void analyzeEdit();
        }}
      />
      <button
        type="button"
        onClick={() => void analyzeEdit()}
        disabled={isAnalyzing}
        className={cn(
          'shrink-0 rounded-xl bg-white px-6 py-2.5 text-xs font-bold text-black shadow-lg transition hover:bg-zinc-200 disabled:opacity-50'
        )}
      >
        {isAnalyzing ? 'Analyzing…' : 'ANALYZE EDIT'}
      </button>
    </div>
  );
}
