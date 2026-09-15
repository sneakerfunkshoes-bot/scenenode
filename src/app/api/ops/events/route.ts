import { NextResponse } from 'next/server';
import { canAccessCommandRead, canIngestTelemetry } from '@/lib/command-center/auth';
import { ingestTelemetryEvent, listTelemetryEvents } from '@/lib/telemetry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** @deprecated Prefer GET /api/telemetry and GET /api/command/summary */
export async function GET(req: Request) {
  if (!canAccessCommandRead(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = Number(new URL(req.url).searchParams.get('limit') ?? 40);
  const events = await listTelemetryEvents(
    Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 40
  );
  return NextResponse.json({ events });
}

/** @deprecated Prefer POST /api/telemetry */
export async function POST(req: Request) {
  if (!canIngestTelemetry(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      project_name?: string;
      event_type?: string;
      metrics?: Record<string, unknown>;
      meta?: Record<string, unknown>;
    };
    if (!body.event_type?.trim()) {
      return NextResponse.json({ error: 'event_type required' }, { status: 400 });
    }
    const event = await ingestTelemetryEvent({
      project_name: body.project_name || 'scenenode',
      event_type: body.event_type.trim(),
      timestamp: new Date().toISOString(),
      metrics: body.metrics,
      meta: body.meta,
    });
    return NextResponse.json({ ok: true, event });
  } catch (err) {
    console.error('[ops/events]', err);
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}
