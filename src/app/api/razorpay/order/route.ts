import { NextResponse } from 'next/server';
import {
  attachRazorpayOrderId,
  createPaymentSession,
} from '@/lib/script-payments';
import {
  getRazorpayClient,
  getRazorpayKeyId,
  RAZORPAY_AMOUNT_INR,
  RAZORPAY_AMOUNT_PAISE,
} from '@/lib/razorpay-server';
import {
  PAYMENT_SESSION_COOKIE,
  hasDownloadAccess,
  paymentSessionCookieOptions,
} from '@/lib/scripts-download-auth';
import { visitorIdFromRequest } from '@/lib/usage-stats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    if (hasDownloadAccess(req)) {
      return NextResponse.json({ unlocked: true, status: 'paid' });
    }

    const visitorId = visitorIdFromRequest(req);
    const payment = await createPaymentSession(visitorId, {
      amount: RAZORPAY_AMOUNT_INR,
    });

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: RAZORPAY_AMOUNT_PAISE,
      currency: 'INR',
      receipt: payment.id.slice(0, 40),
      notes: {
        paymentId: payment.id,
        visitorId,
        product: 'scenenode_unlock',
      },
    });

    await attachRazorpayOrderId(payment.id, order.id);

    const res = NextResponse.json({
      keyId: getRazorpayKeyId(),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
      paymentId: payment.id,
      amountInr: RAZORPAY_AMOUNT_INR,
    });
    res.cookies.set(PAYMENT_SESSION_COOKIE, payment.id, paymentSessionCookieOptions());
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[razorpay/order]', err);
    return NextResponse.json(
      {
        error: message.includes('RAZORPAY')
          ? 'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
          : 'Could not create Razorpay order.',
      },
      { status: 500 }
    );
  }
}
