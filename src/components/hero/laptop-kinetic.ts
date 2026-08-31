export const KINETIC_EASE = [0.4, 0, 0.2, 1] as const;

export type ShowcaseBgType = 'blue' | 'terracotta' | 'purple';

export interface ShowcaseFeature {
  title: string;
  desc: string;
}

export interface ShowcaseSlide {
  id: 'deconstruct' | 'features' | 'breakdown';
  bgType: ShowcaseBgType;
  bgColor: string;
  textColor: string;
  accentColor: string;
  badge: string;
  giantTitle: string;
  mainHeading: string;
  bodyText: string;
  rotationZ: number;
  scale: number;
  featuresList: ShowcaseFeature[];
}

export const SHOWCASE_SLIDES: ShowcaseSlide[] = [
  {
    id: 'deconstruct',
    bgType: 'blue',
    bgColor: '#DDF0FF',
    textColor: '#0F172A',
    accentColor: '#0284C7',
    badge: 'SceneCraft Engine',
    giantTitle: 'SceneCraft',
    mainHeading: 'Deconstruct the Edit. Rebuild it Beautifully.',
    bodyText:
      'SceneCraft watches a TikTok, Reel, or Shorts link and returns a cinematic breakdown — song info, BPM, visual SFX, transitions, flashes, and color notes — inside an IDE-grade workspace.',
    rotationZ: -6,
    scale: 1,
    featuresList: [
      { title: 'Cinematic Breakdown', desc: 'Full timeline keyframes from link' },
      { title: 'IDE Workspace', desc: 'Code-grade precision for video editors' },
      { title: 'Visual SFX & Color', desc: 'Automatic flash and LUT extraction' },
    ],
  },
  {
    id: 'features',
    bgType: 'terracotta',
    bgColor: '#FAF8F5',
    textColor: '#2A2421',
    accentColor: '#D96B43',
    badge: 'Terracotta Engine',
    giantTitle: 'Features',
    mainHeading: 'Core Editing Intelligence',
    bodyText:
      'Streamline your timeline workflow with automated music sync, cross-NLE map exports, and AI-driven keyframe assistance.',
    rotationZ: 6,
    scale: 0.95,
    featuresList: [
      {
        title: 'Beat-true Timelines',
        desc: 'Auto-detect BPM, drops, and cut points so every flash lands on the music.',
      },
      {
        title: 'NLE-ready Guides',
        desc: 'DaVinci, Premiere, After Effects, CapCut, and VN — step maps for your stack.',
      },
      {
        title: 'Edit Assistant AI',
        desc: 'Ask how to recreate any marker. Get exact tools, frames, and settings back.',
      },
    ],
  },
  {
    id: 'breakdown',
    bgType: 'purple',
    bgColor: '#E9D8F8',
    textColor: '#1E0A38',
    accentColor: '#8A2BE2',
    badge: 'NLE Visual Engine',
    giantTitle: 'Recreate',
    mainHeading: 'Break Down Any Video Edit into Exact Recreatable Steps.',
    bodyText:
      'AI visual inspection engine for CapCut, DaVinci Resolve, Premiere Pro, and After Effects editors.',
    rotationZ: -4,
    scale: 1.05,
    featuresList: [
      { title: 'CapCut & VN Stack', desc: 'Mobile-to-desktop step mapping' },
      { title: 'DaVinci & Premiere', desc: 'Node graph & effect presets' },
      { title: 'After Effects Engine', desc: 'Expression & motion blur values' },
    ],
  },
];
