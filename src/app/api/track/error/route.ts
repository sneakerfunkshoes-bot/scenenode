import { NextResponse } from 'next/server';
import { recordError } from '@/lib/usage-stats';
import { guardRateLimit, MAX_JSON_BODY_BYTES, rejectOversizedBody } from '@/lib/security/api-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const limited = guardRateLimit(req, 'track-error', 30, 60_000);
  if (limited) return limited;

  const oversized = rejectOversizedBody(req, MAX_JSON_BODY_BYTES);
  if (oversized) return oversized;

  try {
    const body = (await req.json()) as {
      scope?: string;
      message?: string;
      path?: string;
    };
    const scope = String(body.scope || 'client').slice(0, 64);
    const message = String(body.message || 'Unknown client error').slice(0, 500);
    const path = body.path ? String(body.path).slice(0, 200) : '';
    await recordError(scope, path ? `${message} @ ${path}` : message);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
