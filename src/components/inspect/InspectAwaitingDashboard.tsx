'use client';

import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { InspectUrlField } from './InspectUrlField';

interface InspectAwaitingDashboardProps {
  onSubmitUrl: (url: string) => void;
  onReset: () => void;
  error?: string | null;
}

export function InspectAwaitingDashboard({
  onSubmitUrl,
  onReset,
  error,
}: InspectAwaitingDashboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="relative mx-auto w-full max-w-5xl px-4 pb-12 pt-4 font-sans text-zinc-100 sm:px-6 sm:pt-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(226,232,240,0.07),transparent)]"
      />

      {error ? (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-300"
        >
          {error}
        </motion.p>
      ) : null}

      <div className="relative mb-8">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-2 text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Back
        </button>
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl"
        >
          Paste the link.
          <br />
          <span className="text-zinc-500">We pull the cut apart.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-400 sm:text-base"
        >
          Frame-by-frame breakdown, beat map, transitions, and NLE steps from one URL.
        </motion.p>
      </div>

      <div className="relative mx-auto mt-10 max-w-3xl sm:mt-12">
        <InspectUrlField onSubmit={onSubmitUrl} variant="hero" submitLabel="Pull Edit" />
      </div>
    </motion.div>
  );
}
