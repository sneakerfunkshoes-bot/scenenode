'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const VIDEO_SRC = '/videos/laptop-animation.mp4?v=4k';
const MOBILE_QUERY = '(max-width: 767px)';

interface HeroVideoProps {
  className?: string;
  faded?: boolean;
  onEnded?: () => void;
  onLaptopOpen?: () => void;
}

export function HeroVideo({
  className,
  faded = false,
  onEnded,
  onLaptopOpen,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const laptopOpenFired = useRef(false);
  const endedFired = useRef(false);
  const startedRef = useRef(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  const fireLaptopOpen = useCallback(() => {
    if (laptopOpenFired.current) return;
    laptopOpenFired.current = true;
    onLaptopOpen?.();
  }, [onLaptopOpen]);

  const freezeLastFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || isMobileViewport) return;
    video.loop = false;
    video.pause();
    if (Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = Math.max(0, video.duration - 0.05);
    }
  }, [isMobileViewport]);

  const tryPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    if (!isMobileViewport && startedRef.current) return;
    video.loop = isMobileViewport;
    try {
      startedRef.current = true;
      await video.play();
    } catch {
      startedRef.current = false;
    }
    if (isMobileViewport) fireLaptopOpen();
  }, [fireLaptopOpen, isMobileViewport]);

  const handleTimeUpdate = useCallback(() => {
    if (isMobileViewport) return;
    const video = videoRef.current;
    if (!video || !video.duration) return;
    if (video.currentTime >= video.duration - 0.08) {
      fireLaptopOpen();
    }
  }, [fireLaptopOpen, isMobileViewport]);

  const handleEnded = useCallback(() => {
    if (isMobileViewport) return;
    freezeLastFrame();
    fireLaptopOpen();
    if (endedFired.current) return;
    endedFired.current = true;
    onEnded?.();
  }, [fireLaptopOpen, freezeLastFrame, isMobileViewport, onEnded]);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const apply = () => {
      const mobile = mq.matches;
      setIsMobileViewport(mobile);
      const video = videoRef.current;
      if (video) video.loop = mobile;
      if (mobile) fireLaptopOpen();
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [fireLaptopOpen]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onCanPlay = () => {
      setReady(true);
      void tryPlay();
    };

    const onError = () => {
      setError(true);
      fireLaptopOpen();
    };

    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onError);

    if (video.readyState >= 3) onCanPlay();

    return () => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onError);
    };
  }, [tryPlay, fireLaptopOpen, isMobileViewport]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible) {
          startedRef.current = false;
          void tryPlay();
        } else if (isMobileViewport) {
          const video = videoRef.current;
          if (video) {
            video.pause();
            startedRef.current = false;
          }
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [isMobileViewport, tryPlay]);

  return (
    <motion.div
      ref={containerRef}
      animate={{ opacity: faded ? 0.22 : 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'laptop-canvas-container pointer-events-none absolute inset-x-0 flex items-center justify-center overflow-hidden bg-black',
        'top-14 h-[min(46vh,400px)] md:inset-0 md:top-0 md:h-auto md:bg-transparent',
        className
      )}
    >
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border border-[#E2E8F0]/25 border-t-[#E2E8F0]" />
        </div>
      )}

      {!error && (
        <>
          <div
            className={cn(
              'relative flex w-full items-center justify-center',
              'h-full max-w-[min(100%,340px)] px-2',
              'md:h-[75vh] md:max-w-5xl md:px-0'
            )}
            style={{
              WebkitMaskImage:
                'linear-gradient(to bottom, black 0%, black 52%, rgba(0,0,0,0.55) 78%, transparent 100%)',
              maskImage:
                'linear-gradient(to bottom, black 0%, black 52%, rgba(0,0,0,0.55) 78%, transparent 100%)',
            }}
          >
            <video
              ref={videoRef}
              src={VIDEO_SRC}
              autoPlay
              muted
              playsInline
              preload="auto"
              loop
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              className="laptop-video h-full w-full object-contain mix-blend-screen md:mix-blend-screen"
              style={{ filter: 'contrast(140%) brightness(92%)' }}
              aria-label="scenenode laptop animation"
            />
          </div>

          {/* Feather video floor into page background on mobile */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-b from-transparent via-black/70 to-black md:hidden"
            aria-hidden
          />
        </>
      )}
    </motion.div>
  );
}
