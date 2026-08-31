'use client';

import Image from 'next/image';
import { SunburstIcon } from '@/components/brand/SunburstIcon';

const PANELS = [
  {
    id: 'workflow',
    src: '/images/velop/yellow-bg.png',
    alt: 'SceneCraft Hero',
    bg: 'bg-[#FEF9C3]',
    height: 'h-[calc(100vh-4rem)]',
    priority: true,
  },
  {
    id: 'features',
    src: '/images/velop/pink-bg.png',
    alt: 'Features',
    bg: 'bg-[#FCE7F3]',
    height: 'h-screen',
    priority: false,
  },
  {
    id: 'nles',
    src: '/images/velop/blue-bg.png',
    alt: 'Supported NLEs',
    bg: 'bg-[#E0F2FE]',
    height: 'h-screen',
    priority: false,
  },
] as const;

interface SceneCraftVerticalStackProps {
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

export function SceneCraftVerticalStack({
  onSignIn,
  onGetStarted,
}: SceneCraftVerticalStackProps) {
  const start = onGetStarted ?? onSignIn;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 shadow-sm backdrop-blur-md md:px-8">
        <a href="#workflow" className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-terracotta shadow-sm">
            <SunburstIcon className="h-4 w-4 text-white" />
          </span>
          <span className="text-xl font-bold tracking-tight text-slate-900">SceneCraft</span>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#features" className="transition-colors hover:text-slate-900">
            Features
          </a>
          <a href="#workflow" className="transition-colors hover:text-slate-900">
            Workflow
          </a>
          <a href="#nles" className="transition-colors hover:text-slate-900">
            Integrations
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onSignIn}
            className="text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={start}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800"
          >
            Get Started
          </button>
        </div>
      </header>

      {PANELS.map((panel) => (
        <section
          key={panel.id}
          id={panel.id}
          className={`relative w-full overflow-hidden ${panel.height} ${panel.bg}`}
        >
          <Image
            src={panel.src}
            alt={panel.alt}
            fill
            priority={panel.priority}
            sizes="100vw"
            className="object-fill"
          />
        </section>
      ))}
    </div>
  );
}
