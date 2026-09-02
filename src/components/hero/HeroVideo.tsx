'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent, type MotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';

const VIDEO_SRC = '/videos/laptop-animation.mp4?v=4k';

/** Extra scale on top of the baked-in MP4 zoom (1 → ~1.38). */
function zoomScale(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  // Slow ease-in toward screen fill
  const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  return 1 + eased * 0.38;
}

interface HeroVideoProps {
  className?: string;
  faded?: boolean;
  onEnded?: () => void;
  /** Fires once when animation reaches the “inside the screen” phase. */
  onLaptopOpen?: () => void;
  /** Normalized playback progress 0–1 for hero text fade / scroll sync. */
  onProgress?: (progress: number) => void;
  /** Optional scroll progress (0–1) to scrub the zoom when the hero is pinned. */
  scrollProgress?: MotionValue<number>;
}

export function HeroVideo({
  className,
  faded = false,
  onEnded,
  onLaptopOpen,
  onProgress,
  scrollProgress,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const laptopOpenFired = useRef(false);
  const endedFired = useRef(false);
  const startedRef = useRef(false);
  const scrubbingRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState(0);
  const disabledScroll = useMotionValue(-1);
  const scrubSource = scrollProgress ?? disabledScroll;

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

  const applyProgress = useCallback(
    (p: number) => {
      const clamped = Math.min(1, Math.max(0, p));
      setProgress(clamped);
      onProgress?.(clamped);
      if (clamped >= 0.62) fireLaptopOpen();
    },
    [fireLaptopOpen, onProgress]
  );

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    if (scrubbingRef.current) return;

    const p = video.currentTime / video.duration;
    applyProgress(p);

    if (video.currentTime >= video.duration - 0.08) {
      fireLaptopOpen();
    }
  }, [applyProgress, fireLaptopOpen]);

  const handleEnded = useCallback(() => {
    if (endedFired.current) return;
    endedFired.current = true;
    setProgress(1);
    onProgress?.(1);
    freezeLastFrame();
    fireLaptopOpen();
    onEnded?.();
  }, [fireLaptopOpen, freezeLastFrame, onEnded, onProgress]);

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

  useMotionValueEvent(scrubSource, 'change', (v) => {
    if (!scrollProgress || v < 0.04) {
      scrubbingRef.current = false;
      return;
    }

    const video = videoRef.current;
    if (!video?.duration) return;

    scrubbingRef.current = true;
    video.pause();

    const target = Math.min(video.duration - 0.05, v * video.duration);
    if (Math.abs(video.currentTime - target) > 0.02) {
      video.currentTime = target;
    }
    applyProgress(target / video.duration);
  });

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

  const scale = zoomScale(progress);

  return (
    <motion.div
      ref={containerRef}
      animate={{ opacity: faded ? 0.22 : 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'laptop-canvas-container pointer-events-none absolute inset-0 hidden overflow-hidden md:block',
        'hero-video-stage',
        className
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {!ready && !error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border border-[#E2E8F0]/25 border-t-[#E2E8F0]" />
          </div>
        )}

        {!error && (
          <div
            className="relative flex h-[min(82vh,900px)] w-full max-w-[min(90vw,1200px)] items-center justify-center will-change-transform"
            style={{
              transform: `translate3d(0, ${progress * -2}%, 0) scale(${scale})`,
              transition: 'transform 80ms linear',
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

        {/* Bottom vignette — blends into page */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-t from-black via-black/50 to-transparent"
          aria-hidden
        />
      </div>
    </motion.div>
  );
}
