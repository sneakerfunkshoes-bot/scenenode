import { NextResponse } from 'next/server';
import {
  getPaymentById,
  getPaymentByRazorpayOrderId,
  markPaymentPaid,
} from '@/lib/script-payments';
import { verifyRazorpaySignature } from '@/lib/razorpay-server';
import {
  DOWNLOAD_COOKIE,
  PAYMENT_SESSION_COOKIE,
  createDownloadToken,
  downloadCookieOptions,
  paymentSessionCookieOptions,
} from '@/lib/scripts-download-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      paymentId?: string;
    };

    const orderId = body.razorpay_order_id?.trim();
    const paymentId = body.razorpay_payment_id?.trim();
    const signature = body.razorpay_signature?.trim();

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: 'Missing Razorpay payment fields.' }, { status: 400 });
    }

    if (!verifyRazorpaySignature({ orderId, paymentId, signature })) {
      return NextResponse.json({ error: 'Invalid payment signature.' }, { status: 400 });
    }

    let record =
      (body.paymentId ? await getPaymentById(body.paymentId) : null) ??
      (await getPaymentByRazorpayOrderId(orderId));

    if (!record) {
      return NextResponse.json({ error: 'Payment session not found.' }, { status: 404 });
    }

    if (record.status !== 'paid') {
      record = await markPaymentPaid(record.id, paymentId);
    }

    if (!record) {
      return NextResponse.json({ error: 'Could not mark payment paid.' }, { status: 500 });
    }

    const token = createDownloadToken(record.id);
    if (!token) {
      return NextResponse.json({ error: 'Unlock unavailable.' }, { status: 503 });
    }

    const res = NextResponse.json({
      unlocked: true,
      status: 'paid',
      paymentId: record.id,
    });
    res.cookies.set(DOWNLOAD_COOKIE, token, downloadCookieOptions());
    res.cookies.set(PAYMENT_SESSION_COOKIE, record.id, paymentSessionCookieOptions());
    return res;
  } catch (err) {
    console.error('[razorpay/verify]', err);
    return NextResponse.json({ error: 'Payment verification failed.' }, { status: 500 });
  }
}
