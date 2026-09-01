'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { scrollToSectionId } from '@/lib/scroll-to-section';
import { Navbar } from './Navbar';
import { HeroVideo } from './HeroVideo';
import { GetStartedButton } from './GetStartedButton';
import { LandingSections } from './LandingSections';
import { SiteFooter } from './SiteFooter';
import { EnterWorkspaceOverlay } from '@/components/deconstruct/EnterWorkspaceOverlay';

const WORKSPACE_PATH = '/inspect?workspace=1&from=home';
const ENTER_MS = 780;

export function HeroSection() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLaptopOpen, setIsLaptopOpen] = useState(false);
  const [entering, setEntering] = useState(false);

  const openWorkspace = useCallback(() => {
    if (entering) return;
    setEntering(true);
    window.setTimeout(() => {
      router.push(WORKSPACE_PATH);
    }, ENTER_MS);
  }, [entering, router]);

  const revealHero = useCallback(() => {
    setIsLaptopOpen(true);
  }, []);

  useEffect(() => {
    setMounted(true);
    // Mobile: show headline/CTA immediately — don't wait for video autoplay
    if (window.matchMedia('(max-width: 767px)').matches) {
      setIsLaptopOpen(true);
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    const t = window.setTimeout(() => scrollToSectionId(hash), 120);
    return () => window.clearTimeout(t);
  }, []);

  const openExample = useCallback(
    (exampleId: string) => {
      router.push(`/inspect?example=${encodeURIComponent(exampleId)}`);
    },
    [router]
  );

  const heroContentClass = cn(
    'relative z-10 flex w-full max-w-full flex-col transition-all duration-1000 ease-out',
    isLaptopOpen
      ? 'pointer-events-auto scale-100 opacity-100'
      : 'pointer-events-none scale-95 opacity-0 max-md:pointer-events-auto max-md:scale-100 max-md:opacity-100',
    entering && 'scale-95 opacity-0',
    /* mobile */
    'mt-[min(48vh,420px)] items-start px-5 pb-8 pt-6 text-left',
    /* desktop */
          'md:my-auto md:mt-0 md:max-w-3xl md:items-center md:space-y-5 md:px-4 md:pb-0 md:pt-0 md:text-center md:px-6'
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black font-sans text-white selection:bg-zinc-500 selection:text-white md:bg-[var(--hero-video-bg)]">
      <Navbar onGetStarted={openWorkspace} />

      <section
        className={cn(
          'relative flex min-h-[100svh] w-full max-w-full flex-col justify-end overflow-hidden pb-safe pt-14 transition duration-700 ease-out',
          'md:items-center md:justify-center md:pt-16',
          entering && 'scale-[1.03] opacity-40 blur-sm'
        )}
      >
        {mounted && <HeroVideo onLaptopOpen={revealHero} />}

        <div className={heroContentClass}>
          <h1 className="text-[2rem] font-extrabold leading-tight tracking-tight text-white md:text-3xl lg:text-5xl xl:text-7xl">
            Edit Seamlessly.
          </h1>

          <p className="mt-4 max-w-full text-[15px] font-normal leading-relaxed text-zinc-300 md:mx-auto md:mt-0 md:max-w-xl md:text-sm lg:text-lg">
            Get a step-by-step breakdown, beat maps, and transition guides to recreate
            the exact edit by pasting the link of an edit.
          </p>

          <div className="mt-6 w-full md:mt-2 md:w-auto">
            <GetStartedButton
              onClick={openWorkspace}
              pressed={entering}
              className="w-full md:w-auto"
            />
          </div>
        </div>
      </section>

      <div className={cn('transition duration-700', entering && 'opacity-0')}>
        <LandingSections onOpenExample={openExample} />
        <SiteFooter />
      </div>

      <AnimatePresence>{entering ? <EnterWorkspaceOverlay /> : null}</AnimatePresence>
    </div>
  );
}
