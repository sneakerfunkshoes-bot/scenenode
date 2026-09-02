'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { scrollToSectionId } from '@/lib/scroll-to-section';
import { Navbar } from './Navbar';
import { HeroVideo } from './HeroVideo';
import { MobileHero } from './MobileHero';
import { GetStartedButton } from './GetStartedButton';
import { LandingSections } from './LandingSections';
import { SiteFooter } from './SiteFooter';
import { EnterWorkspaceOverlay } from '@/components/deconstruct/EnterWorkspaceOverlay';
import { MobileReferenceAnalysis } from '@/components/deconstruct/MobileReferenceAnalysis';

const WORKSPACE_PATH = '/inspect?workspace=1&from=home';
const ENTER_MS = 780;

/** Fade hero copy out during the first ~45% of the laptop zoom. */
function heroTextOpacity(progress: number): number {
  return Math.max(0, 1 - progress / 0.45);
}

function heroTextShift(progress: number): number {
  return -Math.min(48, progress * 110);
}

export function HeroSection() {
  const router = useRouter();
  const desktopHeroRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [heroProgress, setHeroProgress] = useState(0);
  const [entering, setEntering] = useState(false);

  const { scrollYProgress } = useScroll({
    target: desktopHeroRef,
    offset: ['start start', 'end start'],
  });

  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.15], [0.7, 0]);

  const openWorkspace = useCallback(() => {
    if (entering) return;
    setEntering(true);
    window.setTimeout(() => {
      router.push(WORKSPACE_PATH);
    }, ENTER_MS);
  }, [entering, router]);

  const scrollToAnalysis = useCallback(() => {
    scrollToSectionId('reference-analysis');
  }, []);

  const handleGetStarted = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      scrollToAnalysis();
      return;
    }
    openWorkspace();
  }, [openWorkspace, scrollToAnalysis]);

  const openExample = useCallback(
    (exampleId: string) => {
      router.push(`/inspect?example=${encodeURIComponent(exampleId)}`);
    },
    [router]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    const t = window.setTimeout(() => scrollToSectionId(hash), 120);
    return () => window.clearTimeout(t);
  }, []);

  const textOpacity = heroTextOpacity(heroProgress);
  const textY = heroTextShift(heroProgress);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black font-sans text-white selection:bg-zinc-500 selection:text-white md:bg-[var(--hero-video-bg)]">
      <Navbar onGetStarted={handleGetStarted} />

      {/* Mobile hero — unchanged */}
      <MobileHero onGetStarted={scrollToAnalysis} entering={entering} />

      {/* Desktop — cinematic laptop zoom (scroll-pinned) */}
      <section
        ref={desktopHeroRef}
        className={cn(
          'relative hidden h-[165vh] md:block',
          entering && 'pointer-events-none'
        )}
      >
        <div
          className={cn(
            'sticky top-0 flex h-[100svh] w-full flex-col items-center justify-center overflow-hidden pb-safe pt-14 transition duration-700 ease-out md:pt-16',
            entering && 'scale-[1.03] opacity-40 blur-sm'
          )}
        >
          {mounted && (
            <HeroVideo
              onProgress={(p) => setHeroProgress(p)}
              scrollProgress={scrollYProgress}
            />
          )}

          {/* Hero copy — top overlay; fades as camera enters the laptop screen */}
          <motion.div
            className="pointer-events-none absolute inset-x-0 top-[10%] z-30 flex w-full flex-col items-center px-6 text-center md:top-[11%]"
            style={{
              opacity: textOpacity,
              y: textY,
            }}
          >
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.85)] lg:text-5xl xl:text-7xl">
              Edit Seamlessly.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-300 drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)] lg:text-lg">
              Get a step-by-step breakdown, beat maps, and transition guides to recreate
              the exact edit by pasting the link of an edit.
            </p>

            <div
              className="pointer-events-auto mt-6"
              style={{ opacity: textOpacity }}
            >
              <GetStartedButton
                onClick={openWorkspace}
                pressed={entering}
              />
            </div>
          </motion.div>

          {/* Subtle scroll hint before zoom completes */}
          <motion.div
            className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 text-[10px] uppercase tracking-[0.22em] text-zinc-600"
            style={{ opacity: scrollHintOpacity }}
          >
            Scroll to explore
          </motion.div>
        </div>
      </section>

      {/* Mobile reference analysis */}
      <MobileReferenceAnalysis />

      <div className={cn('transition duration-700', entering && 'opacity-0')}>
        <LandingSections onOpenExample={openExample} />
        <SiteFooter />
      </div>

      <AnimatePresence>{entering ? <EnterWorkspaceOverlay /> : null}</AnimatePresence>
    </div>
  );
}
