import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { NleSoftware, VideoBreakdownRecord } from '@/types/breakdown';
import { hashString, normalizeVideoUrl } from '@/lib/url-hash';

const CACHE_DIR = path.join(process.cwd(), '.cache', 'breakdowns');

function cacheKey(url: string, nle: NleSoftware): string {
  return hashString(`${normalizeVideoUrl(url)}::${nle}`);
}

export async function getEdgeCachedBreakdown(
  url: string,
  nle: NleSoftware
): Promise<VideoBreakdownRecord | null> {
  try {
    const file = path.join(CACHE_DIR, `${cacheKey(url, nle)}.json`);
    const raw = await readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as VideoBreakdownRecord;
    return { ...parsed, fromCache: true };
  } catch {
    return null;
  }
}

export async function setEdgeCachedBreakdown(
  url: string,
  nle: NleSoftware,
  breakdown: VideoBreakdownRecord
): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    const file = path.join(CACHE_DIR, `${cacheKey(url, nle)}.json`);
    await writeFile(file, JSON.stringify({ ...breakdown, fromCache: false }), 'utf8');
  } catch (err) {
    console.warn('[edge-cache] write failed', err);
  }
}
