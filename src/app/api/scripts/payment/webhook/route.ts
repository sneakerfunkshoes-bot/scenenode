import { NextResponse } from 'next/server';
import { getPaymentById, markPaymentPaid } from '@/lib/script-payments';
import { guardRateLimit } from '@/lib/security/api-guard';
import { secretsEqual } from '@/lib/security/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function webhookAuthorized(req: Request): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET?.trim();
  if (!secret) return false;

  const header =
    req.headers.get('x-payment-webhook-secret') ||
    req.headers.get('x-webhook-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  return secretsEqual(header, secret);
}

export async function POST(req: Request) {
  const limited = guardRateLimit(req, 'payment-webhook-gateway', 60, 60_000);
  if (limited) return limited;

  if (!webhookAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized webhook.' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      orderId?: string;
      paymentId?: string;
      status?: string;
      reference?: string;
    };

    const orderId = String(body.orderId ?? body.paymentId ?? '').trim();
    const status = String(body.status ?? '').toUpperCase();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required.' }, { status: 400 });
    }

    if (!['SUCCESS', 'PAID', 'COMPLETED'].includes(status)) {
      return NextResponse.json({ error: 'Unsupported status.' }, { status: 400 });
    }

    const payment = await getPaymentById(orderId);
    if (!payment) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const updated = await markPaymentPaid(orderId, body.reference);
    return NextResponse.json({ ok: true, orderId, status: updated?.status ?? 'paid' });
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
