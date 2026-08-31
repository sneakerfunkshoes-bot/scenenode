import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Wand2,
  Play,
  Sparkles,
  Check,
  Copy,
  Layers,
  Music2,
  Palette,
  Zap,
  ChevronDown,
  X,
  Menu,
  Clock,
  Upload,
  FileVideo,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";

/* ---------------------------------------------------------------
   DATA
--------------------------------------------------------------- */

const SOFTWARE = ["CapCut", "VN", "Premiere Pro", "After Effects", "DaVinci Resolve"];

const CUTS = [
  { t: "0:03", pct: 12, label: "Optical Zoom" },
  { t: "0:07", pct: 34, label: "Whip Pan" },
  { t: "0:12", pct: 58, label: "Match Cut" },
  { t: "0:16", pct: 79, label: "Shake FX" },
  { t: "0:21", pct: 93, label: "Light Leak" },
];

const PALETTE = [
  { hex: "#FF6B35", name: "Warm Highlight" },
  { hex: "#004E64", name: "Teal Shadow" },
  { hex: "#F4E04D", name: "Accent Pop" },
  { hex: "#1A1A2E", name: "Deep Crush" },
  { hex: "#E8DAB2", name: "Skin Tone" },
];

const FX_LIST = [
  "Optical Zoom Transition (in/out)",
  "Motion Blur Whip Pan",
  "Handheld Camera Shake",
  "Match Cut on the Beat",
  "Light Leak Overlay (screen blend)",
];

const STEPS = {
  CapCut: [
    "Import your clip, then split at 0:03, 0:07, 0:12, 0:16 and 0:21 to isolate each detected cut.",
    "On clip 1→2, add Transitions > Zoom > 'Optical Zoom', duration 0.2s.",
    "On clip 2→3, apply Speed Ramp: 100%→220%→100% to mimic the whip pan.",
    "Add the 'Camera Shake II' effect to clip 4, intensity 35, blend at the cut point only.",
    "Drop a Light Leak overlay clip on top of clip 5, set blend mode to Screen, opacity 60%.",
    "Import the detected track, snap it to clip 1, and nudge -2 frames so hits land on the cuts.",
  ],
  VN: [
    "Split your source clip at each detected timestamp: 0:03 / 0:07 / 0:12 / 0:16 / 0:21.",
    "Add 'Zoom In' transition between segment 1 and 2 from the Transitions panel.",
    "Use the Speed tool on segment 2 with a custom curve to fake a whip pan.",
    "Apply Shake preset (Medium) to segment 4, keyframe it to decay over 4 frames.",
    "Overlay a light-leak asset on segment 5 at Screen blend, 60% opacity.",
    "Import the audio track and align the waveform peaks to your cut markers.",
  ],
  "Premiere Pro": [
    "Add markers at 0:03, 0:07, 0:12, 0:16, 0:21 on the sequence (M key) to lock in the cuts.",
    "Apply the 'Zoom' video transition at cut 1, adjust duration to 6 frames in Effect Controls.",
    "Keyframe Scale 100→240→100 across cut 2 for the whip-pan blur (add Directional Blur too).",
    "Drop 'Camera Shake' preset onto clip 4, tune Angle/Position noise in Effect Controls.",
    "Add a light-leak adjustment layer over clip 5, set Blend Mode to Screen at 60%.",
    "Import the track to A1, use Sync Lock and snap hits to your sequence markers.",
  ],
  "After Effects": [
    "Bring the clip into a comp, add layer markers at 0:03/0:07/0:12/0:16/0:21.",
    "Precompose cut 1-2, add a Scale keyframe + Optical Flares zoom for the transition.",
    "On cut 2, apply CC Radial Blur set to Zoom, keyframed in/out across 6 frames.",
    "Parent a Camera Shake preset (or Wiggle expression on Position) to layer 4.",
    "New solid, Screen blend mode, light-leak footage on top of layer 5 at 60% opacity.",
    "Add the audio layer, enable waveform display, and snap keyframes to the beat grid.",
  ],
  "DaVinci Resolve": [
    "In the Edit page, add markers (M) at 0:03, 0:07, 0:12, 0:16 and 0:21.",
    "Drop the 'Zoom' transition from Effects Library onto the cut 1 edit point.",
    "Use Speed Change (Instant) on clip 2 for the whip-pan; pair with a slight Blur node in Color.",
    "Apply 'Shake' from OpenFX to clip 4, dial in Frequency and Magnitude to taste.",
    "Add a light-leak clip on V2 over clip 5, set Composite Mode to Screen, 60% opacity.",
    "Import the track to the timeline and use Audio Sync markers to align hits to cuts.",
  ],
};

const PRICING = [
  {
    name: "Starter",
    tagline: "Try it on your next post",
    monthlyUSD: 4.99,
    monthlyINR: 149,
    features: ["15 scans / month", "CapCut & VN guides only", "Community support"],
  },
  {
    name: "Creator Pro",
    tagline: "For creators posting weekly",
    monthlyUSD: 12.99,
    monthlyINR: 399,
    popular: true,
    features: ["150 scans / month", "All 5 software guides", "LUT downloads", "Priority support"],
  },
  {
    name: "Studio / Agency",
    tagline: "For teams shipping daily",
    monthlyUSD: 29.99,
    monthlyINR: 999,
    features: ["Unlimited scans", "Fast Turbo queue", "Project file exports", "Dedicated support"],
  },
];

const SAMPLES = [
  "Cinematic teal & orange transition reel",
  "Fast-cut hype montage with whip pans",
  "Talking-head edit with light leaks",
];

const DRIVE_FILES = [
  { name: "reel_final_v3.mp4", meta: "0:24 · 42.1 MB" },
  { name: "ig_edit_draft2.mov", meta: "0:31 · 68.4 MB" },
  { name: "client_teaser_v1.mp4", meta: "0:18 · 29.6 MB" },
  { name: "bts_montage_export.mp4", meta: "0:27 · 51.0 MB" },
];

/* ---------------------------------------------------------------
   HELPERS
--------------------------------------------------------------- */

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const prefersReduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return [ref, visible];
}

function Reveal({ children, className = "", delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(24px)",
      }}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------
   FLOATING LAPTOP MOCKUP (hero banner graphic)
--------------------------------------------------------------- */

const LAPTOP_TRACKS = [
  { label: "CapCut", color: "bg-amber-500/70", cuts: [14, 42, 71] },
  { label: "Premiere", color: "bg-orange-500/70", cuts: [24, 58, 88] },
  { label: "AE", color: "bg-yellow-500/70", cuts: [8, 36, 63, 92] },
];

const LAPTOP_KEYFRAMES = [12, 34, 58, 79, 93];

function FloatingLaptop({ dark }) {
  const t = (d, l) => (dark ? d : l);
  return (
    <div className="relative mx-auto mb-16 w-full max-w-md [perspective:1400px] sm:mb-20">
      <div
        className={`ambient-glow pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl ${t(
          "bg-[radial-gradient(circle,theme(colors.amber.500/25)_0%,theme(colors.orange.500/12)_45%,transparent_70%)]",
          "bg-[radial-gradient(circle,theme(colors.amber.400/20)_0%,theme(colors.orange.300/10)_45%,transparent_70%)]"
        )}`}
      />

      {/* Ground shadow — stays put while the laptop tilts above it */}
      <div className="pointer-events-none absolute bottom-[-6px] left-1/2 h-7 w-[78%] -translate-x-1/2 rounded-[50%] bg-black/50 blur-xl sm:bottom-[-10px] sm:h-9" />

      <div
        className="group relative mx-auto w-full origin-bottom transition-transform duration-500 ease-out will-change-transform [transform-style:preserve-3d] [transform:rotateX(14deg)_rotateY(-20deg)] hover:[transform:rotateX(4deg)_rotateY(-6deg)]"
      >
        {/* Screen bezel — sits forward in 3D space */}
        <div
          className={`relative origin-bottom rounded-t-2xl border p-3 shadow-[0_45px_70px_-20px_rgba(0,0,0,0.75)] backdrop-blur-md [transform:translateZ(22px)] ${t(
            "border-white/10 bg-white/5",
            "border-black/10 bg-white/60"
          )}`}
        >
          <div className={`absolute left-1/2 top-1.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${t("bg-white/20", "bg-black/20")}`} />

          <div className={`overflow-hidden rounded-lg border ${t("border-white/5 bg-slate-950", "border-black/5 bg-slate-950")}`}>
            {/* Video preview */}
            <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-9 w-9 rounded-full bg-white/10 ring-1 ring-white/20 sm:h-10 sm:w-10" />
              </div>
              <div className="absolute inset-x-3 bottom-3 h-0.5 rounded-full bg-white/10">
                <div className="scrub-line absolute -top-[3px] h-[7px] w-[7px] rounded-full bg-orange-400 shadow-[0_0_10px_2px_rgba(251,146,60,0.7)]" />
                {LAPTOP_KEYFRAMES.map((k) => (
                  <div key={k} className="absolute -top-1 h-2.5 w-[2px] bg-amber-300/70" style={{ left: `${k}%` }} />
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-1.5 border-t border-white/5 px-3 py-2.5">
              {LAPTOP_TRACKS.map((track) => (
                <div key={track.label} className="flex items-center gap-2">
                  <span className="w-12 shrink-0 font-mono-tc text-[8px] uppercase tracking-wide text-slate-500 sm:w-14 sm:text-[9px]">
                    {track.label}
                  </span>
                  <div className="relative h-2 flex-1 overflow-hidden rounded bg-white/5 sm:h-2.5">
                    <div className={`h-full w-full ${track.color} opacity-30`} />
                    {track.cuts.map((c) => (
                      <div key={c} className="cut-glow absolute top-0 h-full w-[2px] rounded bg-amber-400" style={{ left: `${c}%` }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* screen-edge highlight to sell the glass/bezel bevel */}
          <div className="pointer-events-none absolute inset-0 rounded-t-2xl ring-1 ring-inset ring-white/10" />
        </div>

        {/* Hinge crease */}
        <div
          className={`relative mx-auto h-1.5 w-[102%] -translate-x-[1%] [transform:translateZ(10px)] ${t(
            "bg-gradient-to-b from-black/50 to-black/10",
            "bg-gradient-to-b from-black/30 to-black/5"
          )}`}
        />

        {/* Keyboard deck — a real receding plane, not just a flat bar */}
        <div
          className="relative mx-auto h-11 w-[112%] origin-top -translate-x-[6%] sm:h-14"
          style={{ transform: "rotateX(62deg) translateZ(-2px)" }}
        >
          <div
            className={`h-full w-full rounded-b-xl border border-t-0 ${t(
              "border-white/10 bg-gradient-to-b from-slate-800/80 via-slate-700/60 to-slate-300/40",
              "border-black/10 bg-gradient-to-b from-slate-300/70 via-slate-200/60 to-white/80"
            )}`}
            style={{ clipPath: "polygon(6% 0, 94% 0, 100% 100%, 0% 100%)" }}
          >
            <div className={`mx-auto mt-2 h-3 w-14 rounded-sm sm:mt-3 sm:h-4 sm:w-16 ${t("bg-black/30", "bg-black/10")}`} />
          </div>
        </div>

        {/* Floating FX cards — desktop */}
        <div
          className={`float-card-1 absolute -left-4 -top-7 hidden items-center gap-2 rounded-xl border px-3 py-2 text-[11px] shadow-lg backdrop-blur-md sm:flex md:-left-14 md:-top-9 md:px-4 md:py-2.5 md:text-xs ${t(
            "border-white/10 bg-white/5 text-slate-200",
            "border-black/10 bg-white/70 text-slate-800"
          )}`}
          style={{ transform: "translateZ(60px)" }}
        >
          <Music2 size={13} className="shrink-0 text-yellow-500" />
          Detected BPM: 128 (Sync Cut)
        </div>

        <div
          className={`float-card-2 absolute -right-4 top-3 hidden items-center gap-2 rounded-xl border px-3 py-2 text-[11px] shadow-lg backdrop-blur-md sm:flex md:-right-14 md:top-6 md:px-4 md:py-2.5 md:text-xs ${t(
            "border-white/10 bg-white/5 text-slate-200",
            "border-black/10 bg-white/70 text-slate-800"
          )}`}
          style={{ transform: "translateZ(60px)" }}
        >
          <Palette size={13} className="shrink-0 text-orange-500" />
          Teal &amp; Orange CC (.cube)
        </div>

        <div
          className={`float-card-3 absolute -bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-xl border px-3 py-2 text-[11px] shadow-lg backdrop-blur-md sm:flex md:bottom-[-2.5rem] md:px-4 md:py-2.5 md:text-xs ${t(
            "border-white/10 bg-white/5 text-slate-200",
            "border-black/10 bg-white/70 text-slate-800"
          )}`}
          style={{ transform: "translateX(-50%) translateZ(60px)" }}
        >
          <Zap size={13} className="shrink-0 text-amber-500" />
          Optical Zoom (0.2s Decay)
        </div>
      </div>

      {/* Floating FX cards — mobile (stacked, static) */}
      <div className="mt-8 flex flex-col items-center gap-2 sm:hidden">
        {[
          { icon: Music2, color: "text-yellow-500", label: "Detected BPM: 128 (Sync Cut)" },
          { icon: Palette, color: "text-orange-500", label: "Teal & Orange CC (.cube)" },
          { icon: Zap, color: "text-amber-500", label: "Optical Zoom (0.2s Decay)" },
        ].map(({ icon: Icon, color, label }) => (
          <div
            key={label}
            className={`flex w-full max-w-[260px] items-center gap-2 rounded-xl border px-4 py-2 text-[11px] shadow-lg backdrop-blur-md ${t(
              "border-white/10 bg-white/5 text-slate-200",
              "border-black/10 bg-white/70 text-slate-800"
            )}`}
          >
            <Icon size={13} className={`shrink-0 ${color}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   MAIN COMPONENT
--------------------------------------------------------------- */

export default function EditDeconstruct() {
  const [theme, setTheme] = useState("dark");
  const isDark = theme === "dark";
  const t = (dark, light) => (isDark ? dark : light);

  const [url, setUrl] = useState("");
  const [showDemo, setShowDemo] = useState(false);
  const [demoMounted, setDemoMounted] = useState(false);
  const [activeSoftware, setActiveSoftware] = useState("CapCut");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [billing, setBilling] = useState("monthly");
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [driveOpen, setDriveOpen] = useState(false);
  const [driveConnecting, setDriveConnecting] = useState(false);
  const demoRef = useRef(null);

  useEffect(() => {
    if (showDemo) {
      const t = setTimeout(() => setDemoMounted(true), 20);
      return () => clearTimeout(t);
    }
  }, [showDemo]);

  const runDemo = useCallback((sampleUrl) => {
    if (sampleUrl) setUrl(sampleUrl);
    setShowDemo(true);
    setTimeout(() => {
      demoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, []);

  const openDrive = () => {
    setDriveOpen(true);
    setDriveConnecting(true);
    setTimeout(() => setDriveConnecting(false), 700);
  };

  const pickDriveFile = (file) => {
    setDriveOpen(false);
    runDemo(file.name);
  };

  const copyStep = (text, idx) => {
    try {
      navigator.clipboard?.writeText(text);
    } catch (e) {
      /* clipboard unavailable in this preview — fail quietly */
    }
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx((cur) => (cur === idx ? null : cur)), 1500);
  };

  const factor = billing === "yearly" ? 0.8 : 1;

  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors duration-300 selection:bg-amber-400/30 ${t(
        "bg-slate-950 text-slate-100",
        "bg-amber-50 text-slate-900"
      )}`}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif; }
        .font-mono-tc { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        @keyframes drift {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(30px,-20px) scale(1.05); }
        }
        @keyframes scrub {
          0% { left: -8%; }
          100% { left: 108%; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px 0 rgba(245,158,11,0.4), 0 0 0 0 rgba(251,191,36,0.0); }
          50% { box-shadow: 0 0 36px 6px rgba(245,158,11,0.65), 0 0 20px 3px rgba(251,191,36,0.4); }
        }
        .btn-glow { animation: glowPulse 2.6s ease-in-out infinite; }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .text-shimmer {
          background-size: 200% auto;
          animation: shimmer 3.5s linear infinite;
        }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .float-in { animation: floatUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes tickPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .tick-pulse { animation: tickPulse 1.8s ease-in-out infinite; }
        @keyframes ambientPulse {
          0%, 100% { opacity: 0.55; transform: translate(-50%,-50%) scale(1); }
          50% { opacity: 0.85; transform: translate(-50%,-50%) scale(1.08); }
        }
        .ambient-glow { animation: ambientPulse 6s ease-in-out infinite; }
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .float-card-1 { animation: floatY 4.5s ease-in-out infinite; }
        .float-card-2 { animation: floatY 5.2s ease-in-out infinite 0.6s; }
        .float-card-3 { animation: floatY 4.8s ease-in-out infinite 1.1s; }
        @keyframes cutGlow {
          0%, 100% { box-shadow: 0 0 4px 1px rgba(245,158,11,0.5); }
          50% { box-shadow: 0 0 9px 2px rgba(245,158,11,0.9); }
        }
        .cut-glow { animation: cutGlow 2.2s ease-in-out infinite; }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .toggle-spin { transition: transform 0.5s cubic-bezier(0.34,1.56,0.64,1); }
        @media (prefers-reduced-motion: reduce) {
          .btn-glow, .text-shimmer, .float-in, .tick-pulse, .scrub-line, .ambient-glow, .float-card-1, .float-card-2, .float-card-3, .cut-glow { animation: none !important; }
          .toggle-spin { transition: none !important; }
        }
        .scrub-line { animation: scrub 3.4s linear infinite; }
      `}</style>

      {/* ---------------- NAV ---------------- */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300 ${t(
          "border-white/5 bg-slate-950/70",
          "border-black/5 bg-amber-50/80"
        )}`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-amber-500 to-yellow-500">
              <Layers size={16} className="text-white" />
            </div>
            <span className="font-display text-[15px] font-semibold tracking-tight">
              EditDeconstruct
            </span>
          </div>
          <nav
            className={`hidden items-center gap-8 text-sm md:flex ${t(
              "text-slate-400",
              "text-slate-600"
            )}`}
          >
            <a href="#demo" className={t("transition hover:text-slate-100", "transition hover:text-slate-900")}>
              How it works
            </a>
            <a href="#pricing" className={t("transition hover:text-slate-100", "transition hover:text-slate-900")}>
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label="Toggle day and night mode"
              aria-pressed={!isDark}
              className={`toggle-spin flex h-9 w-9 items-center justify-center rounded-full ring-1 transition ${t(
                "bg-white/5 ring-white/10 hover:bg-white/10",
                "bg-black/5 ring-black/10 hover:bg-black/10"
              )}`}
              style={{ transform: isDark ? "rotate(0deg)" : "rotate(180deg)" }}
            >
              {isDark ? (
                <Moon size={15} className="text-amber-300" />
              ) : (
                <Sun size={15} className="text-amber-500" />
              )}
            </button>
            <a
              href="#pricing"
              className={`rounded-full px-4 py-2 text-sm font-medium ring-1 transition ${t(
                "bg-white/5 text-slate-100 ring-white/10 hover:bg-white/10",
                "bg-black/5 text-slate-900 ring-black/10 hover:bg-black/10"
              )}`}
            >
              Get started
            </a>
          </div>
        </div>
      </header>

      {/* ---------------- HERO ---------------- */}
      <section
        className={`relative overflow-hidden px-5 pb-24 pt-20 transition-colors duration-300 md:pt-28 ${t(
          "bg-slate-950",
          "bg-amber-50"
        )}`}
      >
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-600/25 via-yellow-500/15 to-orange-400/10 blur-3xl"
          style={{ animation: "drift 14s ease-in-out infinite" }}
        />
        <div
          className="pointer-events-none absolute -top-10 left-[15%] h-[320px] w-[420px] rounded-full bg-yellow-400/10 blur-3xl"
          style={{ animation: "drift 18s ease-in-out infinite reverse" }}
        />
        <div
          className="pointer-events-none absolute top-40 right-[8%] h-[280px] w-[360px] rounded-full bg-orange-500/10 blur-3xl"
          style={{ animation: "drift 11s ease-in-out infinite" }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <FloatingLaptop dark={isDark} />

          <div
            className={`float-in mx-auto mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${t(
              "border-white/10 bg-white/5 text-slate-400",
              "border-black/10 bg-black/5 text-slate-600"
            )}`}
            style={{ animationDelay: "0ms" }}
          >
            <Sparkles size={12} className="text-yellow-500" />
            Frame-accurate edit detection
          </div>
          <h1
            className={`float-in font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl ${t(
              "text-slate-50",
              "text-slate-900"
            )}`}
            style={{ animationDelay: "80ms" }}
          >
            Paste Any Reel, TikTok, or Short.
            <br />
            <span className="text-shimmer bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
              Get the Exact Edit Recipe
            </span>{" "}
            in Seconds.
          </h1>
          <p
            className={`float-in mx-auto mt-6 max-w-xl text-balance text-base sm:text-lg ${t(
              "text-slate-400",
              "text-slate-600"
            )}`}
            style={{ animationDelay: "160ms" }}
          >
            Break down transitions, CC, audio, and get step-by-step guides for
            CapCut, Premiere, After Effects &amp; DaVinci.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              runDemo();
            }}
            className="float-in mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row"
            style={{ animationDelay: "240ms" }}
          >
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.tiktok.com/@handle/video/..."
              className={`w-full flex-1 rounded-xl border px-4 py-3.5 font-mono-tc text-sm outline-none ring-amber-400/40 transition focus:ring-2 ${t(
                "border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500",
                "border-black/10 bg-white text-slate-900 placeholder:text-slate-400"
              )}`}
            />
            <button
              type="submit"
              className="btn-glow shrink-0 whitespace-nowrap rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
            >
              Deconstruct Edit 🪄
            </button>
          </form>

          <div
            className="float-in mx-auto mt-5 flex max-w-xl items-center gap-3"
            style={{ animationDelay: "300ms" }}
          >
            <div className={`h-px flex-1 ${t("bg-white/10", "bg-black/10")}`} />
            <span className={`text-xs uppercase tracking-wide ${t("text-slate-600", "text-slate-400")}`}>
              or
            </span>
            <div className={`h-px flex-1 ${t("bg-white/10", "bg-black/10")}`} />
          </div>

          <button
            onClick={openDrive}
            className={`float-in mx-auto mt-4 flex items-center gap-2 rounded-xl border border-dashed px-5 py-3 text-sm font-medium transition ${t(
              "border-white/15 bg-white/[0.02] text-slate-300 hover:border-white/30 hover:bg-white/[0.05] hover:text-white",
              "border-black/15 bg-black/[0.02] text-slate-600 hover:border-black/30 hover:bg-black/[0.05] hover:text-slate-900"
            )}`}
            style={{ animationDelay: "340ms" }}
          >
            <Upload size={15} className="text-orange-500" />
            Upload edit from Drive
          </button>

          <div
            className="float-in mt-6 flex flex-wrap items-center justify-center gap-2"
            style={{ animationDelay: "380ms" }}
          >
            <span className={`text-xs ${t("text-slate-500", "text-slate-500")}`}>
              Or try a sample:
            </span>
            {SAMPLES.map((s) => (
              <button
                key={s}
                onClick={() => runDemo(s)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${t(
                  "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white",
                  "border-black/10 bg-black/[0.03] text-slate-600 hover:border-black/20 hover:bg-black/[0.06] hover:text-slate-900"
                )}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- DEMO ---------------- */}
      {showDemo && (
        <section
          id="demo"
          ref={demoRef}
          className={`border-t px-5 py-20 transition-colors duration-300 ${t(
            "border-white/5 bg-slate-950",
            "border-black/5 bg-amber-50"
          )}`}
        >
          <div
            className="mx-auto max-w-6xl transition-all duration-700 ease-out"
            style={{
              opacity: demoMounted ? 1 : 0,
              transform: demoMounted ? "translateY(0)" : "translateY(20px)",
            }}
          >
            <div className="mb-10 text-center">
              <h2
                className={`font-display text-2xl font-semibold sm:text-3xl ${t(
                  "text-slate-50",
                  "text-slate-900"
                )}`}
              >
                Here's what we found
              </h2>
              <p className={`mt-2 truncate font-mono-tc text-xs ${t("text-slate-500", "text-slate-500")}`}>
                {url || "sample_reel.mp4"}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              {/* Video preview */}
              <Reveal className="lg:col-span-2">
                <div
                  className={`overflow-hidden rounded-2xl border ${t(
                    "border-white/10 bg-white/[0.03]",
                    "border-black/10 bg-white shadow-sm"
                  )}`}
                >
                  <div className="relative flex aspect-[9/16] items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur">
                      <Play size={22} className="ml-0.5 text-white" fill="white" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 to-transparent" />
                  </div>
                  <div
                    className={`relative border-t px-4 py-4 ${t(
                      "border-white/5",
                      "border-black/5"
                    )}`}
                  >
                    <div className={`relative h-1 rounded-full ${t("bg-white/10", "bg-black/10")}`}>
                      <div className="scrub-line absolute -top-[3px] h-[7px] w-[7px] rounded-full bg-orange-400 shadow-[0_0_10px_2px_rgba(251,146,60,0.7)]" />
                      {CUTS.map((c) => (
                        <div
                          key={c.t}
                          className="tick-pulse group absolute -top-1 h-3 w-[2px] cursor-pointer bg-rose-500"
                          style={{ left: `${c.pct}%` }}
                        >
                          <div
                            className={`pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 font-mono-tc text-[10px] opacity-0 shadow-lg ring-1 transition group-hover:opacity-100 ${t(
                              "bg-slate-900 text-slate-200 ring-white/10",
                              "bg-slate-900 text-slate-100 ring-black/10"
                            )}`}
                          >
                            {c.t} · {c.label}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      className={`mt-2 flex items-center justify-between font-mono-tc text-[11px] ${t(
                        "text-slate-500",
                        "text-slate-500"
                      )}`}
                    >
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> 0:00
                      </span>
                      <span>0:24</span>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* Breakdown cards */}
              <Reveal className="grid gap-4 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-2" delay={120}>
                <div
                  className={`rounded-2xl border p-5 ${t(
                    "border-white/10 bg-white/[0.03]",
                    "border-black/10 bg-white shadow-sm"
                  )}`}
                >
                  <div className={`mb-3 flex items-center gap-2 text-sm font-medium ${t("text-slate-200", "text-slate-800")}`}>
                    <Music2 size={16} className="text-yellow-500" />
                    Detected Track &amp; BPM
                  </div>
                  <p className={`text-sm ${t("text-slate-300", "text-slate-600")}`}>
                    "Golden Hour" (Sped Up) — Wave Atlas
                  </p>
                  <p className={`mt-3 font-mono-tc text-3xl font-semibold ${t("text-slate-50", "text-slate-900")}`}>
                    128<span className="text-sm text-slate-500"> BPM</span>
                  </p>
                </div>

                <div
                  className={`rounded-2xl border p-5 ${t(
                    "border-white/10 bg-white/[0.03]",
                    "border-black/10 bg-white shadow-sm"
                  )}`}
                >
                  <div className={`mb-3 flex items-center gap-2 text-sm font-medium ${t("text-slate-200", "text-slate-800")}`}>
                    <Palette size={16} className="text-orange-500" />
                    Color Grade / CC
                  </div>
                  <p className={`text-sm ${t("text-slate-300", "text-slate-600")}`}>
                    Teal &amp; Orange, crushed blacks
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {PALETTE.map((p) => (
                      <div key={p.hex} className="flex items-center gap-1.5">
                        <span
                          className="h-5 w-5 rounded-full ring-1 ring-white/20"
                          style={{ backgroundColor: p.hex }}
                        />
                        <span className="font-mono-tc text-[10px] text-slate-500">
                          {p.hex}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-5 sm:col-span-2 ${t(
                    "border-white/10 bg-white/[0.03]",
                    "border-black/10 bg-white shadow-sm"
                  )}`}
                >
                  <div className={`mb-3 flex items-center gap-2 text-sm font-medium ${t("text-slate-200", "text-slate-800")}`}>
                    <Zap size={16} className="text-amber-500" />
                    Main FX &amp; Transitions
                  </div>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {FX_LIST.map((fx) => (
                      <li
                        key={fx}
                        className={`flex items-center gap-2 text-sm ${t("text-slate-300", "text-slate-600")}`}
                      >
                        <Sparkles size={13} className="shrink-0 text-slate-500" />
                        {fx}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>

            {/* Software tabs + steps */}
            <div
              className={`mt-8 rounded-2xl border p-5 sm:p-6 ${t(
                "border-white/10 bg-white/[0.03]",
                "border-black/10 bg-white shadow-sm"
              )}`}
            >
              {/* Desktop tabs */}
              <div className="hidden flex-wrap gap-2 md:flex">
                {SOFTWARE.map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveSoftware(s)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      activeSoftware === s
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-[0_0_16px_rgba(245,158,11,0.35)]"
                        : t(
                            "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200",
                            "bg-black/5 text-slate-500 hover:bg-black/10 hover:text-slate-800"
                          )
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Mobile drawer trigger */}
              <button
                onClick={() => setDrawerOpen(true)}
                className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium md:hidden ${t(
                  "bg-white/5 text-slate-200",
                  "bg-black/5 text-slate-800"
                )}`}
              >
                <span className="flex items-center gap-2">
                  <Menu size={15} /> {activeSoftware}
                </span>
                <ChevronDown size={15} className="text-slate-500" />
              </button>

              <div key={activeSoftware} className="float-in mt-5 space-y-2.5">
                {STEPS[activeSoftware].map((step, i) => {
                  const key = `${activeSoftware}-${i}`;
                  const copied = copiedIdx === key;
                  return (
                    <div
                      key={key}
                      className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${t(
                        "border-white/5 bg-slate-950/40",
                        "border-black/5 bg-amber-50/60"
                      )}`}
                    >
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                        <Check size={12} />
                      </div>
                      <p className={`flex-1 text-sm leading-relaxed ${t("text-slate-300", "text-slate-600")}`}>
                        {step}
                      </p>
                      <button
                        onClick={() => copyStep(step, key)}
                        className={`shrink-0 rounded-md p-1.5 transition ${t(
                          "text-slate-500 hover:bg-white/5 hover:text-slate-200",
                          "text-slate-400 hover:bg-black/5 hover:text-slate-800"
                        )}`}
                        aria-label="Copy step"
                      >
                        {copied ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Mobile drawer sheet */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className={`relative w-full rounded-t-2xl border-t p-4 pb-8 ${t(
              "border-white/10 bg-slate-900",
              "border-black/10 bg-white"
            )}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className={`text-sm font-medium ${t("text-slate-200", "text-slate-800")}`}>
                Choose software
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className={`rounded-md p-1 ${t(
                  "text-slate-400 hover:bg-white/5",
                  "text-slate-500 hover:bg-black/5"
                )}`}
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-1.5">
              {SOFTWARE.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setActiveSoftware(s);
                    setDrawerOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm ${
                    activeSoftware === s
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white"
                      : t("bg-white/5 text-slate-300", "bg-black/5 text-slate-700")
                  }`}
                >
                  {s}
                  {activeSoftware === s && <Check size={15} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload from Drive modal */}
      {driveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDriveOpen(false)}
          />
          <div
            className={`relative w-full max-w-md rounded-2xl border p-5 shadow-2xl ${t(
              "border-white/10 bg-slate-900",
              "border-black/10 bg-white"
            )}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className={`flex items-center gap-2 text-sm font-medium ${t("text-slate-200", "text-slate-800")}`}>
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-orange-400 to-amber-500">
                  <FileVideo size={13} className="text-white" />
                </div>
                Select a file from Drive
              </div>
              <button
                onClick={() => setDriveOpen(false)}
                className={`rounded-md p-1 ${t(
                  "text-slate-400 hover:bg-white/5",
                  "text-slate-500 hover:bg-black/5"
                )}`}
              >
                <X size={16} />
              </button>
            </div>

            {driveConnecting ? (
              <div className={`flex flex-col items-center justify-center gap-3 py-10 ${t("text-slate-400", "text-slate-500")}`}>
                <Loader2 size={22} className="animate-spin text-orange-500" />
                <p className="text-sm">Connecting to Google Drive…</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {DRIVE_FILES.map((file) => (
                  <button
                    key={file.name}
                    onClick={() => pickDriveFile(file)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${t(
                      "hover:bg-white/5",
                      "hover:bg-black/5"
                    )}`}
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${t("bg-white/5 text-slate-400", "bg-black/5 text-slate-500")}`}>
                      <FileVideo size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-mono-tc text-sm ${t("text-slate-200", "text-slate-800")}`}>
                        {file.name}
                      </p>
                      <p className="font-mono-tc text-[11px] text-slate-500">{file.meta}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- PRICING ---------------- */}
      <section
        id="pricing"
        className={`border-t px-5 py-24 transition-colors duration-300 ${t(
          "border-white/5",
          "border-black/5"
        )}`}
      >
        <div className="mx-auto max-w-5xl">
          <Reveal className="text-center">
            <h2 className={`font-display text-3xl font-semibold sm:text-4xl ${t("text-slate-50", "text-slate-900")}`}>
              Simple pricing, serious scans
            </h2>
            <p className={`mt-3 ${t("text-slate-400", "text-slate-600")}`}>
              Every plan starts with a 30-day free trial. Cancel anytime.
            </p>

            <div
              className={`mx-auto mt-7 inline-flex items-center gap-3 rounded-full border p-1 ${t(
                "border-white/10 bg-white/5",
                "border-black/10 bg-black/5"
              )}`}
            >
              {["monthly", "yearly"].map((b) => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                    billing === b
                      ? t("bg-white text-slate-950", "bg-slate-900 text-white")
                      : t("text-slate-400 hover:text-slate-200", "text-slate-500 hover:text-slate-800")
                  }`}
                >
                  {b}
                  {b === "yearly" && (
                    <span className="ml-1.5 text-xs text-emerald-500">-20%</span>
                  )}
                </button>
              ))}
            </div>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PRICING.map((tier, i) => (
              <Reveal key={tier.name} delay={i * 90}>
                <div
                  className={`relative flex h-full flex-col rounded-2xl border p-6 ${
                    tier.popular
                      ? t(
                          "border-yellow-400/40 bg-gradient-to-b from-yellow-500/[0.08] to-transparent shadow-[0_0_40px_-8px_rgba(245,158,11,0.35)]",
                          "border-amber-400 bg-gradient-to-b from-amber-100/60 to-transparent shadow-[0_0_40px_-8px_rgba(245,158,11,0.25)]"
                        )
                      : t("border-white/10 bg-white/[0.03]", "border-black/10 bg-white shadow-sm")
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                      Most Popular
                    </span>
                  )}
                  <h3 className={`font-display text-lg font-semibold ${t("text-slate-50", "text-slate-900")}`}>
                    {tier.name}
                  </h3>
                  <p className={`mt-1 text-sm ${t("text-slate-500", "text-slate-500")}`}>{tier.tagline}</p>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className={`font-mono-tc text-3xl font-semibold ${t("text-slate-50", "text-slate-900")}`}>
                      ${(tier.monthlyUSD * factor).toFixed(2)}
                    </span>
                    <span className={`text-sm ${t("text-slate-500", "text-slate-500")}`}>/mo</span>
                  </div>
                  <p className="font-mono-tc text-xs text-slate-500">
                    or ₹{Math.round(tier.monthlyINR * factor)} / mo
                  </p>

                  <ul className="mt-6 flex-1 space-y-2.5">
                    {tier.features.map((f) => (
                      <li key={f} className={`flex items-center gap-2 text-sm ${t("text-slate-300", "text-slate-600")}`}>
                        <Check size={14} className="shrink-0 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`mt-7 w-full rounded-xl py-3 text-sm font-semibold transition ${
                      tier.popular
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:brightness-110"
                        : t(
                            "bg-white/5 text-slate-100 ring-1 ring-white/10 hover:bg-white/10",
                            "bg-black/5 text-slate-900 ring-1 ring-black/10 hover:bg-black/10"
                          )
                    }`}
                  >
                    Start free trial
                  </button>
                </div>
              </Reveal>
            ))}
          </div>

          <p className={`mt-8 text-center text-xs ${t("text-slate-600", "text-slate-500")}`}>
            30-day free trial on every plan · no card details shared with your editing software
          </p>
        </div>
      </section>

      <footer
        className={`border-t px-5 py-8 transition-colors duration-300 ${t(
          "border-white/5",
          "border-black/5"
        )}`}
      >
        <div className={`mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs sm:flex-row ${t("text-slate-600", "text-slate-500")}`}>
          <span>© {new Date().getFullYear()} EditDeconstruct</span>
          <span className="font-mono-tc">built frame by frame</span>
        </div>
      </footer>
    </div>
  );
}
