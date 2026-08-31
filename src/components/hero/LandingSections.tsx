'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { EXAMPLE_INSPECTS } from '@/lib/example-inspects';

const FEATURES = [
  {
    title: 'Beat-true timelines',
    body: 'Auto-detect BPM, drops, and cut points so every flash lands on the music.',
  },
  {
    title: 'NLE-ready guides',
    body: 'DaVinci, Premiere, After Effects, CapCut, and VN — step maps for your stack.',
  },
  {
    title: 'Edit Assistant AI',
    body: 'Ask how to recreate any marker. Get exact tools, frames, and settings back.',
  },
] as const;

const NLES = [
  'DaVinci Resolve',
  'Premiere Pro',
  'After Effects',
  'CapCut',
  'VN Editor',
] as const;

interface LandingSectionsProps {
  onOpenExample?: (exampleId: string) => void;
}

export function LandingSections({ onOpenExample }: LandingSectionsProps) {
  return (
    <div className="relative z-10">
      <section
        id="overview"
        className="flex w-full scroll-mt-24 flex-col items-center justify-center border-t border-zinc-900/80 bg-zinc-950 px-4 py-16 text-center sm:px-6 sm:py-24 md:py-28"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl space-y-6"
        >
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-5xl">
            Deconstruct the edit. Rebuild it beautifully.
          </h2>

          <p className="mx-auto max-w-2xl text-base font-normal leading-relaxed text-zinc-400 sm:text-lg">
            Paste a TikTok, Reel, or Shorts link and get a cinematic breakdown — song info,
            BPM, visual SFX, transitions, flashes, and color notes.
          </p>
        </motion.div>
      </section>

      <section
        id="features"
        className="w-full scroll-mt-24 border-t border-zinc-900 bg-black px-4 py-16 sm:px-6 sm:py-24 md:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Features
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {FEATURES.map((f, i) => (
              <motion.article
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 sm:p-6"
              >
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="examples"
        className="w-full scroll-mt-24 border-t border-zinc-900 bg-zinc-950 px-4 py-16 sm:px-6 sm:py-24 md:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl">
            See a finished breakdown before you paste a link.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-zinc-400">
            Open a precomputed inspect — song, BPM, overlays, and NLE steps — then try your own URL.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXAMPLE_INSPECTS.map((example, i) => (
              <motion.article
                key={example.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
              >
                <Link
                  href={`/inspect?example=${example.id}`}
                  onClick={(e) => {
                    if (!onOpenExample) return;
                    e.preventDefault();
                    onOpenExample(example.id);
                  }}
                  className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-black/60 p-5 transition hover:border-zinc-600 hover:bg-zinc-950"
                >
                  <span className="text-xs text-zinc-500">{example.style}</span>
                  <h3 className="mt-2 text-base font-semibold text-white">
                    {example.breakdown.songTitle}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    {example.breakdown.songArtist} · {example.breakdown.bpm} BPM · {example.nle}
                  </p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">
                    {example.blurb}
                  </p>
                  <span className="mt-4 text-xs font-semibold text-zinc-300">
                    Open inspect →
                  </span>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="nles"
        className="w-full scroll-mt-24 border-t border-zinc-900 bg-zinc-950 px-4 py-14 sm:px-6 sm:py-20"
      >
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
            Supported NLEs
          </h2>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {NLES.map((nle) => (
              <span
                key={nle}
                className="rounded-full border border-zinc-800 bg-black px-4 py-2 text-xs text-zinc-300"
              >
                {nle}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
