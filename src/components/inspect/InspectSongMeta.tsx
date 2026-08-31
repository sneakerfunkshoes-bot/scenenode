'use client';

import { useState } from 'react';
import { Disc } from 'lucide-react';
import { formatTimestamp } from '@/lib/utils';
import type { VideoBreakdownRecord } from '@/types/breakdown';

interface InspectSongMetaProps {
  breakdown: VideoBreakdownRecord;
  onCorrectSong: (title: string, artist: string) => void;
}

export function InspectSongMeta({ breakdown, onCorrectSong }: InspectSongMetaProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(breakdown.songTitle);
  const [artist, setArtist] = useState(breakdown.songArtist);

  const save = () => {
    const nextTitle = title.trim() || breakdown.songTitle;
    const nextArtist = artist.trim() || breakdown.songArtist;
    onCorrectSong(nextTitle, nextArtist);
    setTitle(nextTitle);
    setArtist(nextArtist);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-zinc-400">
          <Disc className="h-5 w-5 animate-spin-slow" />
        </div>
        <div className="min-w-0">
          {editing ? (
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white outline-none"
                placeholder="Track title"
              />
              <input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white outline-none"
                placeholder="Artist"
              />
              <button
                type="button"
                onClick={save}
                className="rounded-lg bg-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-black"
              >
                Save
              </button>
            </div>
          ) : (
            <>
              <h2 className="truncate text-sm font-bold tracking-wide text-white">
                {breakdown.songTitle}
              </h2>
              <span className="font-mono text-[10px] text-zinc-400">
                {breakdown.songArtist} · {breakdown.bpm} BPM · Detected from audio
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!editing ? (
          <button
            type="button"
            onClick={() => {
              setTitle(breakdown.songTitle);
              setArtist(breakdown.songArtist);
              setEditing(true);
            }}
            className="rounded-lg border border-zinc-700 px-2.5 py-1 font-mono text-[10px] text-zinc-300 transition hover:border-zinc-600"
          >
            Not this track?
          </button>
        ) : null}
        <span className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 font-mono text-[11px] font-bold text-zinc-300">
          Edit Duration: {formatTimestamp(breakdown.trackDuration)}
        </span>
      </div>
    </div>
  );
}
