import { NextResponse } from 'next/server';
import { canIngestTelemetry, canAccessCommandRead } from '@/lib/command-center/auth';
import { normalizeProjectName } from '@/lib/command-center/fleet';
import { ingestTelemetryEvent, listTelemetryEvents } from '@/lib/telemetry';
import { guardRateLimit, MAX_JSON_BODY_BYTES, rejectOversizedBody } from '@/lib/security/api-guard';
import type { TelemetryEvent } from '@/types/growth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Canonical fleet ingest.
 *
 * POST JSON:
 * {
 *   "project_name": "scenenode" | "script_marketplace" | "clipping_engine" | "pune_student_app",
 *   "event_type": "analyze_completed" | "revenue" | "post_dispatched" | "referral" | "heartbeat" | "error" | ...,
 *   "timestamp": "2026-09-10T06:43:00.000Z",   // optional
 *   "metrics": { "revenue_inr": 249, "active_users": 12, "count": 1 },
 *   "meta": { "order_id": "..." }
 * }
 *
 * Auth: header `x-ops-secret: $MASTER_OPS_WEBHOOK_SECRET`
 */
export async function POST(req: Request) {
  const limited = guardRateLimit(req, 'telemetry', 120, 60_000);
  if (limited) return limited;

  const oversized = rejectOversizedBody(req, MAX_JSON_BODY_BYTES);
  if (oversized) return oversized;

  if (!canIngestTelemetry(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<TelemetryEvent> & {
      project?: string;
      type?: string;
    };

    const eventType = String(body.event_type || body.type || '').trim();
    if (!eventType) {
      return NextResponse.json({ error: 'event_type is required.' }, { status: 400 });
    }

    const event = await ingestTelemetryEvent({
      id: typeof body.id === 'string' ? body.id : undefined,
      project_name: normalizeProjectName(body.project_name || body.project),
      event_type: eventType,
      timestamp: typeof body.timestamp === 'string' ? body.timestamp : new Date().toISOString(),
      metrics:
        body.metrics && typeof body.metrics === 'object' && !Array.isArray(body.metrics)
          ? body.metrics
          : undefined,
      meta:
        body.meta && typeof body.meta === 'object' && !Array.isArray(body.meta)
          ? body.meta
          : undefined,
    });

    return NextResponse.json({ ok: true, event });
  } catch (err) {
    console.error('[telemetry]', err);
    return NextResponse.json({ error: 'Failed to ingest event.' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  if (!canAccessCommandRead(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const limit = Number(new URL(req.url).searchParams.get('limit') ?? 80);
  const events = await listTelemetryEvents(
    Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 400) : 80
  );
  return NextResponse.json({ events });
}
