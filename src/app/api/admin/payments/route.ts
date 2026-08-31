import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/security/admin-auth';
import {
  approvePayment,
  listPendingPayments,
  listRecentPayments,
  rejectPayment,
} from '@/lib/script-payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const pending = await listPendingPayments();
  const recent = await listRecentPayments(30);
  return NextResponse.json({ pending, recent });
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { paymentId?: string; action?: 'approve' | 'reject' };
    const paymentId = String(body.paymentId ?? '').trim();
    const action = body.action;

    if (!paymentId || !action) {
      return NextResponse.json({ error: 'paymentId and action are required.' }, { status: 400 });
    }

    const updated =
      action === 'approve'
        ? await approvePayment(paymentId)
        : await rejectPayment(paymentId);

    if (!updated) {
      return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, payment: updated });
  } catch {
    return NextResponse.json({ error: 'Action failed.' }, { status: 500 });
  }
}
