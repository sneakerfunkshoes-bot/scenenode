import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/security/admin-auth';
import { getAdminSummary } from '@/lib/usage-stats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const stats = await getAdminSummary();
  return NextResponse.json(stats);
}
