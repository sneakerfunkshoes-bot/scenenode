'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Clapperboard, Instagram, Link2, Youtube } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { isSupportedVideoUrl } from '@/lib/video-url';

const PLATFORMS = [
  { label: 'TikTok', icon: Clapperboard },
  { label: 'Reels', icon: Instagram },
  { label: 'Shorts', icon: Youtube },
] as const;

interface InspectUrlFieldProps {
  onSubmit: (url: string) => void;
  initialValue?: string;
  variant?: 'compact' | 'hero';
  submitLabel?: string;
  className?: string;
}

export function InspectUrlField({
  onSubmit,
  initialValue = '',
  variant = 'compact',
  submitLabel = 'Deconstruct',
  className,
}: InspectUrlFieldProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [pastedFlash, setPastedFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hero = variant === 'hero';
  const hasValue = Boolean(value.trim());

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Paste a link first.');
      return;
    }
    if (!isSupportedVideoUrl(trimmed)) {
      setError('Use a TikTok, Instagram Reels, or YouTube Shorts URL.');
      return;
    }
    setError(null);
    onSubmit(trimmed);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    submit();
  };

  const onPaste = () => {
    setPastedFlash(true);
    window.setTimeout(() => setPastedFlash(false), 700);
  };

  if (!hero) {
    return (
      <form onSubmit={handleSubmit} className={cn('w-full', className)}>
        <div
          className={cn(
            'relative flex items-center gap-2 overflow-hidden rounded-xl border bg-zinc-950/90 p-1.5 transition',
            focused ? 'border-zinc-500 shadow-[0_0_24px_rgba(226,232,240,0.08)]' : 'border-zinc-800'
          )}
        >
          <input
            ref={inputRef}
            type="url"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onPaste={onPaste}
            placeholder="Paste link"
            className="min-w-0 flex-1 bg-transparent px-2 text-xs text-white outline-none placeholder:text-zinc-600 md:text-sm"
            autoComplete="off"
          />
          <button
            type="submit"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-zinc-200 px-3 py-2 text-xs font-semibold text-black transition hover:bg-white"
          >
            {submitLabel}
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        {error ? <p className="mt-2 px-1 text-xs font-medium text-red-400">{error}</p> : null}
      </form>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className={cn('w-full', className)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="group relative">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-[1px] rounded-[1.35rem] opacity-50"
          style={{
            background:
              'conic-gradient(from 0deg, transparent, rgba(226,232,240,0.35), transparent, rgba(226,232,240,0.15), transparent)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />

        <div
          className={cn(
            'relative overflow-hidden rounded-[1.25rem] border bg-[#050505]/95 backdrop-blur-xl transition duration-500',
            focused || pastedFlash
              ? 'border-zinc-400/70 shadow-[0_0_60px_rgba(226,232,240,0.14),inset_0_1px_0_rgba(226,232,240,0.12)]'
              : 'border-zinc-700/90 shadow-[0_24px_80px_rgba(0,0,0,0.55)]'
          )}
        >
          <div aria-hidden className="link-dock-grid absolute inset-0 opacity-70" />
          <div aria-hidden className="link-dock-shimmer absolute inset-0 opacity-30" />

          <AnimatePresence>
            {pastedFlash ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(226,232,240,0.16),transparent_65%)]"
              />
            ) : null}
          </AnimatePresence>

          <div className="relative flex flex-col gap-5 px-5 py-6 sm:gap-6 sm:px-7 sm:py-8">
            {/* Paste zone */}
            <button
              type="button"
              onClick={() => inputRef.current?.focus()}
              className={cn(
                'relative w-full overflow-hidden rounded-2xl border-2 border-dashed px-4 py-8 text-left transition duration-300 sm:px-6 sm:py-10',
                focused || hasValue
                  ? 'border-zinc-400 bg-zinc-900/80'
                  : 'border-zinc-600 bg-zinc-950/60 hover:border-zinc-500 hover:bg-zinc-900/70'
              )}
            >
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-zinc-300/40 to-transparent"
                animate={{ opacity: focused ? 1 : 0.4 }}
              />

              <div className="relative flex items-start gap-3 sm:gap-4">
                <span
                  className={cn(
                    'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition',
                    focused || hasValue
                      ? 'border-zinc-500 bg-zinc-800 text-zinc-200'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-500'
                  )}
                >
                  <Link2 className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                  {!hasValue && !focused ? (
                    <p className="mb-2 text-sm font-medium text-zinc-300 sm:text-base">
                      Paste your edit link here
                    </p>
                  ) : null}

                  <input
                    ref={inputRef}
                    type="url"
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                      if (error) setError(null);
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onPaste={onPaste}
                    onClick={(e) => e.stopPropagation()}
                    placeholder=""
                    aria-label="Paste video link"
                    className="w-full bg-transparent text-sm leading-relaxed text-white outline-none sm:text-base md:text-lg"
                    autoComplete="off"
                    spellCheck={false}
                  />

                  {!hasValue && focused ? (
                    <p className="mt-1 text-xs text-zinc-600">Ctrl+V / Cmd+V</p>
                  ) : null}
                </div>
              </div>
            </button>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {PLATFORMS.map((platform, i) => {
                const Icon = platform.icon;
                return (
                  <motion.span
                    key={platform.label}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + i * 0.06 }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-[11px] font-medium text-zinc-400"
                  >
                    <Icon className="h-3 w-3 text-zinc-500" />
                    {platform.label}
                  </motion.span>
                );
              })}
            </div>

            {/* Button at bottom */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              className="group/btn relative mt-1 flex w-full min-h-[52px] items-center justify-center gap-2 overflow-hidden rounded-xl border border-zinc-600/80 bg-zinc-100 px-6 py-3.5 text-sm font-semibold text-black shadow-[0_0_32px_rgba(226,232,240,0.16)] transition hover:border-white hover:bg-white hover:shadow-[0_0_48px_rgba(226,232,240,0.28)]"
            >
              <span className="relative z-10">{submitLabel}</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition group-hover/btn:translate-x-0.5" />
              <motion.span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                animate={{ x: ['-120%', '120%'] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
              />
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 px-2 text-center text-xs font-medium text-red-400"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </motion.form>
  );
}
