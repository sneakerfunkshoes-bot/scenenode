import { NextResponse } from 'next/server';
import { createWithdrawal } from '@/lib/reseller-store';
import { RESELLER_COOKIE, isValidUpiId, MIN_PAYOUT_INR } from '@/lib/script-catalog';
import { readNamedCookie } from '@/lib/scripts-download-auth';
import { emitTelemetry } from '@/lib/telemetry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const code = readNamedCookie(req, RESELLER_COOKIE);
  if (!code) {
    return NextResponse.json({ error: 'Open the reseller dashboard first.' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      upiId?: string;
      upiName?: string;
      amount?: number;
    };
    const upiId = body.upiId?.trim() ?? '';
    const upiName = body.upiName?.trim() ?? '';

    if (!isValidUpiId(upiId)) {
      return NextResponse.json({ error: 'Enter a valid UPI ID (name@bank).' }, { status: 400 });
    }
    if (upiName.length < 2) {
      return NextResponse.json({ error: 'Account name is required.' }, { status: 400 });
    }

    const result = await createWithdrawal({
      code,
      upiId,
      upiName,
      amount: body.amount,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    await emitTelemetry('reseller_withdraw_requested', {
      request_id: result.request.id,
      amount_inr: result.request.amount,
      min_payout: MIN_PAYOUT_INR,
    });

    return NextResponse.json({ ok: true, request: result.request });
  } catch {
    return NextResponse.json({ error: 'Could not submit withdrawal.' }, { status: 500 });
  }
}
