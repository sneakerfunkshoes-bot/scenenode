'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { GetStartedButton } from './GetStartedButton';

const MOBILE_LAPTOP_SRC = '/images/hero-laptop-mobile.jpg';
const VIDEO_SRC = '/videos/laptop-animation.mp4?v=4k';

interface MobileHeroProps {
  onGetStarted: () => void;
  entering?: boolean;
}

export function MobileHero({ onGetStarted, entering }: MobileHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [imageReady, setImageReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const tryAutoplay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || videoFailed) return;
    try {
      await video.play();
      setVideoReady(true);
    } catch {
      setVideoFailed(true);
    }
  }, [videoFailed]);

  useEffect(() => {
    void tryAutoplay();
  }, [tryAutoplay]);

  const showVideo = videoReady && !videoFailed;

  return (
    <section className="relative w-full overflow-hidden bg-black md:hidden">
      {/* Laptop visual — ~75–82% of hero height, edge-to-edge */}
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
          {!imageReady && !showVideo && (
            <div className="h-9 w-9 animate-spin rounded-full border border-white/20 border-t-white" />
          )}

          <video
            ref={videoRef}
            src={VIDEO_SRC}
            poster={MOBILE_LAPTOP_SRC}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onCanPlay={() => void tryAutoplay()}
            onPlaying={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
            className={cn(
              'absolute h-full w-full max-w-none object-contain object-[center_42%] transition-opacity duration-500',
              showVideo ? 'opacity-100' : 'pointer-events-none opacity-0'
            )}
            style={{ transform: 'scale(1.12)' }}
            aria-hidden={!showVideo}
          />

          <Image
            src={MOBILE_LAPTOP_SRC}
            alt="SceneNode on MacBook Pro"
            fill
            priority
            sizes="100vw"
            onLoad={() => setImageReady(true)}
            className={cn(
              'object-contain object-[center_42%] transition-opacity duration-500',
              showVideo ? 'opacity-0' : imageReady ? 'opacity-100' : 'opacity-0'
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

      {/* Copy below laptop */}
      <div
        className={cn(
          'relative z-10 px-5 pb-8 pt-2 transition duration-700',
          entering && 'scale-95 opacity-0'
        )}
      >
        <h1 className="text-[1.75rem] font-extrabold leading-[1.15] tracking-tight text-white">
          Edit Seamlessly.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">
          Get a step-by-step breakdown, beat maps, and transition guides to recreate the exact
          edit by pasting the link of an edit.
        </p>
        <div className="mt-6">
          <GetStartedButton
            onClick={onGetStarted}
            pressed={entering}
            className="w-full min-h-[52px] text-base"
          />
        </div>
      </div>
    </section>
  );
}
