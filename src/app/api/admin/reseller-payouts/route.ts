import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/security/admin-auth';
import { listWithdrawals, setWithdrawalStatus } from '@/lib/reseller-store';
import { emitTelemetry } from '@/lib/telemetry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const requests = await listWithdrawals();
  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { id?: string; action?: 'paid' | 'rejected' };
    const id = body.id?.trim();
    if (!id || (body.action !== 'paid' && body.action !== 'rejected')) {
      return NextResponse.json({ error: 'id and action are required.' }, { status: 400 });
    }

    const updated = await setWithdrawalStatus(id, body.action === 'paid' ? 'PAID' : 'REJECTED');
    if (!updated) {
      return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    }

    await emitTelemetry('reseller_payout_updated', {
      request_id: updated.id,
      status: updated.status,
      amount_inr: updated.amount,
    });

    return NextResponse.json({ ok: true, request: updated });
  } catch {
    return NextResponse.json({ error: 'Action failed.' }, { status: 500 });
  }
}
