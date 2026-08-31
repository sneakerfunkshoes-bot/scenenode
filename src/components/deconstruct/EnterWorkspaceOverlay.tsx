'use client';

import { motion } from 'framer-motion';

/** Full-viewport cinematic morph while entering the SceneNode workspace. */
export function EnterWorkspaceOverlay() {
  return (
    <motion.div
      key="enter-workspace"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
      />
      <motion.div
        className="relative h-[72vmin] w-[min(920px,88vw)] overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-950 shadow-2xl"
        initial={{ scale: 0.72, opacity: 0.55, y: 28 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex h-12 items-center border-b border-zinc-800 px-4">
          <span className="text-xs font-semibold tracking-tight text-zinc-200">scenenode</span>
          <span className="ml-3 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
            Entering workspace
          </span>
        </div>
        <div className="grid h-[calc(100%-3rem)] grid-cols-[72px_1fr]">
          <div className="border-r border-zinc-800 bg-zinc-950" />
          <div className="relative flex items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.06),transparent_55%)]">
            <motion.div
              className="h-24 w-40 rounded-xl border border-dashed border-zinc-700"
              initial={{ opacity: 0.3, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
