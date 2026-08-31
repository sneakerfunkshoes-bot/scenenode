'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Cpu,
  Layers,
  Play,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import { isSupportedVideoUrl } from '@/lib/video-url';
import { cn } from '@/lib/utils';

const SKY = '#DDF0FF';
const INK = '#0C4A6E';
const SKY_ACCENT = '#70C5FF';

function VectorDoodleBackdrop() {
  return (
    <svg
      viewBox="0 0 500 500"
      className="pointer-events-none absolute -z-10 left-1/2 top-1/2 h-[135%] w-[135%] -translate-x-1/2 -translate-y-1/2"
      aria-hidden
    >
      <path
        d="M250,70 C340,60 430,130 420,230 C410,330 350,420 240,410 C130,400 70,310 80,210 C90,110 160,80 250,70 Z"
        fill={SKY_ACCENT}
        opacity="0.85"
      />
      <g
        stroke={INK}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M400,100 C430,70 450,110 430,140 C410,170 380,140 400,100 Z"
          fill="#FFFFFF"
        />
        <path d="M420,110 L410,130" />
        <path d="M410,250 C460,230 480,280 440,320 C400,360 380,310 410,250 Z" />
        <path
          d="M70,320 C40,350 20,310 40,280 C60,250 90,290 70,320 Z"
          fill="#FFFFFF"
        />
        <path d="M220,50 C250,30 280,30 310,50" />
        <path d="M230,40 C250,25 270,25 290,40" />
        <path d="M240,30 C250,20 260,20 270,30" />
        <path d="M90,120 C110,100 100,80 120,70" />
        <path d="M100,380 C130,400 160,390 180,420" />
      </g>
    </svg>
  );
}

function CloudDivider({ fill = '#FFFFFF' }: { fill?: string }) {
  return (
    <div className="relative z-10 w-full overflow-hidden leading-none">
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="relative block h-10 w-full md:h-14"
        aria-hidden
      >
        <path
          d="M0,0 C150,90 350,-40 500,60 C650,160 900,-20 1200,40 L1200,120 L0,120 Z"
          fill={SKY_ACCENT}
          opacity="0.4"
        />
        <path
          d="M0,20 C200,95 450,10 680,60 C850,100 1050,25 1200,50 L1200,120 L0,120 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}

interface SceneCraftLandingProps {
  onSignIn?: (pendingUrl?: string) => void;
  onGetStarted?: (pendingUrl?: string) => void;
}

export function SceneCraftLanding({ onSignIn, onGetStarted }: SceneCraftLandingProps) {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const start = onGetStarted ?? onSignIn;

  // Mouse parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 20 });
  const laptopX = useTransform(smoothX, [-1, 1], [-18, 18]);
  const laptopY = useTransform(smoothY, [-1, 1], [-12, 12]);
  const orb1X = useTransform(smoothX, [-1, 1], [-30, 30]);
  const orb1Y = useTransform(smoothY, [-1, 1], [-20, 20]);
  const orb2X = useTransform(smoothX, [-1, 1], [20, -20]);
  const orb2Y = useTransform(smoothY, [-1, 1], [15, -15]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const onMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      mouseX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
      mouseY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    hero.addEventListener('mousemove', onMove);
    return () => hero.removeEventListener('mousemove', onMove);
  }, [mouseX, mouseY]);

  const handleInspect = () => {
    const trimmed = videoUrl.trim();
    if (!trimmed) {
      setUrlError('Paste a link first.');
      return;
    }
    if (!isSupportedVideoUrl(trimmed)) {
      setUrlError('Use a TikTok, Instagram Reels, or YouTube Shorts URL.');
      return;
    }
    setUrlError(null);
    router.push(`/inspect?url=${encodeURIComponent(trimmed)}`);
  };

  const BADGES = [
    { icon: Zap, label: '128 BPM Detected', delay: 0.8, x: '-10%', y: '15%' },
    { icon: Sparkles, label: '12 Micro-Edits Mapped', delay: 1.0, x: '82%', y: '8%' },
    { icon: Play, label: 'CapCut Ready', delay: 1.2, x: '75%', y: '78%' },
  ];

  return (
    <div
      className="font-sans text-[#0C4A6E] selection:bg-[#70C5FF] selection:text-[#0C4A6E]"
    >
      <div className="bg-[#DDF0FF]">
      {/* ── NAV ── */}
      <nav className="relative z-20 mx-auto flex max-w-[90rem] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.img
              src="/logo.png"
              alt="SceneCraft logo"
              className="h-10 w-10 rounded-full border border-sky-200 object-cover shadow-sm"
              whileHover={{ scale: 1.12, rotate: 8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            />
            <span className="text-2xl font-extrabold tracking-tight group-hover:text-[#0284C7] transition-colors">
              SceneCraft
            </span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="hidden items-center gap-8 text-sm font-bold md:flex"
        >
          {['Features', 'NLE Stack', 'IDE Workspace', 'Inspect'].map((label, i) => (
            <motion.a
              key={label}
              href={label === 'Inspect' ? '/inspect' : `#${label.toLowerCase().replace(' ', '')}`}
              className="relative transition hover:text-[#0284C7]"
              whileHover={{ y: -2 }}
            >
              {label}
            </motion.a>
          ))}
        </motion.div>

        {onSignIn ? (
          <motion.button
            type="button"
            onClick={() => onSignIn(videoUrl.trim())}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="rounded-full border border-sky-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-sky-400 hover:text-[#0284C7]"
          >
            Sign In
          </motion.button>
        ) : null}
      </nav>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-[90rem] items-center gap-6 overflow-hidden px-4 pb-8 pt-1 sm:px-6 lg:gap-10 lg:px-8 md:grid-cols-12"
      >
        {/* Animated background orbs */}
        <motion.div
          style={{ x: orb1X, y: orb1Y }}
          className="pointer-events-none absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-[#70C5FF] opacity-30 blur-[80px]"
        />
        <motion.div
          style={{ x: orb2X, y: orb2Y }}
          className="pointer-events-none absolute -right-20 bottom-10 h-[400px] w-[400px] rounded-full bg-[#38BDF8] opacity-20 blur-[90px]"
        />
        {/* Pulsing ring */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.08, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0284C7]"
        />

        {/* ── LEFT: Headline + CTA ── */}
        <div className="relative z-10 space-y-5 text-left md:col-span-6">
          {/* Eyebrow pill */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#7DD3FC] bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#0284C7] shadow-sm backdrop-blur-sm"
          >
            <motion.span
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-[#0284C7]"
            />
            AI-Powered Edit Breakdown
          </motion.div>

          {/* Headline — word by word */}
          <div className="text-4xl font-black leading-[1.05] tracking-tight text-[#0C4A6E] md:text-[3.75rem]">
            {['Deconstruct the edit.', 'Rebuild it beautifully.'].map((line, li) => (
              <div key={li} className="overflow-hidden">
                <motion.div
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.15 + li * 0.15, ease: [0.22, 1, 0.36, 1] }}
                >
                  {li === 1 ? (
                    <span>
                      Rebuild it{' '}
                      <span className="relative inline-block text-[#0284C7]">
                        beautifully.
                        <motion.span
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.6, delay: 0.7 }}
                          className="absolute -bottom-1 left-0 h-[3px] w-full origin-left rounded-full bg-[#38BDF8]"
                        />
                      </span>
                    </span>
                  ) : (
                    line
                  )}
                </motion.div>
              </div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="max-w-lg text-base font-medium leading-relaxed text-slate-600 md:text-lg"
          >
            SceneCraft watches a TikTok, Reel, or Shorts link and returns a cinematic
            breakdown — song info, BPM, visual SFX, transitions, flashes, and color notes
            — inside an IDE-grade workspace.
          </motion.p>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex gap-6 text-sm font-bold text-[#0C4A6E]"
          >
            {[['10k+', 'Edits Inspected'], ['99ms', 'Avg. BPM Lock'], ['5 NLEs', 'Supported']].map(([val, label]) => (
              <div key={label} className="flex flex-col">
                <span className="text-xl font-black text-[#0284C7]">{val}</span>
                <span className="text-xs font-semibold text-slate-500">{label}</span>
              </div>
            ))}
          </motion.div>

          {/* URL input */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="max-w-md"
          >
            <motion.div
              animate={inputFocused
                ? { boxShadow: '0 0 0 3px rgba(2,132,199,0.25), 4px 4px 0px 0px #38BDF8' }
                : { boxShadow: '4px 4px 0px 0px #38BDF8' }
              }
              className="flex items-center gap-2 rounded-full border-2 border-[#7DD3FC] bg-white p-1.5 pl-2 transition-all"
            >
              <input
                type="url"
                placeholder="Paste TikTok, Reel or Shorts link…"
                value={videoUrl}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  if (urlError) setUrlError(null);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleInspect(); }}
                className={cn(
                  'min-w-0 flex-1 bg-transparent py-2.5 text-sm font-medium text-sky-950 outline-none transition-all',
                  'placeholder:text-center placeholder:text-[13px] placeholder:font-normal placeholder:tracking-normal placeholder:text-sky-400',
                  videoUrl ? 'pl-3 pr-2 text-left' : 'pl-6 pr-4 text-center'
                )}
              />
              <motion.button
                type="button"
                onClick={handleInspect}
                whileHover={{ scale: 1.05, backgroundColor: '#0369A1' }}
                whileTap={{ scale: 0.95 }}
                className="flex shrink-0 items-center gap-2 rounded-full bg-[#0284C7] px-5 py-2.5 text-sm font-bold text-white"
              >
                Inspect <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
            {urlError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 px-2 text-xs font-semibold text-red-600"
              >
                {urlError}
              </motion.p>
            )}
          </motion.div>
        </div>

        {/* ── RIGHT: Laptop with parallax + floating badges ── */}
        <div className="relative flex w-full items-center justify-center md:col-span-6 md:-mr-4 lg:-mr-8">
          {/* Floating badges */}
          {BADGES.map(({ icon: Icon, label, delay, x, y }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay }}
              style={{ position: 'absolute', left: x, top: y }}
              className="z-20 flex items-center gap-2 rounded-full border border-[#7DD3FC] bg-white/90 px-3 py-1.5 text-xs font-bold text-[#0284C7] shadow-lg backdrop-blur-sm"
            >
              <motion.div
                animate={{ rotate: [0, 15, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: delay * 0.5 }}
              >
                <Icon className="h-3.5 w-3.5" />
              </motion.div>
              {label}
            </motion.div>
          ))}

          {/* Laptop image with parallax */}
          <motion.div
            style={{ x: laptopX, y: laptopY }}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-2xl lg:max-w-none lg:scale-105"
          >
            {/* Glow behind laptop */}
            <VectorDoodleBackdrop />
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-8 rounded-full bg-[#38BDF8] blur-3xl"
            />
            <img
              src="/images/hero-laptop.png"
              alt="SceneCraft laptop mockup"
              className="relative w-full object-contain"
              draggable={false}
              style={{ mixBlendMode: 'multiply' }}
            />
          </motion.div>
        </div>
      </section>
      </div>

      <CloudDivider fill="#FFFFFF" />

      <section id="features" className="scroll-mt-20 bg-white py-24 text-[#0284C7]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
            <span className="rounded-full bg-[#DDF0FF] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0284C7]">
              Core Capabilities
            </span>
            <h2 className="text-4xl font-black tracking-tight md:text-5xl">
              Break Down Any Video Edit into Exact Recreatable Steps.
            </h2>
            <p className="text-base font-medium text-zinc-600">
              AI visual inspection engine built for CapCut, DaVinci Resolve, Premiere Pro,
              and After Effects editors.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Play,
                title: 'Beat-true timelines',
                body: 'Auto-detect BPM, drops, and cut points so every flash, zoom, and text pop lands seamlessly on the music.',
              },
              {
                icon: Layers,
                title: 'NLE-ready guides',
                body: 'DaVinci, Premiere, After Effects, CapCut, and VN — step-by-step recreation maps tailored to your edit stack.',
              },
              {
                icon: Cpu,
                title: 'Edit Assistant AI',
                body: 'Ask how to recreate any marker or effect. Get exact keyframe values, native plugin names, and frame settings back instantly.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="space-y-4 rounded-3xl border-2 border-[#0284C7] bg-[#DDF0FF]/60 p-8 text-left shadow-[6px_6px_0px_0px_#0284C7]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0284C7] font-bold text-white">
                  <feature.icon className="h-6 w-6 fill-current" />
                </div>
                <h3 className="text-2xl font-black">{feature.title}</h3>
                <p className="text-sm font-medium leading-relaxed opacity-80">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="rotate-180 bg-white">
        <CloudDivider fill={SKY} />
      </div>

      <section id="nle" className="scroll-mt-20 bg-[#DDF0FF] py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <span className="rounded-full border-2 border-[#0284C7] bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
            NLE Stack
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
            Export-ready for your editor of choice
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              'DaVinci Resolve',
              'Premiere Pro',
              'After Effects',
              'CapCut',
              'VN Editor',
            ].map((nle) => (
              <span
                key={nle}
                className="rounded-full border-2 border-[#0284C7] bg-white px-5 py-2 text-sm font-bold shadow-[3px_3px_0px_0px_#0284C7]"
              >
                {nle}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="workspace" className="scroll-mt-20 bg-[#DDF0FF] pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-3xl border-2 border-[#0284C7] bg-white p-8 shadow-[8px_8px_0px_0px_#0284C7] md:p-12">
            <div className="grid items-center gap-10 md:grid-cols-2">
              <div className="space-y-4 text-left">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#DDF0FF] px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  <Terminal className="h-3.5 w-3.5" />
                  IDE Workspace
                </span>
                <h2 className="text-3xl font-black tracking-tight md:text-4xl">
                  Inspect in public. Finish in Studio.
                </h2>
                <p className="text-sm font-medium leading-relaxed text-zinc-600">
                  Paste a link on the landing page for the aha moment, then open the full
                  breakdown workspace with beat graphs, export presets, and Edit Assistant AI.
                </p>
                <button
                  type="button"
                  onClick={() => start?.(videoUrl.trim())}
                  className="rounded-full bg-[#0284C7] px-8 py-3 text-sm font-bold text-white shadow-md transition"
                >
                  Open Studio
                </button>
              </div>
              <div className="rounded-2xl border-2 border-[#7DD3FC] bg-[#F0F9FF] p-5 font-mono text-xs text-[#0C4A6E]">
                <p className="text-[#0284C7]">$ scenecraft inspect --url reel.mp4</p>
                <p className="mt-2 text-sky-600">✓ BPM detected: 128</p>
                <p className="text-sky-600">✓ 12 micro-edits mapped</p>
                <p className="text-sky-600">✓ DaVinci XML export ready</p>
                <p className="mt-3 text-sky-500">→ Open in Studio for full timeline</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6 px-6 py-20 text-center">
        <h2 className="mx-auto max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
          Ready to Deconstruct Your Next Viral Edit?
        </h2>
        <p className="mx-auto max-w-xl text-lg font-medium opacity-80">
          Paste any reel URL and get an instant timeline breakdown mapped for DaVinci,
          Premiere, and CapCut.
        </p>
        {onSignIn ? (
          <button
            type="button"
            onClick={() => onSignIn(videoUrl.trim())}
            className="rounded-full border border-sky-200 bg-white px-10 py-4 text-lg font-extrabold text-slate-700 shadow-lg transition hover:border-sky-400 hover:text-[#0284C7] active:scale-95"
          >
            Sign In
          </button>
        ) : null}
      </section>

      <footer className="border-t-2 border-[#0284C7]/10 bg-[#DDF0FF] px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm font-semibold text-[#0284C7]/70 md:flex-row">
          <span>© {new Date().getFullYear()} SceneCraft</span>
          <div className="flex gap-6">
            <Link href="/inspect" className="hover:text-[#0284C7]">
              Inspect
            </Link>
            <button type="button" onClick={() => onSignIn?.(videoUrl.trim())} className="hover:text-[#0284C7]">
              Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
