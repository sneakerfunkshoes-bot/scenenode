'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, Clock3, FolderKanban, History, Sparkles } from 'lucide-react';
import {
  listInspectHistory,
  type InspectHistoryItem,
} from '@/lib/inspect-history';
import { cn } from '@/lib/utils';

export type LibraryMode = 'projects' | 'history';

interface WorkspaceLibraryProps {
  mode: LibraryMode;
  onOpen: (item: InspectHistoryItem) => void;
  onNewAnalysis?: () => void;
}

export function WorkspaceLibrary({ mode, onOpen, onNewAnalysis }: WorkspaceLibraryProps) {
  const [items, setItems] = useState<InspectHistoryItem[]>([]);

  useEffect(() => {
    setItems(listInspectHistory());
  }, [mode]);

  const title = mode === 'projects' ? 'My Projects' : 'History';
  const subtitle =
    mode === 'projects'
      ? 'Recent analyses from this browser'
      : 'Project history list for scenenode analysis.';

  const Icon = mode === 'projects' ? FolderKanban : History;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-safe sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex items-center gap-2 text-zinc-500">
            <Icon className="h-4 w-4" />
            <span className="text-[11px] font-medium uppercase tracking-[0.16em]">{title}</span>
          </div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500">{subtitle}</p>
        </div>
        {onNewAnalysis ? (
          <button
            type="button"
            onClick={onNewAnalysis}
            className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            New analysis
          </button>
        ) : null}
      </div>

      {!items.length ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-5 py-12 text-center sm:px-6 sm:py-14">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-zinc-500">
            {mode === 'projects' ? (
              <FolderKanban className="h-5 w-5" />
            ) : (
              <History className="h-5 w-5" />
            )}
          </div>
          <p className="text-sm font-medium text-zinc-200">
            {mode === 'projects' ? 'No saved projects yet' : 'No history yet'}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-zinc-500">
            {mode === 'projects'
              ? 'Completed analyses are saved here automatically so you can reopen the breakdown, timeline, and recreation guide.'
              : 'Each link or upload you analyze appears here with its timestamp so you can jump back to any session.'}
          </p>
          {onNewAnalysis ? (
            <button
              type="button"
              onClick={onNewAnalysis}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-white"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Analyze your first edit
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={`${mode}-${item.id}`}>
              <button
                type="button"
                onClick={() => onOpen(item)}
                className={cn(
                  'flex w-full max-w-full items-center gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 text-left transition',
                  'hover:border-zinc-700 hover:bg-zinc-900/90 active:scale-[0.99]'
                )}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-black text-[10px] font-bold uppercase text-zinc-400">
                  {item.nle.slice(0, 3)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {item.songTitle || 'Untitled edit'}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {item.songArtist || 'Unknown artist'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                      {item.nle}
                    </span>
                    <span className="text-[10px] text-zinc-600">{item.bpm} BPM</span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
                    <Clock3 className="h-3 w-3" />
                    {new Date(item.analyzedAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
