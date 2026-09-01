'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSupportedVideoUrl } from '@/lib/video-url';

const ACCEPT = 'video/mp4,video/quicktime,video/webm,video/*';
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', shortLabel: 'TikTok', placeholder: 'TikTok, Instagram Reel, or YouTube Short URL' },
  { id: 'instagram', label: 'Instagram Reels', shortLabel: 'Instagram', placeholder: 'TikTok, Instagram Reel, or YouTube Short URL' },
  { id: 'youtube', label: 'YouTube Shorts', shortLabel: 'YouTube', placeholder: 'TikTok, Instagram Reel, or YouTube Short URL' },
] as const;

type PlatformId = (typeof PLATFORMS)[number]['id'];

const DEFAULT_PLACEHOLDER = 'TikTok, Instagram Reel, or YouTube Short URL';

export interface UploadMethodPanelProps {
  onSubmitUrl: (url: string) => void;
  onSelectFile: (file: File) => void;
  error?: string | null;
  className?: string;
}

function ScanFrameIcon({ mode }: { mode: 'idle' | 'dragging' | 'accepted' }) {
  if (mode === 'accepted') {
    return (
      <div className="import-scan-icon flex items-center justify-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100/10 ring-1 ring-inset ring-white/20">
          <Check className="h-5 w-5 text-zinc-100" strokeWidth={2} />
        </span>
      </div>
    );
  }

  return (
    <div className="import-scan-icon" aria-hidden>
      <span className="import-scan-bracket tl" />
      <span className="import-scan-bracket tr" />
      <span className="import-scan-bracket bl" />
      <span className="import-scan-bracket br" />
      <span className="import-scan-icon-frame" />
      {mode === 'dragging' ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-zinc-200">
            <path
              d="M10 3v10M10 13l-3.5-3.5M10 13l3.5-3.5M4 17h12"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      ) : (
        <span className="import-scan-line" />
      )}
      <span className="import-meta-label scene">Scene</span>
      <span className="import-meta-label motion">Motion</span>
      <span className="import-meta-label beats">Beats</span>
      <span className="import-meta-label color">Color</span>
    </div>
  );
}

export function UploadMethodPanel({
  onSubmitUrl,
  onSelectFile,
  error,
  className,
}: UploadMethodPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');
  const [dragging, setDragging] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [linkFocused, setLinkFocused] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<PlatformId | null>(null);
  const pendingFile = useRef<File | null>(null);

  const linkValid = useMemo(() => {
    const trimmed = url.trim();
    return Boolean(trimmed && isSupportedVideoUrl(trimmed));
  }, [url]);

  const placeholder = activePlatform
    ? `Paste a ${PLATFORMS.find((p) => p.id === activePlatform)?.label} link…`
    : DEFAULT_PLACEHOLDER;

  const commitFile = useCallback(
    (file: File) => {
      pendingFile.current = file;
      setAccepted(true);
      setDragging(false);
      window.setTimeout(() => {
        onSelectFile(file);
        pendingFile.current = null;
      }, 920);
    },
    [onSelectFile]
  );

  const pickFile = useCallback(
    (file: File | undefined | null) => {
      if (!file || accepted) return;
      if (!file.type.startsWith('video/')) {
        setLocalError('Please choose a video file (MP4, MOV, or WEBM).');
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setLocalError('File is too large. Maximum size is 50 MB.');
        return;
      }
      setLocalError(null);
      commitFile(file);
    },
    [accepted, commitFile]
  );

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    pickFile(event.dataTransfer.files?.[0]);
  };

  const analyzeLink = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setLocalError('Paste a link first.');
      return;
    }
    if (!isSupportedVideoUrl(trimmed)) {
      setLocalError('Use a TikTok, Instagram Reels, or YouTube Shorts URL.');
      return;
    }
    setLocalError(null);
    setAnalyzing(true);
    onSubmitUrl(trimmed);
  };

  const dropMode = accepted ? 'accepted' : dragging ? 'dragging' : 'idle';

  return (
    <div
      className={cn(
        'import-panel mx-auto flex w-full max-w-2xl flex-col gap-4 overflow-hidden px-4 pb-8 pt-3 sm:gap-6 sm:px-6 sm:pb-10 sm:pt-5',
        className
      )}
    >
      <div className="import-ambient" aria-hidden />
      <div className="import-noise" aria-hidden />
      <div className="import-grid-faint" aria-hidden />
      <div className="import-hero-glow" aria-hidden />
      <div className="import-hero-scan" aria-hidden />

      <header className="relative z-[1] text-center md:text-center">
        <p className="import-enter import-enter-d1 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
          Import reference
        </p>
        <h2 className="import-enter import-enter-d2 mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
          Deconstruct any edit.
        </h2>
        <p className="import-enter import-enter-d3 mx-auto mt-2 hidden max-w-lg text-sm leading-relaxed text-zinc-500 md:block">
          Paste a TikTok, Reel, or Shorts link and click Analyze — we download the clip, detect
          beats and cuts, map layered effects, and build a recreation guide. Or upload a local file
          to preview the workflow.
        </p>
      </header>

      <div
        className={cn(
          'import-enter import-enter-d4 import-dropzone relative z-[1] flex flex-col items-center rounded-2xl border border-zinc-800/80 bg-zinc-950/60 px-5 py-8 text-center sm:px-6 sm:py-12',
          dragging && 'is-dragging',
          accepted && 'is-accepted'
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!accepted) setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!accepted) setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragging(false);
        }}
        onDrop={onDrop}
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          aria-hidden
          preserveAspectRatio="none"
        >
          <rect
            className="import-dash-path"
            x="1"
            y="1"
            width="99.5%"
            height="99.5%"
            rx="20"
            ry="20"
            pathLength={100}
          />
        </svg>

        <span className="import-corner import-corner-tl" />
        <span className="import-corner import-corner-tr" />
        <span className="import-corner import-corner-bl" />
        <span className="import-corner import-corner-br" />

        <div className="relative z-[1] mb-5 mt-1">
          <ScanFrameIcon mode={dropMode} />
        </div>

        <p className="relative z-[1] text-[13px] font-semibold uppercase tracking-[0.14em] text-zinc-100">
          {accepted
            ? 'Reference captured'
            : dragging
              ? 'Drop to deconstruct'
              : 'Drop your reference edit'}
        </p>
        <p className="relative z-[1] mx-auto mt-2 max-w-sm text-xs leading-relaxed text-zinc-500">
          {accepted
            ? 'Preparing…'
            : dragging
              ? 'Release to begin'
              : 'MP4, MOV up to 50MB'}
        </p>

        <button
          type="button"
          disabled={accepted}
          onClick={() => inputRef.current?.click()}
          className="import-open-btn relative z-[1] mt-6 inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-60"
        >
          Choose File
        </button>
        <p className="relative z-[1] mt-4 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
          MP4 · MOV · WEBM
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            pickFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>

      <div className="import-enter import-enter-d5 relative z-[1] flex items-center gap-4 px-1">
        <div className="import-or-line" />
        <span className="shrink-0 text-[11px] font-medium lowercase text-zinc-500">
          Or paste a link
        </span>
        <div className="import-or-line" />
      </div>

      <div
        className={cn(
          'import-enter import-enter-d6 import-link-card relative z-[1] p-4 sm:p-5',
          linkFocused && 'is-focused'
        )}
      >
        <div className="import-link-scan" aria-hidden />
        <label className="mb-3 flex items-center gap-2 text-[11px] font-medium text-zinc-500">
          <Link2 className="h-3.5 w-3.5 text-zinc-500" />
          Paste a video link
        </label>

        <div className="flex flex-col gap-2.5">
          <div className="relative min-h-[44px] w-full overflow-hidden rounded-xl border border-zinc-800/90 bg-black/80 transition-[border-color] duration-300 focus-within:border-zinc-500">
            {!url ? (
              <span
                className="pointer-events-none absolute inset-y-0 left-4 z-0 flex items-center text-sm text-zinc-600"
                aria-hidden
              >
                {placeholder}
              </span>
            ) : null}
            <input
              ref={linkRef}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (localError) setLocalError(null);
              }}
              onFocus={() => setLinkFocused(true)}
              onBlur={() => setLinkFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') analyzeLink();
              }}
              aria-label="Reference video link"
              className="relative z-[1] min-h-[44px] w-full bg-transparent px-4 text-sm text-zinc-100 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={analyzeLink}
            disabled={!linkValid || analyzing}
            className={cn(
              'import-analyze-btn inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold sm:w-auto',
              linkValid && !analyzing
                ? 'is-ready bg-white text-black'
                : 'cursor-not-allowed bg-zinc-800/90 text-zinc-500'
            )}
          >
            {analyzing ? (
              <>
                <span className="import-spinner" />
                Starting analysis…
              </>
            ) : (
              <>
                Analyze
                <ArrowRight className="import-analyze-arrow h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const active = activePlatform === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActivePlatform(p.id);
                  linkRef.current?.focus();
                }}
                className={cn(
                  'import-platform-pill inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] sm:text-[10px]',
                  active
                    ? 'border-zinc-500 bg-zinc-900 text-zinc-200'
                    : 'border-zinc-800/80 bg-transparent text-zinc-500 hover:border-zinc-700 hover:text-zinc-400'
                )}
              >
                <PlatformGlyph id={p.id} />
                <span className="sm:hidden">{p.shortLabel}</span>
                <span className="hidden sm:inline">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {(localError || error) && (
        <div className="relative z-[1] rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-center">
          <p className="text-xs text-red-300">{localError || error}</p>
        </div>
      )}
    </div>
  );
}

function PlatformGlyph({ id }: { id: PlatformId }) {
  if (id === 'tiktok') {
    return (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78c.28 0 .56.04.82.12V9a6.33 6.33 0 0 0-.82-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 10.86 4.43V13.2a8.27 8.27 0 0 0 4.84 1.55V11.3a4.85 4.85 0 0 1-.86-.14 4.83 4.83 0 0 1 1.6-4.47Z" />
      </svg>
    );
  }
  if (id === 'instagram') {
    return (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4" strokeWidth="1.8" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.8 15.5v-7l6.2 3.5-6.2 3.5Z" />
    </svg>
  );
}
