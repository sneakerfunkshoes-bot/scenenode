import { createHash, randomBytes } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { getCacheDir } from '@/lib/cache-dir';
import type { NleSoftware, VideoBreakdownRecord } from '@/types/breakdown';
import type { RemixPayload } from '@/types/growth';

const STORE_FILE = path.join(getCacheDir(), 'remix-payloads.json');

interface RemixStore {
  items: RemixPayload[];
}

async function loadStore(): Promise<RemixStore> {
  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    return JSON.parse(raw) as RemixStore;
  } catch {
    return { items: [] };
  }
}

async function saveStore(store: RemixStore): Promise<void> {
  await mkdir(path.dirname(STORE_FILE), { recursive: true });
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
}

function newRemixCode(): string {
  const entropy = randomBytes(4).toString('hex');
  return `sn_${entropy}`;
}

/** Stable-ish code from source URL for dedupe attempts (optional). */
export function remixCodeHint(sourceUrl: string): string {
  const hash = createHash('sha1').update(sourceUrl.trim()).digest('hex').slice(0, 6);
  return `sn_${hash}`;
}

export async function createRemixPayload(input: {
  sourceUrl: string;
  nle: NleSoftware;
  breakdown: VideoBreakdownRecord;
}): Promise<RemixPayload> {
  const store = await loadStore();
  const code = newRemixCode();
  const payload: RemixPayload = {
    code,
    createdAt: new Date().toISOString(),
    sourceUrl: input.sourceUrl,
    nle: input.nle,
    songTitle: input.breakdown.songTitle,
    songArtist: input.breakdown.songArtist,
    bpm: input.breakdown.bpm,
    trackDuration: input.breakdown.trackDuration,
    beatTimestamps: input.breakdown.beatTimestamps,
    breakdown: input.breakdown,
    watermark: {
      enabled: true,
      label: 'Made on SceneNode',
    },
  };

  store.items.unshift(payload);
  if (store.items.length > 2000) store.items = store.items.slice(0, 2000);
  await saveStore(store);
  return payload;
}

export async function getRemixPayload(code: string): Promise<RemixPayload | null> {
  const normalized = code.trim().toLowerCase();
  if (!normalized) return null;
  const store = await loadStore();
  return (
    store.items.find((item) => item.code.toLowerCase() === normalized) ?? null
  );
}
