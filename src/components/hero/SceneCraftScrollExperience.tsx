'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';

const YELLOW = '#FEF9C3';
const PINK = '#FCE7F3';
const BLUE = '#E0F2FE';

interface SceneCraftScrollExperienceProps {
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

export default function SceneCraftScrollExperience({
  onSignIn,
  onGetStarted,
}: SceneCraftScrollExperienceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const start = onGetStarted ?? onSignIn;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [YELLOW, PINK, BLUE]
  );

  return (
    <motion.div
      ref={containerRef}
      style={{ backgroundColor }}
      className="flex min-h-screen w-full flex-col"
    >
      <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-8 py-4 shadow-sm backdrop-blur-md">
        <Link href="#hero" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-sm font-bold text-white">
            S
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            SceneCraft
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#hero" className="transition-colors hover:text-slate-900">
            Overview
          </a>
          <a href="#features" className="transition-colors hover:text-slate-900">
            Features
          </a>
          <a href="#deconstruct" className="transition-colors hover:text-slate-900">
            Integrations
          </a>
          <Link href="/inspect" className="transition-colors hover:text-slate-900">
            Inspect
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onSignIn}
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={start}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800"
          >
            Get Started
          </button>
        </div>
      </header>

      <section
        id="hero"
        className="relative flex h-[calc(100vh-65px)] w-full items-center justify-center p-6 md:p-12"
      >
        <div className="relative h-full w-full max-w-7xl">
          <Image
            src="/images/velop/yellow-bg.png"
            alt="SceneCraft Hero"
            fill
            priority
            sizes="100vw"
            className="object-contain drop-shadow-md"
          />
        </div>
      </section>

      <section
        id="features"
        className="relative flex h-screen w-full items-center justify-center p-6 md:p-12"
      >
        <div className="relative h-full w-full max-w-7xl">
          <Image
            src="/images/velop/pink-bg.png"
            alt="SceneCraft Features"
            fill
            sizes="100vw"
            className="object-contain drop-shadow-md"
          />
        </div>
      </section>

      <section
        id="deconstruct"
        className="relative flex h-screen w-full items-center justify-center p-6 md:p-12"
      >
        <div className="relative h-full w-full max-w-7xl">
          <Image
            src="/images/velop/blue-bg.png"
            alt="Deconstruct the Edit"
            fill
            sizes="100vw"
            className="object-contain drop-shadow-md"
          />
        </div>
      </section>
    </motion.div>
  );
}
