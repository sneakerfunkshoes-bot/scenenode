import { NextResponse } from 'next/server';
import { guardRateLimit } from '@/lib/security/api-guard';
import { recordPageView, visitorIdFromRequest } from '@/lib/usage-stats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const limited = guardRateLimit(req, 'track', 30, 60_000);
  if (limited) return limited;

  try {
    const body = (await req.json()) as { path?: string };
    const pagePath = String(body.path ?? '/').slice(0, 200);
    const visitorId = visitorIdFromRequest(req);
    await recordPageView(visitorId, pagePath);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Track failed.' }, { status: 400 });
  }
}
