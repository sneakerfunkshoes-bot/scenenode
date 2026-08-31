import { createMockBreakdown } from '@/lib/breakdown-mock';
import type { NleSoftware, VideoBreakdownRecord } from '@/types/breakdown';

export interface ExampleInspect {
  id: string;
  style: string;
  blurb: string;
  url: string;
  nle: NleSoftware;
  breakdown: VideoBreakdownRecord;
}

function example(
  id: string,
  style: string,
  blurb: string,
  url: string,
  nle: NleSoftware,
  song: { title: string; artist: string; bpm: number; duration: number }
): ExampleInspect {
  const breakdown = createMockBreakdown(url, nle);
  breakdown.songTitle = song.title;
  breakdown.songArtist = song.artist;
  breakdown.bpm = song.bpm;
  breakdown.trackDuration = Math.max(song.duration, breakdown.trackDuration);
  breakdown.previewLabel = style;
  return { id, style, blurb, url, nle, breakdown };
}

export const EXAMPLE_INSPECTS: ExampleInspect[] = [
  example(
    'phonk-football',
    'Sports + glitch',
    'CRT wipe into a kick, alien sticker on the drop.',
    'https://www.youtube.com/shorts/phonk-football-demo',
    'CapCut',
    { title: 'Mask Off (Phonk Edit)', artist: 'Future (edit)', bpm: 130, duration: 16.2 }
  ),
  example(
    'talking-head',
    'Talking-head captions',
    'Neon subtitles locked to speech, flash on every punchline.',
    'https://www.tiktok.com/@scenecraft/video/1000000001',
    'CapCut',
    { title: 'Original Audio', artist: 'Creator voice + bed', bpm: 96, duration: 18.4 }
  ),
  example(
    'cinematic-reel',
    'Teal & orange reel',
    'Whip pans, exposure pops, and a slow-mo landing.',
    'https://www.instagram.com/reel/cinematicDemo01',
    'DaVinci Resolve',
    { title: 'Nightcall (edit)', artist: 'Kavinsky', bpm: 108, duration: 22.0 }
  ),
  example(
    'speed-ramp',
    'Speed-ramp montage',
    '300% into 50% on the hit, white flash on impact.',
    'https://www.youtube.com/shorts/speed-ramp-demo',
    'Premiere Pro',
    { title: 'Blinding Lights (cut)', artist: 'The Weeknd', bpm: 171, duration: 14.8 }
  ),
  example(
    'ae-sticker',
    'Sticker + shake',
    'Tracked PNG sticker, 24Hz micro-jitter, lens flare.',
    'https://www.tiktok.com/@scenecraft/video/1000000002',
    'After Effects',
    { title: 'GODS (edit)', artist: 'NewJeans', bpm: 140, duration: 13.5 }
  ),
  example(
    'end-card',
    'Hook + end card',
    'Cold-open whoosh, beat cuts, white flash into logo.',
    'https://www.instagram.com/reel/endCardDemo02',
    'CapCut',
    { title: 'Popular (edit)', artist: 'The Weeknd, Playboi Carti', bpm: 99, duration: 19.1 }
  ),
];

export function getExampleInspect(id: string): ExampleInspect | null {
  return EXAMPLE_INSPECTS.find((item) => item.id === id) ?? null;
}
