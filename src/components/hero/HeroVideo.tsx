'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const VIDEO_SRC = '/videos/laptop-animation.mp4?v=4k';

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
  const laptopOpenFired = useRef(false);
  const endedFired = useRef(false);
  const startedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  const fireLaptopOpen = useCallback(() => {
    if (laptopOpenFired.current) return;
    laptopOpenFired.current = true;
    onLaptopOpen?.();
  }, [onLaptopOpen]);

  const freezeLastFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.loop = false;
    video.pause();
    if (Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = Math.max(0, video.duration - 0.05);
    }
  }, []);

  const tryPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || startedRef.current) return;
    video.loop = false;
    try {
      startedRef.current = true;
      await video.play();
    } catch {
      startedRef.current = false;
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    if (video.currentTime >= video.duration - 0.08) {
      fireLaptopOpen();
    }
  }, [fireLaptopOpen]);

  const handleEnded = useCallback(() => {
    freezeLastFrame();
    fireLaptopOpen();
    if (endedFired.current) return;
    endedFired.current = true;
    onEnded?.();
  }, [fireLaptopOpen, freezeLastFrame, onEnded]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.loop = false;

    const onCanPlay = () => {
      setReady(true);
      void tryPlay();
    };

    const onVideoError = () => {
      setError(true);
      fireLaptopOpen();
    };

    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onVideoError);

    if (video.readyState >= 3) onCanPlay();

    return () => {
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('error', onVideoError);
    };
  }, [tryPlay, fireLaptopOpen]);

  return (
    <motion.div
      animate={{ opacity: faded ? 0.22 : 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'laptop-canvas-container pointer-events-none absolute inset-0 hidden items-center justify-center overflow-hidden md:flex',
        className
      )}
    >
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border border-[#E2E8F0]/25 border-t-[#E2E8F0]" />
        </div>
      )}

      {!error && (
        <div
          className="relative flex h-[75vh] w-full max-w-5xl items-center justify-center"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 98%)',
            maskImage: 'linear-gradient(to bottom, black 70%, transparent 98%)',
          }}
        >
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            autoPlay
            muted
            playsInline
            preload="auto"
            loop={false}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            className="laptop-video h-full w-full object-contain mix-blend-screen"
            style={{ filter: 'contrast(140%) brightness(92%)' }}
            aria-label="scenenode laptop animation"
          />
        </div>
      )}
    </motion.div>
  );
}
