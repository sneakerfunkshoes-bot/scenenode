'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GetStartedButton } from './GetStartedButton';

const MOBILE_LAPTOP_SRC = '/images/hero-laptop-mobile.jpg';
const VIDEO_SRC = '/videos/laptop-animation.mp4?v=4k';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenOpenFired = useRef(false);
  const [posterReady, setPosterReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [screenOpen, setScreenOpen] = useState(false);

  const revealCopy = useCallback(() => {
    if (screenOpenFired.current) return;
    screenOpenFired.current = true;
    setScreenOpen(true);
  }, []);

  const tryAutoplay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || videoFailed) return;
    video.loop = false;
    try {
      await video.play();
      setVideoReady(true);
    } catch {
      setVideoFailed(true);
      revealCopy();
    }
  }, [videoFailed, revealCopy]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video?.duration) return;
    const progress = video.currentTime / video.duration;
    if (progress >= 0.55) {
      revealCopy();
    }
  }, [revealCopy]);

  const handleEnded = useCallback(() => {
    const video = videoRef.current;
    if (video?.duration) {
      video.pause();
      video.currentTime = Math.max(0, video.duration - 0.05);
    }
    revealCopy();
  }, [revealCopy]);

  useEffect(() => {
    void tryAutoplay();
  }, [tryAutoplay]);

  const showVideo = videoReady && !videoFailed;

  return (
    <section className="relative w-full overflow-hidden bg-black md:hidden">
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
          <div className="relative mx-auto flex h-full w-full max-w-[100vw] items-center justify-center">
            {!posterReady && !showVideo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-9 w-9 animate-spin rounded-full border border-white/20 border-t-white" />
              </div>
            )}

            {/* Poster — static MacBook until video plays */}
            <Image
              src={MOBILE_LAPTOP_SRC}
              alt="SceneNode on MacBook Pro"
              fill
              priority
              sizes="100vw"
              onLoad={() => setPosterReady(true)}
              className={cn(
                'object-contain object-[center_42%] transition-opacity duration-500',
                showVideo ? 'pointer-events-none opacity-0' : posterReady ? 'opacity-100' : 'opacity-0'
              )}
              style={{ transform: 'scale(1.12)' }}
            />

            {/* Animation video replaces poster on phone */}
            <video
              ref={videoRef}
              src={VIDEO_SRC}
              poster={MOBILE_LAPTOP_SRC}
              autoPlay
              muted
              playsInline
              preload="auto"
              loop={false}
              onCanPlay={() => void tryAutoplay()}
              onPlaying={() => setVideoReady(true)}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onError={() => {
                setVideoFailed(true);
                revealCopy();
              }}
              className={cn(
                'absolute h-full w-full max-w-none object-contain object-[center_42%] mix-blend-screen transition-opacity duration-500',
                showVideo ? 'opacity-100' : 'pointer-events-none opacity-0'
              )}
              style={{ filter: 'contrast(140%) brightness(92%)', transform: 'scale(1.12)' }}
              aria-label="scenenode laptop animation"
            />

            <motion.div
              className="pointer-events-none absolute inset-x-[22%] top-[28%] h-[22%] rounded-md bg-white/[0.04] blur-2xl"
              initial={{ opacity: 0 }}
              animate={screenOpen ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              aria-hidden
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
          animate={screenOpen ? 'visible' : 'hidden'}
          custom={0}
        >
          Edit Seamlessly.
        </motion.h1>

        <motion.p
          className="mt-3 text-[15px] leading-relaxed text-zinc-400"
          variants={popUp}
          initial="hidden"
          animate={screenOpen ? 'visible' : 'hidden'}
          custom={0.12}
        >
          Get a step-by-step breakdown, beat maps, and transition guides to recreate the exact
          edit by pasting the link of an edit.
        </motion.p>

        <motion.div
          className="mt-6"
          variants={popUp}
          initial="hidden"
          animate={screenOpen ? 'visible' : 'hidden'}
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
