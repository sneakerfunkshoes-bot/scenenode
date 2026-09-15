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
  hasBundleAccess,
  hasDownloadAccess,
  paymentSessionCookieOptions,
  readNamedCookie,
} from '@/lib/scripts-download-auth';
import { visitorIdFromRequest } from '@/lib/usage-stats';
import {
  REF_COOKIE,
  SCRIPT_BUNDLE_PRICE_INR,
  SCRIPT_BUNDLE_PRICE_PAISE,
} from '@/lib/script-catalog';
import { getPartner, normalizeResellerCode } from '@/lib/reseller-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      product?: string;
      ref?: string;
    };
    const product = body.product === 'scripts' ? 'scripts' : 'deconstruct';

    if (product === 'deconstruct' && hasDownloadAccess(req)) {
      return NextResponse.json({ unlocked: true, status: 'paid', product });
    }
    if (product === 'scripts' && hasBundleAccess(req)) {
      return NextResponse.json({ unlocked: true, status: 'paid', product });
    }

    const amountInr = product === 'scripts' ? SCRIPT_BUNDLE_PRICE_INR : RAZORPAY_AMOUNT_INR;
    const amountPaise = product === 'scripts' ? SCRIPT_BUNDLE_PRICE_PAISE : RAZORPAY_AMOUNT_PAISE;

    const visitorId = visitorIdFromRequest(req);
    const referralCode = normalizeResellerCode(
      body.ref || readNamedCookie(req, REF_COOKIE)
    );
    const partner = referralCode ? await getPartner(referralCode) : null;
    const attributedCode =
      partner && partner.visitorId !== visitorId ? partner.code : undefined;

    const payment = await createPaymentSession(visitorId, {
      amount: amountInr,
      product,
      referralCode: attributedCode,
    });

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: payment.id.slice(0, 40),
      notes: {
        paymentId: payment.id,
        visitorId,
        product: product === 'scripts' ? 'scenenode_script_bundle' : 'scenenode_deconstruct',
        referralCode: attributedCode || '',
      },
    });

    await attachRazorpayOrderId(payment.id, order.id);

    const res = NextResponse.json({
      keyId: getRazorpayKeyId(),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
      paymentId: payment.id,
      amountInr,
      product,
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
