import { NextResponse } from 'next/server';
import { canAccessCommandRead } from '@/lib/command-center/auth';
import { refreshBriefing } from '@/lib/command-center/briefing';
import { buildCommandCenterSummary } from '@/lib/command-center/summary';
import { guardRateLimit } from '@/lib/security/api-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const limited = guardRateLimit(req, 'command-briefing', 8, 60_000);
  if (limited) return limited;

  if (!canAccessCommandRead(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const snapshot = await buildCommandCenterSummary();
    const briefing = await refreshBriefing({
      dailyRevenueInr: snapshot.totals.dailyRevenueInr,
      activeUsers: snapshot.totals.activeUsers,
      postsDispatched: snapshot.totals.postsDispatched,
      fleet: snapshot.fleet,
      formatInr: (n) =>
        new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: n >= 100 ? 0 : 2,
        }).format(n),
    });

    return NextResponse.json({ briefing });
  } catch (err) {
    console.error('[command/briefing]', err);
    return NextResponse.json({ error: 'Failed to generate briefing.' }, { status: 500 });
  }
}
