import { NextResponse } from 'next/server';
import { findRecentIncomingByAmount } from '@/lib/incoming-payments';
import { getPaymentById, markPaymentPaid } from '@/lib/script-payments';
import { getPaymentSessionId } from '@/lib/scripts-download-auth';
import { amountsEqual } from '@/lib/upi-amounts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VERIFY_WINDOW_MS = 60_000;

/**
 * Poll endpoint for 30-second UPI verification window.
 * Matches session order against paid status or recent SMS-forwarded credits.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      expectedAmount?: number | string;
    };

    const paymentId = getPaymentSessionId(req);
    if (!paymentId) {
      return NextResponse.json({ success: false, status: 'PENDING', reason: 'no_session' });
    }

    const payment = await getPaymentById(paymentId);
    if (!payment) {
      return NextResponse.json({ success: false, status: 'PENDING', reason: 'no_order' });
    }

    if (payment.status === 'paid') {
      return NextResponse.json({
        success: true,
        status: 'VERIFIED',
        orderId: payment.id,
        amount: payment.amount,
      });
    }

    const expected =
      body.expectedAmount != null
        ? Number(body.expectedAmount)
        : payment.amount;

    if (!Number.isFinite(expected) || !amountsEqual(expected, payment.amount)) {
      return NextResponse.json({
        success: false,
        status: 'PENDING',
        reason: 'amount_mismatch',
      });
    }

    const incoming = await findRecentIncomingByAmount(payment.amount, VERIFY_WINDOW_MS);
    if (incoming) {
      const updated = await markPaymentPaid(payment.id, incoming.message.slice(0, 180));
      if (updated?.status === 'paid') {
        return NextResponse.json({
          success: true,
          status: 'VERIFIED',
          orderId: updated.id,
          amount: updated.amount,
          source: 'sms',
        });
      }
    }

    return NextResponse.json({
      success: false,
      status: 'PENDING',
      orderId: payment.id,
      amount: payment.amount,
    });
  } catch (error) {
    console.error('[verify-payment]', error);
    return NextResponse.json({ error: 'Server verification failed' }, { status: 500 });
  }
}
