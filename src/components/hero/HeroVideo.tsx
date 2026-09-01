'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const VIDEO_SRC = '/videos/laptop-animation.mp4?v=4k';
const MOBILE_LAPTOP_SRC = '/images/hero-laptop-mobile.jpg';

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
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [mobileImageReady, setMobileImageReady] = useState(false);

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
    if (!video || startedRef.current || endedFired.current) return;

    video.loop = false;
    try {
      startedRef.current = true;
      await video.play();
    } catch {
      startedRef.current = false;
      fireLaptopOpen();
    }
  }, [fireLaptopOpen]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    if (video.currentTime >= video.duration - 0.08) {
      fireLaptopOpen();
    }
  }, [fireLaptopOpen]);

  const handleEnded = useCallback(() => {
    if (endedFired.current) return;
    endedFired.current = true;
    freezeLastFrame();
    fireLaptopOpen();
    onEnded?.();
  }, [fireLaptopOpen, freezeLastFrame, onEnded]);

  useEffect(() => {
    fireLaptopOpen();
  }, [fireLaptopOpen]);

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible) {
          if (!endedFired.current) void tryPlay();
        } else {
          videoRef.current?.pause();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [tryPlay]);

  return (
    <motion.div
      ref={containerRef}
      animate={{ opacity: faded ? 0.22 : 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'laptop-canvas-container pointer-events-none absolute inset-x-0 flex items-center justify-center overflow-hidden',
        'top-14 h-[min(48vh,400px)] bg-black md:inset-0 md:top-0 md:h-auto md:bg-transparent',
        'hero-video-stage',
        className
      )}
    >
      {/* Mobile — static laptop image (no animation) */}
      <div className="relative flex h-full w-full items-center justify-center px-3 md:hidden">
        {!mobileImageReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border border-[#E2E8F0]/25 border-t-[#E2E8F0]" />
          </div>
        )}
        <Image
          src={MOBILE_LAPTOP_SRC}
          alt="SceneNode on MacBook Pro"
          width={900}
          height={600}
          priority
          onLoad={() => setMobileImageReady(true)}
          className={cn(
            'h-full w-full max-w-[min(100%,360px)] object-contain object-center transition-opacity duration-500',
            mobileImageReady ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>

      {/* Desktop — laptop open animation */}
      <div className="relative hidden h-full w-full items-center justify-center md:flex">
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border border-[#E2E8F0]/25 border-t-[#E2E8F0]" />
          </div>
        )}

        {!error && (
          <div
            className="relative flex h-[75vh] w-full max-w-5xl items-center justify-center"
            style={{
              WebkitMaskImage:
                'linear-gradient(to bottom, #0c0c0c 0%, #0c0c0c 58%, rgba(12,12,12,0.45) 82%, transparent 100%)',
              maskImage:
                'linear-gradient(to bottom, #0c0c0c 0%, #0c0c0c 58%, rgba(12,12,12,0.45) 82%, transparent 100%)',
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
      </div>
    </motion.div>
  );
}
