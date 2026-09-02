'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
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

export function HeroSection() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLaptopOpen, setIsLaptopOpen] = useState(false);
  const [entering, setEntering] = useState(false);
  const [mobileAnalysisOpen, setMobileAnalysisOpen] = useState(false);

  const openWorkspace = useCallback(() => {
    if (entering) return;
    setEntering(true);
    window.setTimeout(() => {
      router.push(WORKSPACE_PATH);
    }, ENTER_MS);
  }, [entering, router]);

  const openMobileAnalysis = useCallback(() => {
    setMobileAnalysisOpen(true);
    window.setTimeout(() => scrollToSectionId('reference-analysis'), 80);
  }, []);

  const handleGetStarted = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      openMobileAnalysis();
      return;
    }
    openWorkspace();
  }, [openWorkspace, openMobileAnalysis]);

  const openExample = useCallback(
    (exampleId: string) => {
      router.push(`/inspect?example=${encodeURIComponent(exampleId)}`);
    },
    [router]
  );

  const revealHero = useCallback(() => {
    setIsLaptopOpen(true);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    if (hash === 'reference-analysis') {
      setMobileAnalysisOpen(true);
    }
    const t = window.setTimeout(() => scrollToSectionId(hash), 120);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black font-sans text-white selection:bg-zinc-500 selection:text-white">
      <Navbar onGetStarted={handleGetStarted} />

      {/* Mobile hero */}
      <MobileHero onGetStarted={openMobileAnalysis} entering={entering} />

      {/* Desktop — exact laptop animation from 1st draft */}
      <section
        className={cn(
          'relative hidden h-screen w-full items-center justify-center overflow-hidden pt-16 md:flex',
          entering && 'pointer-events-none'
        )}
      >
        {mounted && (
          <HeroVideo
            faded={entering}
            onLaptopOpen={revealHero}
          />
        )}

        <div
          className={cn(
            'relative z-10 my-auto flex max-w-3xl flex-col items-center space-y-6 px-4 text-center transition-all duration-1000 ease-out',
            isLaptopOpen
              ? 'pointer-events-auto scale-100 opacity-100'
              : 'pointer-events-none scale-95 opacity-0'
          )}
        >
          <h1 className="text-5xl font-extrabold tracking-tight text-white drop-shadow-2xl sm:text-7xl">
            Edit Seamlessly.
          </h1>

          <p className="mx-auto max-w-xl text-base font-normal leading-relaxed text-zinc-300 drop-shadow-md sm:text-lg">
            Get a step-by-step breakdown, beat maps, and transition guides to recreate
            the exact edit by pasting the link of an edit.
          </p>

          <GetStartedButton onClick={openWorkspace} pressed={entering} />
        </div>
      </section>

      <AnimatePresence>
        {mobileAnalysisOpen ? (
          <motion.div
            key="mobile-analysis"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <MobileReferenceAnalysis />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className={cn('hidden transition duration-700 md:block', entering && 'opacity-0')}>
        <LandingSections onOpenExample={openExample} />
        <SiteFooter />
      </div>

      <AnimatePresence>{entering ? <EnterWorkspaceOverlay /> : null}</AnimatePresence>
    </div>
  );
}
