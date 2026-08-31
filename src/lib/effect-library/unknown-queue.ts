import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { UnknownVisual } from './types';

const FILE = path.join(process.cwd(), '.cache', 'unknown-effects.json');
const MAX = 200;

async function load(): Promise<UnknownVisual[]> {
  try {
    const raw = await readFile(FILE, 'utf8');
    const parsed = JSON.parse(raw) as UnknownVisual[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function save(items: UnknownVisual[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(items.slice(0, MAX), null, 2));
}

export async function enqueueUnknownVisual(
  item: Omit<UnknownVisual, 'id' | 'at'>
): Promise<UnknownVisual> {
  const row: UnknownVisual = {
    ...item,
    id: `unk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
  };
  const all = await load();
  const dup = all.find(
    (x) =>
      x.description.toLowerCase() === row.description.toLowerCase() &&
      Math.abs(x.timestamp - item.timestamp) < 0.2
  );
  if (dup) return dup;
  all.unshift(row);
  await save(all);
  return row;
}

export async function listUnknownVisuals(): Promise<UnknownVisual[]> {
  return load();
}
