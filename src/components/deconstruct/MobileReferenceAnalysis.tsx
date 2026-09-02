'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSupportedVideoUrl } from '@/lib/video-url';
import {
  DEFAULT_EDITOR_ID,
  getEditorProduct,
  type EditorProductId,
} from '@/lib/editor-products';
import { setPendingInspectFile } from '@/lib/pending-inspect';
import {
  EditorSelectorGrid,
} from '@/components/deconstruct/EditorSelectorGrid';

const ACCEPT = 'video/mp4,video/quicktime,video/webm,video/*';
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export interface MobileReferenceAnalysisProps {
  className?: string;
  /** landing = homepage section with id; workspace = inside /inspect */
  variant?: 'landing' | 'workspace';
  /** When true, navigate to /inspect on submit. When false, call callbacks only. */
  navigateOnSubmit?: boolean;
  onSubmitUrl?: (url: string, editorId: EditorProductId) => void;
  onSelectFile?: (file: File, editorId: EditorProductId) => void;
  error?: string | null;
}

export function MobileReferenceAnalysis({
  className,
  navigateOnSubmit = true,
  variant = 'landing',
  onSubmitUrl,
  onSelectFile,
  error,
}: MobileReferenceAnalysisProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');
  const [editorId, setEditorId] = useState<EditorProductId>(DEFAULT_EDITOR_ID);
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const linkValid = useMemo(() => {
    const trimmed = url.trim();
    return Boolean(trimmed && isSupportedVideoUrl(trimmed));
  }, [url]);

  const canAnalyze = Boolean(selectedFile || linkValid);

  const goInspect = useCallback(
    (params: { url?: string; file?: File }) => {
      const product = getEditorProduct(editorId);
      const nle = product.nle;
      const editor = editorId;

      if (params.file) {
        if (onSelectFile) {
          onSelectFile(params.file, editorId);
          return;
        }
        setPendingInspectFile(params.file, editorId);
        router.push(`/inspect?workspace=1&editor=${encodeURIComponent(editor)}&nle=${encodeURIComponent(nle)}`);
        return;
      }

      if (params.url) {
        if (onSubmitUrl) {
          onSubmitUrl(params.url, editorId);
          return;
        }
        router.push(
          `/inspect?workspace=1&url=${encodeURIComponent(params.url)}&editor=${encodeURIComponent(editor)}&nle=${encodeURIComponent(nle)}`
        );
      }
    },
    [editorId, navigateOnSubmit, onSelectFile, onSubmitUrl, router]
  );

  const pickFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setLocalError('Please choose a video file (MP4, MOV, or WEBM).');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setLocalError('File is too large. Maximum size is 50 MB.');
      return;
    }
    setLocalError(null);
    setSelectedFile(file);
    setUrl('');
  };

  const handleAnalyze = () => {
    if (!canAnalyze) {
      setLocalError('Upload a video or paste a supported link first.');
      return;
    }
    setSubmitting(true);
    setLocalError(null);
    if (selectedFile) {
      goInspect({ file: selectedFile });
    } else {
      goInspect({ url: url.trim() });
    }
  };

  return (
    <section
      id={variant === 'landing' ? 'reference-analysis' : undefined}
      className={cn(
        'scroll-mt-20 bg-black px-4 py-6 pb-safe md:hidden',
        variant === 'landing' && 'border-t border-zinc-900/80 py-10',
        className
      )}
    >
      {variant === 'landing' ? (
        <header className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white">Deconstruct any edit.</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Upload a reference edit or paste a link. SceneNode will analyze the edit and create a
            step-by-step recreation guide.
          </p>
        </header>
      ) : null}

      {/* Upload card */}
      <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/80 p-5">
        <p className="text-center text-[12px] font-bold uppercase tracking-[0.18em] text-zinc-200">
          Drop your reference edit
        </p>
        <p className="mt-2 text-center text-xs text-zinc-500">MP4, MOV, WEBM up to 50MB</p>

        {selectedFile ? (
          <p className="mt-4 truncate text-center text-sm text-zinc-300">{selectedFile.name}</p>
        ) : null}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-5 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          Choose File
        </button>
        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.2em] text-zinc-600">
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

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-800/80" />
        <span className="text-[11px] font-medium lowercase text-zinc-500">or paste a link</span>
        <div className="h-px flex-1 bg-zinc-800/80" />
      </div>

      <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/80 p-4">
        <label className="mb-2 flex items-center gap-2 text-[11px] font-medium text-zinc-500">
          <Link2 className="h-3.5 w-3.5" />
          Paste a video link
        </label>
        <input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (selectedFile) setSelectedFile(null);
            if (localError) setLocalError(null);
          }}
          placeholder="TikTok, Instagram Reel, or YouTube Shorts URL"
          className="min-h-[48px] w-full rounded-xl border border-zinc-800 bg-black/80 px-4 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
        />
        <p className="mt-2 text-[11px] text-zinc-600">TikTok · Instagram Reels · YouTube Shorts</p>

        <button
          type="button"
          onClick={() => {
            if (!linkValid) {
              setLocalError('Paste a valid TikTok, Reels, or Shorts link.');
              return;
            }
            setSelectedFile(null);
            setLocalError(null);
            setSubmitting(true);
            goInspect({ url: url.trim() });
          }}
          disabled={!linkValid || submitting}
          className={cn(
            'mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition',
            linkValid && !submitting
              ? 'bg-zinc-800 text-white hover:bg-zinc-700'
              : 'cursor-not-allowed bg-zinc-900 text-zinc-600'
          )}
        >
          Analyze
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-800/90 bg-zinc-950/50 p-4">
        <EditorSelectorGrid value={editorId} onChange={setEditorId} />
      </div>

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={!canAnalyze || submitting}
        className={cn(
          'mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl text-base font-semibold transition',
          canAnalyze && !submitting
            ? 'bg-white text-black hover:bg-zinc-200'
            : 'cursor-not-allowed bg-zinc-800 text-zinc-500'
        )}
      >
        Analyze &amp; Build Guide
        <ArrowRight className="h-4 w-4" />
      </button>

      {(localError || error) && (
        <p className="mt-4 text-center text-xs text-red-300">{localError || error}</p>
      )}
    </section>
  );
}
