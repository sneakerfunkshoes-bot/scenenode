'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Image from 'next/image';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import type { ShowcaseTheme } from './SceneCraftShowcase';

const SPRING = { stiffness: 90, damping: 22 } as const;

export const REVEAL_THEMES: readonly ShowcaseTheme[] = [
  {
    bgColor: '#0A0A0C',
    textColor: '#FAF8F5',
    accentColor: '#D96B43',
    badge: 'SceneCraft Hero',
  },
  {
    bgColor: '#0A0A0C',
    textColor: '#FAF8F5',
    accentColor: '#D96B43',
    badge: 'Features',
  },
  {
    bgColor: '#0A0A0C',
    textColor: '#FAF8F5',
    accentColor: '#0284C7',
    badge: 'Supported NLEs',
  },
] as const;

interface SceneCraftVerticalRevealProps {
  children?: ReactNode;
  onThemeChange?: (theme: ShowcaseTheme) => void;
  onShowcaseActiveChange?: (active: boolean) => void;
}

export function SceneCraftVerticalReveal({
  children,
  onThemeChange,
  onShowcaseActiveChange,
}: SceneCraftVerticalRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const progress = useSpring(scrollYProgress, SPRING);

  const yellowY = useTransform(progress, [0.1, 0.4], ['0%', '-100%']);
  const pinkY = useTransform(progress, [0.5, 0.8], ['0%', '-100%']);

  useEffect(() => {
    const unsub = progress.on('change', (value) => {
      const theme =
        value < 0.4
          ? REVEAL_THEMES[0]
          : value < 0.8
            ? REVEAL_THEMES[1]
            : REVEAL_THEMES[2];
      onThemeChange?.(theme);
      onShowcaseActiveChange?.(value < 0.98);
    });
    onThemeChange?.(REVEAL_THEMES[0]);
    onShowcaseActiveChange?.(true);
    return unsub;
  }, [progress, onThemeChange, onShowcaseActiveChange]);

  return (
    <div ref={containerRef} className="relative h-[300vh] w-full bg-black">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <motion.div
          style={{ y: yellowY, willChange: 'transform' }}
          className="absolute inset-0 z-30 h-full w-full"
        >
          <Image
            src="/images/velop/yellow-bg.png"
            alt="SceneCraft Hero"
            fill
            priority
            sizes="100vw"
            className="h-full w-full object-cover"
          />
        </motion.div>

        <motion.div
          style={{ y: pinkY, willChange: 'transform' }}
          className="absolute inset-0 z-20 h-full w-full"
        >
          <Image
            src="/images/velop/pink-bg.png"
            alt="Features"
            fill
            priority
            sizes="100vw"
            className="h-full w-full object-cover"
          />
        </motion.div>

        <div className="absolute inset-0 z-10 h-full w-full">
          <Image
            src="/images/velop/blue-bg.png"
            alt="Supported NLEs"
            fill
            priority
            sizes="100vw"
            className="h-full w-full object-cover"
          />
        </div>

        {children ? (
          <div className="absolute right-6 top-24 z-40 md:right-12">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
