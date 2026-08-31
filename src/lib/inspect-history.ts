import type { NleSoftware, VideoBreakdownRecord } from '@/types/breakdown';
import { normalizeVideoUrl } from '@/lib/url-hash';

const STORAGE_KEY = 'scenecraft_inspect_history_v2';
const MAX_ITEMS = 24;

export interface InspectHistoryItem {
  id: string;
  videoUrl: string;
  songTitle: string;
  songArtist: string;
  bpm: number;
  nle: NleSoftware;
  analyzedAt: string;
  breakdown: VideoBreakdownRecord;
}

function readAll(): InspectHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as InspectHistoryItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: InspectHistoryItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* quota */
  }
}

export function listInspectHistory(): InspectHistoryItem[] {
  return readAll();
}

export function upsertInspectHistory(
  breakdown: VideoBreakdownRecord,
  nle: NleSoftware,
  videoUrl: string
): InspectHistoryItem {
  const id = normalizeVideoUrl(videoUrl || breakdown.videoUrl);
  const item: InspectHistoryItem = {
    id,
    videoUrl: videoUrl || breakdown.videoUrl,
    songTitle: breakdown.songTitle,
    songArtist: breakdown.songArtist,
    bpm: breakdown.bpm,
    nle,
    analyzedAt: new Date().toISOString(),
    breakdown: { ...breakdown, nleSoftware: nle, videoUrl: videoUrl || breakdown.videoUrl },
  };
  const rest = readAll().filter((row) => row.id !== id);
  writeAll([item, ...rest]);
  return item;
}

export function getInspectHistoryItem(id: string): InspectHistoryItem | null {
  return readAll().find((row) => row.id === id) ?? null;
}
