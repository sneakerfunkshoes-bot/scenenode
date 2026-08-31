import type { CanonicalEffect, LibraryMatch } from './types';
import { EFFECT_LIBRARY } from './catalog';

const WEAK_ALONE = new Set([
  'zoom',
  'scale',
  'blur',
  'flash',
  'shake',
  'cut',
  'pan',
  'spin',
  'glow',
  'text',
  'overlay',
  'rotation',
  'rotate',
]);

function haystack(parts: Array<string | undefined | null>): string {
  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/[_-]+/g, ' ');
}

function clueHits(entry: CanonicalEffect, text: string): { hits: string[]; score: number } {
  const hits: string[] = [];
  let score = 0;

  if (text.includes(entry.id.toLowerCase())) {
    hits.push(entry.id);
    score += 48;
  }

  const names = [entry.canonicalName, ...entry.aliases, ...entry.detectionKeywords];
  for (const kw of names) {
    const k = kw.toLowerCase().trim();
    if (k.length < 4) continue;
    if (!text.includes(k)) continue;
    hits.push(kw);
    const weak = WEAK_ALONE.has(k);
    score += weak ? 4 : Math.min(28, 6 + k.length);
  }

  for (const sig of entry.visualSignatures) {
    const tokens = sig
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 3);
    const matched = tokens.filter((t) => text.includes(t));
    if (matched.length >= Math.min(2, tokens.length)) {
      hits.push(sig);
      score += 10;
    }
  }

  return { hits: Array.from(new Set(hits)), score };
}

export function matchLibraryText(
  text: string,
  preferredType?: CanonicalEffect['type']
): LibraryMatch | null {
  const hay = haystack([text]);
  if (!hay.trim()) return null;

  let best: LibraryMatch | null = null;
  for (const entry of EFFECT_LIBRARY) {
    const { hits, score: base } = clueHits(entry, hay);
    if (!hits.length) continue;
    let score = base;
    if (preferredType && entry.type === preferredType) score += 8;
    if (entry.type === 'compound') {
      const needed = Math.max(2, entry.combinations.length || 2);
      if (hits.length < needed) score -= 12;
      else score += 14;
    }
    const exact = hits.length >= entry.minVisualClues || hits.some((h) => h === entry.id);
    if (!best || score > best.score) {
      best = { entry, score, clueHits: hits, exact };
    }
  }
  if (!best || best.score < 12) return null;
  return best;
}

export function matchLibraryId(id?: string | null): CanonicalEffect | undefined {
  if (!id) return undefined;
  const key = id.trim().toUpperCase();
  return EFFECT_LIBRARY.find((e) => e.id.toUpperCase() === key);
}

export function matchLayersToLibrary(layerNames: string[]): LibraryMatch[] {
  const seen = new Set<string>();
  const out: LibraryMatch[] = [];
  for (const name of layerNames) {
    const m = matchLibraryText(name);
    if (!m || seen.has(m.entry.id)) continue;
    seen.add(m.entry.id);
    out.push(m);
  }
  return out.sort((a, b) => b.score - a.score);
}

export function detectCompoundFromIds(ids: string[]): CanonicalEffect | undefined {
  const set = new Set(ids.filter(Boolean));
  if (set.size < 2) return undefined;
  let best: CanonicalEffect | undefined;
  for (const entry of EFFECT_LIBRARY) {
    if (entry.type !== 'compound' || entry.combinations.length < 2) continue;
    if (!entry.combinations.every((id) => set.has(id))) continue;
    if (!best || entry.combinations.length > best.combinations.length) best = entry;
  }
  return best;
}
