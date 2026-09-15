import { mkdir, readFile, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import path from 'path';
import { getCacheDir } from '@/lib/cache-dir';
import { normalizeProjectName } from '@/lib/command-center/fleet';
import type { TelemetryEvent } from '@/types/growth';

const EVENTS_FILE = path.join(getCacheDir(), 'ops-telemetry.json');
const MAX_EVENTS = 800;

interface TelemetryStore {
  events: TelemetryEvent[];
}

function newEventId(): string {
  return `tel_${randomUUID().slice(0, 12)}`;
}

async function loadStore(): Promise<TelemetryStore> {
  try {
    const raw = await readFile(EVENTS_FILE, 'utf8');
    const parsed = JSON.parse(raw) as TelemetryStore;
    return { events: Array.isArray(parsed.events) ? parsed.events : [] };
  } catch {
    return { events: [] };
  }
}

async function saveStore(store: TelemetryStore): Promise<void> {
  await mkdir(path.dirname(EVENTS_FILE), { recursive: true });
  await writeFile(EVENTS_FILE, JSON.stringify(store, null, 2), 'utf8');
}

export function buildTelemetryEvent(
  eventType: string,
  metrics?: Record<string, unknown>,
  meta?: Record<string, unknown>,
  projectName = 'scenenode'
): TelemetryEvent {
  return {
    id: newEventId(),
    project_name: normalizeProjectName(projectName),
    event_type: eventType.trim().slice(0, 80),
    timestamp: new Date().toISOString(),
    metrics,
    meta,
  };
}

function isSelfTelemetryUrl(url: string): boolean {
  try {
    const target = new URL(url);
    const pathName = target.pathname.replace(/\/$/, '');
    if (pathName !== '/api/telemetry') return false;

    const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (site) {
      try {
        if (new URL(site).origin === target.origin) return true;
      } catch {
        /* ignore */
      }
    }

    const vercel = process.env.VERCEL_URL?.trim();
    if (vercel && target.host === vercel.replace(/^https?:\/\//, '')) return true;

    return target.hostname === 'localhost' || target.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

async function forwardToMaster(event: TelemetryEvent): Promise<void> {
  const webhook = process.env.MASTER_OPS_WEBHOOK_URL?.trim();
  if (!webhook || isSelfTelemetryUrl(webhook)) return;

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.MASTER_OPS_WEBHOOK_SECRET
          ? { 'x-ops-secret': process.env.MASTER_OPS_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify(event),
    });
  } catch (err) {
    console.error('[telemetry] webhook failed', err);
  }
}

/** Persist a fully-formed event. Does not re-forward (this node is the sink). */
export async function ingestTelemetryEvent(event: TelemetryEvent): Promise<TelemetryEvent> {
  const stored: TelemetryEvent = {
    id: event.id || newEventId(),
    project_name: normalizeProjectName(event.project_name),
    event_type: String(event.event_type || 'unknown').trim().slice(0, 80) || 'unknown',
    timestamp: event.timestamp || new Date().toISOString(),
    metrics: event.metrics,
    meta: event.meta,
  };

  const store = await loadStore();
  store.events.unshift(stored);
  if (store.events.length > MAX_EVENTS) store.events = store.events.slice(0, MAX_EVENTS);
  await saveStore(store);
  return stored;
}

/** Persist locally + optionally forward to an external master ops webhook. */
export async function emitTelemetry(
  eventType: string,
  metrics?: Record<string, unknown>,
  meta?: Record<string, unknown>,
  projectName = 'scenenode'
): Promise<TelemetryEvent> {
  const event = buildTelemetryEvent(eventType, metrics, meta, projectName);
  await ingestTelemetryEvent(event);
  await forwardToMaster(event);
  return event;
}

export async function listTelemetryEvents(limit = 40): Promise<TelemetryEvent[]> {
  const store = await loadStore();
  const cap = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), MAX_EVENTS) : 40;
  return store.events.slice(0, cap);
}
