import type { NleSoftware } from '@/types/breakdown';

export interface NleTheme {
  accent: string;
  accentRgb: string;
  glow: string;
  ring: string;
  badge: string;
  waveformPlayed: string;
  waveformIdle: string;
  playhead: string;
}

const GRAY: NleTheme = {
  accent: 'text-zinc-300',
  accentRgb: '161,161,170',
  glow: 'transparent',
  ring: 'ring-zinc-600',
  badge: 'bg-zinc-800 border-zinc-700 text-zinc-300',
  waveformPlayed: 'bg-zinc-400/90',
  waveformIdle: 'bg-zinc-700/50',
  playhead: '#d4d4d8',
};

const THEMES: Record<NleSoftware, NleTheme> = {
  'DaVinci Resolve': GRAY,
  'Premiere Pro': GRAY,
  'After Effects': GRAY,
  CapCut: GRAY,
  'VN Editor': GRAY,
};

export function getNleTheme(nle: NleSoftware): NleTheme {
  return THEMES[nle];
}
