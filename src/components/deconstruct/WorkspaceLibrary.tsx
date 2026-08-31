'use client';

import { useEffect, useState } from 'react';
import { Clock3, FolderKanban, History, Play, Sparkles } from 'lucide-react';
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
      ? 'Re-open saved analyses from this browser'
      : 'Every analysis you run, newest first';
  const Icon = mode === 'projects' ? FolderKanban : History;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-zinc-500">
            <Icon className="h-4 w-4" />
            <span className="text-[11px] font-medium uppercase tracking-[0.16em]">{title}</span>
          </div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        </div>
        {onNewAnalysis ? (
          <button
            type="button"
            onClick={onNewAnalysis}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            New analysis
          </button>
        ) : null}
      </div>

      {!items.length ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-14 text-center">
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
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-white"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Analyze your first edit
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={`${mode}-${item.id}`}>
              <button
                type="button"
                onClick={() => onOpen(item)}
                className={cn(
                  'flex w-full items-center justify-between gap-4 rounded-xl bg-zinc-900/45 px-4 py-3.5 text-left transition',
                  'hover:bg-zinc-900/80'
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {item.songTitle || 'Untitled edit'}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {item.songArtist || 'Unknown'} · {item.bpm} BPM · {item.nle}
                  </p>
                  <p className="mt-1 truncate font-mono text-[10px] text-zinc-600">
                    {item.videoUrl}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                    <Clock3 className="h-3 w-3" />
                    {new Date(item.analyzedAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="mt-2 text-[11px] font-medium text-sky-300/80">Open →</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
