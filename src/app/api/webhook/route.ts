import { NextResponse } from 'next/server';
import { claimPendingPaymentByOrderHint } from '@/lib/script-payments';
import { extractPaymentAmount, extractSmsText } from '@/lib/sms-payment-parse';
import { isCheckoutAmountRange } from '@/lib/upi-payment';
import { guardRateLimit } from '@/lib/security/api-guard';
import { secretsEqual } from '@/lib/security/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function webhookAuthorized(req: Request): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET?.trim();
  // Never allow open webhooks in production
  if (!secret) return false;

  const url = new URL(req.url);
  const fromQuery = url.searchParams.get('secret') || url.searchParams.get('token');
  const fromHeader =
    req.headers.get('x-payment-webhook-secret') ||
    req.headers.get('x-webhook-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  return secretsEqual(fromQuery, secret) || secretsEqual(fromHeader, secret);
}

/**
 * SMS forwarder webhook — matches exact decimal (e.g. 249.12) to pending order.
 * Phone → POST /api/webhook?secret=YOUR_SECRET
 */
export async function POST(request: Request) {
  const limited = guardRateLimit(request, 'payment-webhook-sms', 60, 60_000);
  if (limited) return limited;

  if (!webhookAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized webhook.' }, { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let body: unknown = {};

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    } else {
      const raw = await request.text();
      try {
        body = JSON.parse(raw);
      } catch {
        body = { message: raw };
      }
    }

    const smsText = extractSmsText(body);
    console.log('[webhook/sms] Received:', smsText.slice(0, 400));

    if (!smsText) {
      return NextResponse.json({ success: true, matched: false, reason: 'empty' });
    }

    const amount = extractPaymentAmount(smsText);
    if (amount == null) {
      return NextResponse.json({
        success: true,
        matched: false,
        reason: 'no_amount',
        message: 'No matching amount found in SMS',
      });
    }

    console.log('[webhook/sms] Matched decimal amount:', amount);

    if (!isCheckoutAmountRange(amount)) {
      return NextResponse.json({
        success: true,
        matched: false,
        reason: 'amount_out_of_range',
        amount,
      });
    }

    const claimed = await claimPendingPaymentByOrderHint(smsText, amount, smsText.slice(0, 180));
    if (!claimed) {
      return NextResponse.json({
        success: true,
        matched: false,
        reason: 'no_pending_order',
        message: 'Amount matched but no pending order found',
        amount,
      });
    }

    console.log(`[webhook/sms] Order ${claimed.id} verified and unlocked`);
    return NextResponse.json({
      success: true,
      matched: true,
      orderId: claimed.id,
      amount,
      status: 'paid',
    });
  } catch (error) {
    console.error('[webhook/sms] error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: '/api/webhook',
    usage:
      'POST SMS as { message | text | body }. Auth via ?secret= or x-payment-webhook-secret header.',
  });
}
