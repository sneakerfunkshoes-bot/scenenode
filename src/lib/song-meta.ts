const PLACEHOLDER_TITLES = [
  'metamorphosis',
  'phonk remix',
  'detected track',
  'demo track',
  'sample track',
  'unknown track',
  'edit audio track',
];

const PLACEHOLDER_ARTISTS = [
  'unknown artist',
  'audio edit engine',
  'metro boomin / audio edit engine',
  'scenecraft',
];

function clean(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isPlaceholderTitle(title: string): boolean {
  const n = title.toLowerCase();
  if (!n || n.length < 2) return true;
  return PLACEHOLDER_TITLES.some((p) => n === p || n.includes('metamorphosis'));
}

function isPlaceholderArtist(artist: string): boolean {
  const n = artist.toLowerCase();
  if (!n) return true;
  return PLACEHOLDER_ARTISTS.some((p) => n === p);
}

function parseDuration(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0.5) return value;
  const s = clean(value);
  if (!s) return 0;
  const asNum = Number(s);
  if (Number.isFinite(asNum) && asNum > 0.5) return asNum;
  const m = s.match(/^(\d+):(\d+)(?:\.(\d+))?$/);
  if (!m) return 0;
  const min = Number(m[1]);
  const sec = Number(m[2]);
  const frac = m[3] ? Number(`0.${m[3]}`) : 0;
  return min * 60 + sec + frac;
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    const s = clean(value);
    if (s) return s;
  }
  return '';
}

function nestedSong(data: Record<string, unknown>): Record<string, unknown> {
  const song = data.songInfo ?? data.song ?? data.track ?? data.audio;
  if (song && typeof song === 'object') return song as Record<string, unknown>;
  return {};
}

export interface ResolvedSongMeta {
  title: string;
  artist: string;
  bpm: number;
  durationSec: number;
}

export function resolveSongMeta(
  data: Record<string, unknown>,
  videoUrl: string,
  beatTimestamps: number[]
): ResolvedSongMeta {
  const song = nestedSong(data);

  let title = pickString(
    data.songTitle,
    data.trackTitle,
    data.audioTitle,
    song.title,
    song.name,
    song.track
  );
  let artist = pickString(
    data.songArtist,
    data.artist,
    data.audioArtist,
    song.artist,
    song.performer
  );

  if (isPlaceholderTitle(title)) title = '';
  if (isPlaceholderArtist(artist)) artist = '';

  const bpmRaw = Number(data.bpm ?? song.bpm);
  const durationRaw = parseDuration(
    data.trackDuration ?? data.duration ?? song.durationSec ?? song.duration
  );

  const bpm =
    Number.isFinite(bpmRaw) && bpmRaw >= 60 && bpmRaw <= 220
      ? Math.round(bpmRaw)
      : beatTimestamps.length >= 2
        ? Math.round(
            60 /
              Math.max(
                0.25,
                (beatTimestamps[beatTimestamps.length - 1]! - beatTimestamps[0]!) /
                  Math.max(1, beatTimestamps.length - 1)
              )
          )
        : 120;

  const durationSec =
    Number.isFinite(durationRaw) && durationRaw > 0.5
      ? durationRaw
      : beatTimestamps.length
        ? beatTimestamps[beatTimestamps.length - 1]! + 0.5
        : 15;

  if (!title) {
    title = 'Unknown Track';
  }
  if (!artist) {
    try {
      artist = new URL(videoUrl).hostname.replace(/^www\./, '') || 'Unknown Artist';
    } catch {
      artist = 'Unknown Artist';
    }
  }

  return { title, artist, bpm, durationSec };
}
