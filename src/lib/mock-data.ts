import type { BreakdownData, ProjectAsset, SoftwareTool } from '@/types';

export const SOFTWARE_TOOLS: SoftwareTool[] = [
  'DaVinci Resolve',
  'Premiere Pro',
  'After Effects',
  'CapCut',
  'VN Editor',
];

export const PROJECT_TREE: ProjectAsset[] = [
  {
    id: 'proj-root',
    name: 'SceneCraft Projects',
    type: 'folder',
    children: [
      {
        id: 'proj-reel',
        name: 'summer-reel-v3',
        type: 'folder',
        children: [
          { id: 'a1', name: 'source_clip.mp4', type: 'video' },
          { id: 'a2', name: 'hook_broll.mov', type: 'video' },
          { id: 'a3', name: 'beat_sync.wav', type: 'audio' },
          { id: 'a4', name: 'vocal_stem.wav', type: 'audio' },
          { id: 'a5', name: 'export_guide_v2.log', type: 'log' },
        ],
      },
      {
        id: 'proj-brand',
        name: 'brand-launch',
        type: 'folder',
        children: [
          { id: 'b1', name: 'hero_master.mov', type: 'video' },
          {
            id: 'b2',
            name: 'sfx_pack',
            type: 'folder',
            children: [
              { id: 'b2a', name: 'whoosh_01.wav', type: 'audio' },
              { id: 'b2b', name: 'impact_hard.wav', type: 'audio' },
            ],
          },
          { id: 'b3', name: 'premiere_guide.log', type: 'log' },
        ],
      },
    ],
  },
  {
    id: 'uploads',
    name: 'Uploaded Clips',
    type: 'folder',
    children: [
      { id: 'u1', name: 'phone_take_01.mp4', type: 'video' },
      { id: 'u2', name: 'phone_take_02.mp4', type: 'video' },
      { id: 'u3', name: 'ambient_room.m4a', type: 'audio' },
    ],
  },
  {
    id: 'guides',
    name: 'Exported Guides',
    type: 'folder',
    children: [
      { id: 'g1', name: 'davinci_steps.log', type: 'log' },
      { id: 'g2', name: 'capcut_markers.log', type: 'log' },
    ],
  },
];

export const ASSISTANT_PRESETS = [
  'How do I recreate the main transition at 00:02?',
  'Explain the CC & color grading breakdown.',
] as const;

export const DEMO_BREAKDOWN: BreakdownData = {
  bpm: 128,
  duration: 15.4,
  previewLabel: 'summer-reel-v3 · source_clip.mp4',
  song: {
    title: 'Midnight Voltage',
    artist: 'Nova Circuit',
    bpm: 128,
    key: 'F# min',
  },
  beats: Array.from({ length: 32 }, (_, i) => {
    const time = (i * 60) / 128;
    const isDrop = i === 8 || i === 16 || i === 24;
    const isCut = [0, 5, 9, 12, 20, 25].includes(i);
    return {
      id: `beat-${i}`,
      time,
      intensity: isDrop ? 1 : i % 4 === 0 ? 0.9 : 0.45 + (i % 3) * 0.12,
      kind: isDrop ? 'drop' : isCut ? 'cut' : 'beat',
    } as const;
  }),
  effects: [
    { id: 'e1', type: 'Cut', label: 'Hard cut — cold open', timestamp: 0.0 },
    { id: 'e2', type: 'SFX', label: 'Bass hit + reverse', timestamp: 0.47 },
    { id: 'e3', type: 'Flash', label: 'White flash frame', timestamp: 1.88 },
    { id: 'e4', type: 'Transition', label: 'Whip pan / blur R→L', timestamp: 3.0 },
    { id: 'e5', type: 'Cut', label: 'Jump cut — product', timestamp: 4.22 },
    { id: 'e6', type: 'SFX', label: 'Whoosh soft', timestamp: 5.16 },
    { id: 'e7', type: 'Flash', label: 'RGB split flash', timestamp: 6.56 },
    { id: 'e8', type: 'Transition', label: 'Zoom blur in', timestamp: 7.5 },
    { id: 'e9', type: 'Cut', label: 'Match cut — motion', timestamp: 9.38 },
    { id: 'e10', type: 'SFX', label: 'Glitch stutter', timestamp: 11.25 },
    { id: 'e11', type: 'Transition', label: 'Dissolve to logo', timestamp: 13.59 },
    { id: 'e12', type: 'Flash', label: 'End card flash', timestamp: 14.53 },
  ],
  colorNotes: [
    {
      id: 'c1',
      timestamp: 0.0,
      title: 'Cold open LUT',
      note: 'Desaturated teal shadows, silver midtones, slight teal-orange split.',
    },
    {
      id: 'c2',
      timestamp: 4.22,
      title: 'Product punch',
      note: 'Lift exposure +0.3, push contrast, warm highlights for skin/product.',
    },
    {
      id: 'c3',
      timestamp: 9.38,
      title: 'Match cut blend',
      note: 'Match previous shot luminance; soft power window on subject.',
    },
    {
      id: 'c4',
      timestamp: 13.59,
      title: 'Logo end card',
      note: 'Flat metallic grade, vignette, high clarity on wordmark.',
    },
  ],
};
