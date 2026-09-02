'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GetStartedButton } from './GetStartedButton';

const MOBILE_LAPTOP_SRC = '/images/hero-laptop-mobile.jpg';

/** Brief delay before copy pops in on static mobile hero. */
const COPY_REVEAL_MS = 900;

const popUp = {
  hidden: { opacity: 0, y: 28, scale: 0.94 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

interface MobileHeroProps {
  onGetStarted: () => void;
  entering?: boolean;
}

export function MobileHero({ onGetStarted, entering }: MobileHeroProps) {
  const [imageReady, setImageReady] = useState(false);
  const [copyVisible, setCopyVisible] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setCopyVisible(true), COPY_REVEAL_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-black md:hidden">
      {/* Android / phone — static MacBook image only */}
      <div className="relative h-[min(78svh,620px)] w-full overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-[8%] bottom-[18%] h-16 rounded-[100%] bg-white/[0.06] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-[12%] bottom-[10%] h-8 bg-gradient-to-t from-white/10 via-white/5 to-transparent blur-xl"
          aria-hidden
        />

        <div className="absolute inset-x-0 top-0 h-[82%]">
          <div className="relative mx-auto h-full w-full max-w-[100vw]">
            {!imageReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-9 w-9 animate-spin rounded-full border border-white/20 border-t-white" />
              </div>
            )}

            <Image
              src={MOBILE_LAPTOP_SRC}
              alt="SceneNode on MacBook Pro"
              fill
              priority
              sizes="100vw"
              onLoad={() => setImageReady(true)}
              className={cn(
                'object-contain object-[center_42%] transition-opacity duration-500',
                imageReady ? 'opacity-100' : 'opacity-0'
              )}
              style={{ transform: 'scale(1.12)' }}
            />
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/90 to-transparent"
          aria-hidden
        />
      </div>

      <div
        className={cn(
          'relative z-10 px-5 pb-8 pt-2 transition duration-700',
          entering && 'scale-95 opacity-0'
        )}
      >
        <motion.h1
          className="text-[1.75rem] font-extrabold leading-[1.15] tracking-tight text-white"
          variants={popUp}
          initial="hidden"
          animate={copyVisible ? 'visible' : 'hidden'}
          custom={0}
        >
          Edit Seamlessly.
        </motion.h1>

        <motion.p
          className="mt-3 text-[15px] leading-relaxed text-zinc-400"
          variants={popUp}
          initial="hidden"
          animate={copyVisible ? 'visible' : 'hidden'}
          custom={0.12}
        >
          Get a step-by-step breakdown, beat maps, and transition guides to recreate the exact
          edit by pasting the link of an edit.
        </motion.p>

        <motion.div
          className="mt-6"
          variants={popUp}
          initial="hidden"
          animate={copyVisible ? 'visible' : 'hidden'}
          custom={0.24}
        >
          <GetStartedButton
            onClick={onGetStarted}
            pressed={entering}
            className="w-full min-h-[52px] text-base"
          />
        </motion.div>
      </div>
    </section>
  );
}
