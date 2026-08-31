'use client';

import type { InspectHistoryItem } from '@/lib/inspect-history';

interface InspectHistoryListProps {
  items: InspectHistoryItem[];
  onOpen: (item: InspectHistoryItem) => void;
}

export function InspectHistoryList({ items, onOpen }: InspectHistoryListProps) {
  if (!items.length) return null;

  return (
    <div className="mt-12 w-full max-w-xl text-left">
      <h2 className="mb-3 text-sm font-semibold text-zinc-400">Recent</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-3 text-left transition hover:border-zinc-600"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{item.songTitle}</p>
                <p className="truncate text-xs text-zinc-500">
                  {item.songArtist} · {item.bpm} BPM · {item.nle}
                </p>
              </div>
              <span className="shrink-0 text-xs text-zinc-500">
                {new Date(item.analyzedAt).toLocaleDateString()}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
