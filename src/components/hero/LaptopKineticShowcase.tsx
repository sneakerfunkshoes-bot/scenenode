'use client';

import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Play, Sparkles } from 'lucide-react';
import { SunburstIcon } from '@/components/brand/SunburstIcon';
import { KINETIC_EASE, SHOWCASE_SLIDES, type ShowcaseSlide } from './laptop-kinetic';

interface LaptopKineticShowcaseProps {
  index: number;
  faded?: boolean;
  children?: ReactNode;
  onNext: () => void;
}

export function LaptopKineticShowcase({
  index,
  faded = false,
  children,
  onNext,
}: LaptopKineticShowcaseProps) {
  const current = SHOWCASE_SLIDES[index % SHOWCASE_SLIDES.length];

  return (
    <motion.section
      className="relative flex h-screen w-full cursor-pointer select-none items-center justify-center overflow-hidden pt-16"
      animate={{ backgroundColor: current.bgColor, opacity: faded ? 0.28 : 1 }}
      transition={{ duration: 0.7, ease: KINETIC_EASE }}
      onClick={onNext}
    >
      <AnimatePresence mode="wait">
        {current.bgType === 'blue' && (
          <motion.div
            key="waves"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            <CloudWaveBackground />
          </motion.div>
        )}
        {current.bgType === 'terracotta' && (
          <motion.div
            key="starburst"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute left-16 top-12 z-0"
            style={{ color: current.accentColor }}
          >
            <SunburstIcon className="h-24 w-24 text-current md:h-32 md:w-32" spin />
          </motion.div>
        )}
        {current.bgType === 'purple' && (
          <motion.div
            key="lamp"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            className="absolute left-12 top-0 z-0"
          >
            <StudioLampIcon className="h-24 w-24 md:h-36 md:w-36" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.h1
          key={current.id}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 0.08 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="pointer-events-none absolute bottom-8 left-8 z-0 select-none font-black leading-none tracking-tighter md:left-12"
          style={{ color: current.textColor, fontSize: 'clamp(4rem, 14vw, 12rem)' }}
        >
          {current.giantTitle}
        </motion.h1>
      </AnimatePresence>

      <div
        className="relative z-10 flex w-[min(88vw,320px)] items-center justify-center md:w-[min(52vw,580px)] lg:-translate-x-8"
        style={{ perspective: 1000 }}
      >
        <motion.div
          animate={{
            rotateY: index * 180,
            rotateZ: current.rotationZ,
            scale: current.scale,
          }}
          transition={{
            rotateY: { duration: 0.85, ease: KINETIC_EASE },
            rotateZ: { duration: 0.6 },
            scale: { duration: 0.5 },
          }}
          style={{ transformStyle: 'preserve-3d' }}
          className="w-full"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
            className="w-full"
          >
            <LaptopMockup current={current} />
          </motion.div>
        </motion.div>
      </div>

      <div
        className="absolute right-6 top-[20%] z-20 hidden max-w-xs space-y-4 text-left md:right-16 md:block md:max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-xl font-black leading-tight md:text-2xl"
          style={{ color: current.textColor }}
        >
          {current.mainHeading}
        </h2>

        <p
          className="text-xs font-medium leading-relaxed opacity-90 md:text-sm"
          style={{ color: current.textColor }}
        >
          {current.bodyText}
        </p>

        <div className="space-y-2 pt-2">
          {current.featuresList.map((item, i) => (
            <motion.div
              key={`${current.id}-${item.title}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, ease: KINETIC_EASE }}
              className="flex items-start gap-2"
            >
              <ChevronRight
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: current.accentColor }}
              />
              <div>
                <div className="text-xs font-bold md:text-sm" style={{ color: current.textColor }}>
                  {item.title}
                </div>
                <div
                  className="text-[11px] leading-tight opacity-75"
                  style={{ color: current.textColor }}
                >
                  {item.desc}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="pt-4 font-mono text-[10px] opacity-60" style={{ color: current.textColor }}>
          Click anywhere to trigger 3D spin loop ↺
        </p>
      </div>

      {children ? (
        <div
          className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      ) : null}
    </motion.section>
  );
}

function CloudWaveBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="h-48 w-full md:h-64">
        <path
          d="M0,0 C150,90 350,-40 500,60 C650,160 900,-20 1200,40 L1200,0 L0,0 Z"
          fill="#BBE2FA"
          opacity="0.7"
        />
        <path
          d="M0,0 C200,85 450,20 680,60 C850,90 1050,30 1200,45 L1200,0 L0,0 Z"
          fill="#A4D8F9"
        />
      </svg>
    </div>
  );
}

function StudioLampIcon({ className = 'h-16 w-16' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <rect x="47" y="0" width="6" height="35" fill="#8A2BE2" />
      <path d="M 20 65 A 30 30 0 0 1 80 65 Z" fill="#8A2BE2" />
      <ellipse cx="50" cy="65" rx="30" ry="8" fill="#D8B4F8" opacity="0.6" />
    </svg>
  );
}

function LaptopMockup({ current }: { current: ShowcaseSlide }) {
  return (
    <div className="relative w-full">
      <div className="relative flex aspect-[16/10] w-full flex-col overflow-hidden rounded-2xl border-4 border-zinc-800 bg-zinc-950 p-3 shadow-2xl">
        <div className="flex h-5 shrink-0 items-center justify-between rounded-t-xl border-b border-zinc-800 bg-zinc-900 px-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="font-mono text-[10px] text-zinc-400">
            SceneCraft IDE · {current.id}
          </span>
        </div>

        <div className="relative m-1 flex min-h-0 flex-1 flex-col justify-between overflow-hidden rounded-lg border border-zinc-800/80 bg-[#0D0D11] p-4 text-zinc-100">
          <div className="flex items-center justify-between">
            <span
              className="flex items-center gap-1.5 text-xs font-bold tracking-wider"
              style={{ color: current.accentColor }}
            >
              <Sparkles className="h-3.5 w-3.5" /> SceneCraft Engine
            </span>
            <span className="font-mono text-[10px] text-zinc-500">Auto-BPM Sync</span>
          </div>

          <div className="my-auto space-y-1.5 text-left">
            <h3 className="text-base font-extrabold leading-tight text-white md:text-lg">
              {current.mainHeading}
            </h3>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-800 pt-2 font-mono text-[10px] text-zinc-400">
            <span className="flex items-center gap-1">
              <Play className="h-3 w-3 fill-current text-white" /> Visual Inspection
            </span>
            <span className="font-bold text-white">4K 60FPS</span>
          </div>
        </div>
      </div>

      <div
        className="mx-auto h-3 w-[108%] -translate-x-[4%] rounded-b-xl bg-gradient-to-b from-zinc-700 to-zinc-900"
        style={{ clipPath: 'polygon(4% 0, 96% 0, 100% 100%, 0 100%)' }}
      />
    </div>
  );
}
