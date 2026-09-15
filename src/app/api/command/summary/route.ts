import { NextResponse } from 'next/server';
import { canAccessCommandRead } from '@/lib/command-center/auth';
import { buildCommandCenterSummary } from '@/lib/command-center/summary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!canAccessCommandRead(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const summary = await buildCommandCenterSummary();
    return NextResponse.json(summary, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('[command/summary]', err);
    return NextResponse.json({ error: 'Failed to load command summary.' }, { status: 500 });
  }
}
