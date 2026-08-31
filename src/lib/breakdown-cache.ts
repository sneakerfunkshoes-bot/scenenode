import type { VideoBreakdownRecord } from '@/types/breakdown';
import { normalizeVideoUrl } from '@/lib/url-hash';

const STORAGE_KEY = 'scenecraft_breakdown_cache_v2';

type CacheMap = Record<string, VideoBreakdownRecord>;

function readCache(): CacheMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CacheMap) : {};
  } catch {
    return {};
  }
}

function writeCache(map: CacheMap) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

export function getCachedBreakdown(url: string): VideoBreakdownRecord | null {
  const key = normalizeVideoUrl(url);
  return readCache()[key] ?? null;
}

export function setCachedBreakdown(url: string, breakdown: VideoBreakdownRecord) {
  const key = normalizeVideoUrl(url);
  const map = readCache();
  map[key] = breakdown;
  writeCache(map);
}
