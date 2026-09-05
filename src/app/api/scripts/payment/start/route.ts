import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { createPaymentSession } from '@/lib/script-payments';
import { buildUpiPaymentUri } from '@/lib/upi-payment';
import { PAYMENT_SESSION_COOKIE, paymentSessionCookieOptions } from '@/lib/scripts-download-auth';
import { visitorIdFromRequest } from '@/lib/usage-stats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const visitorId = visitorIdFromRequest(req);
    const payment = await createPaymentSession(visitorId);
    const upiUri = buildUpiPaymentUri(payment.id, payment.amount);

    // QR is rendered server-side so the VPA never appears in JSON or page HTML.
    const qrDataUrl = await QRCode.toDataURL(upiUri, {
      width: 220,
      margin: 2,
      color: { dark: '#050505', light: '#F8FAFC' },
    });

    const res = NextResponse.json({
      orderId: payment.id,
      paymentId: payment.id,
      amount: payment.amount,
      amountLabel: payment.amount.toFixed(2),
      status: payment.status,
      qrDataUrl,
      intentPath: '/api/scripts/payment/intent',
      currency: 'INR',
    });
    res.cookies.set(PAYMENT_SESSION_COOKIE, payment.id, paymentSessionCookieOptions());
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[payment/start]', err);

    return NextResponse.json({ error: 'Could not start payment session.' }, { status: 500 });
  }
}
