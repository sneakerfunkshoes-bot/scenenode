'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Image from 'next/image';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';

const SPRING = { stiffness: 80, damping: 20 } as const;

export type ShowcaseLayerId = 'yellow' | 'pink' | 'blue';

export interface ShowcaseLayer {
  id: ShowcaseLayerId;
  src: string;
  alt: string;
  fallback: string;
}

export interface ShowcaseTheme {
  bgColor: string;
  textColor: string;
  accentColor: string;
  badge: string;
}

/** Exact local assets copied from the Velop root into /public/images */
export const SHOWCASE_LAYERS: readonly ShowcaseLayer[] = [
  {
    id: 'yellow',
    src: '/images/yellow-bg.png',
    alt: 'SceneCraft hero — yellow citrus poster',
    fallback: '#F6E7A8',
  },
  {
    id: 'pink',
    src: '/images/pink-bg.png',
    alt: 'SceneCraft features — pink banner',
    fallback: '#F4CDE0',
  },
  {
    id: 'blue',
    src: '/images/blue-bg.png',
    alt: 'Deconstruct the Edit — blue banner',
    fallback: '#CDE8FA',
  },
] as const;

export const SHOWCASE_THEMES: readonly ShowcaseTheme[] = [
  {
    bgColor: '#F6E7A8',
    textColor: '#2A2421',
    accentColor: '#D96B43',
    badge: 'SceneCraft Hero',
  },
  {
    bgColor: '#F4CDE0',
    textColor: '#3B1F2B',
    accentColor: '#D96B43',
    badge: 'Features',
  },
  {
    bgColor: '#CDE8FA',
    textColor: '#0F172A',
    accentColor: '#0284C7',
    badge: 'Deconstruct the Edit',
  },
] as const;

export const SCROLL_SHOWCASE_THEMES = SHOWCASE_THEMES;
export type ScrollShowcaseTheme = ShowcaseTheme;

interface SceneCraftShowcaseProps {
  children?: ReactNode;
  onThemeChange?: (theme: ShowcaseTheme) => void;
  onShowcaseActiveChange?: (active: boolean) => void;
}

export function SceneCraftShowcase({
  children,
  onThemeChange,
  onShowcaseActiveChange,
}: SceneCraftShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const progress = useSpring(scrollYProgress, SPRING);

  const yellowOpacity = useTransform(progress, [0, 0.25, 0.35], [1, 1, 0]);
  const yellowScale = useTransform(progress, [0, 0.35], [1, 1.05]);

  const pinkOpacity = useTransform(progress, [0.3, 0.4, 0.55, 0.65], [0, 1, 1, 0]);
  const pinkScale = useTransform(progress, [0.3, 0.65], [1, 1.05]);

  const blueOpacity = useTransform(progress, [0.6, 0.7, 1], [0, 1, 1]);
  const blueScale = useTransform(progress, [0.6, 1], [1, 1.05]);

  const layers: {
    layer: ShowcaseLayer;
    opacity: MotionValue<number>;
    scale: MotionValue<number>;
    priority: boolean;
  }[] = [
    { layer: SHOWCASE_LAYERS[0], opacity: yellowOpacity, scale: yellowScale, priority: true },
    { layer: SHOWCASE_LAYERS[1], opacity: pinkOpacity, scale: pinkScale, priority: false },
    { layer: SHOWCASE_LAYERS[2], opacity: blueOpacity, scale: blueScale, priority: false },
  ];

  useEffect(() => {
    const unsub = progress.on('change', (value) => {
      const theme =
        value < 0.33
          ? SHOWCASE_THEMES[0]
          : value < 0.66
            ? SHOWCASE_THEMES[1]
            : SHOWCASE_THEMES[2];
      onThemeChange?.(theme);
      onShowcaseActiveChange?.(value < 0.98);
    });
    onThemeChange?.(SHOWCASE_THEMES[0]);
    onShowcaseActiveChange?.(true);
    return unsub;
  }, [progress, onThemeChange, onShowcaseActiveChange]);

  return (
    <section
      ref={containerRef}
      id="overview"
      className="relative h-[300vh] w-full"
      aria-label="SceneCraft sticky scroll showcase"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {layers.map(({ layer, opacity, scale, priority }) => (
          <motion.div
            key={layer.id}
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{
              opacity,
              willChange: 'opacity, transform',
              backgroundColor: layer.fallback,
            }}
          >
            <motion.div className="absolute inset-0" style={{ scale, willChange: 'transform' }}>
              <Image
                src={layer.src}
                alt={layer.alt}
                fill
                priority={priority}
                sizes="100vw"
                style={{ objectFit: 'cover' }}
                className="h-full w-full"
              />
            </motion.div>
          </motion.div>
        ))}

        {children ? (
          <div className="absolute right-6 top-24 z-20 md:right-12">{children}</div>
        ) : null}
      </div>
    </section>
  );
}
