import { NextResponse } from 'next/server';
import {
  getPaymentById,
  getPaymentByRazorpayOrderId,
  markPaymentPaid,
} from '@/lib/script-payments';
import { verifyRazorpaySignature } from '@/lib/razorpay-server';
import {
  BUNDLE_COOKIE,
  DOWNLOAD_COOKIE,
  PAYMENT_SESSION_COOKIE,
  createDownloadToken,
  downloadCookieOptions,
  paymentSessionCookieOptions,
} from '@/lib/scripts-download-auth';
import { creditResellerSale } from '@/lib/reseller-store';
import { emitTelemetry } from '@/lib/telemetry';
import { PLATFORM_SHARE_INR, RESELLER_COMMISSION_INR } from '@/lib/script-catalog';

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

    const wasUnpaid = record.status !== 'paid';
    if (wasUnpaid) {
      record = await markPaymentPaid(record.id, paymentId);
    }

    if (!record) {
      return NextResponse.json({ error: 'Could not mark payment paid.' }, { status: 500 });
    }

    const isBundle = record.product === 'scripts';
    const token = createDownloadToken(record.id, isBundle ? 'bundle' : 'download');
    if (!token) {
      return NextResponse.json({ error: 'Unlock unavailable.' }, { status: 503 });
    }

    if (wasUnpaid && isBundle && record.referralCode) {
      const sale = await creditResellerSale({
        code: record.referralCode,
        paymentId: record.id,
      });
      if (sale) {
        await emitTelemetry('script_resell_completed', {
          payment_id: record.id,
          reseller_code: sale.code,
          commission_inr: RESELLER_COMMISSION_INR,
          platform_share_inr: PLATFORM_SHARE_INR,
        });
      }
    } else if (wasUnpaid && isBundle) {
      await emitTelemetry('script_sale_completed', {
        payment_id: record.id,
        amount_inr: record.amount,
      });
    }

    const res = NextResponse.json({
      unlocked: true,
      status: 'paid',
      paymentId: record.id,
      product: record.product ?? 'deconstruct',
    });
    res.cookies.set(
      isBundle ? BUNDLE_COOKIE : DOWNLOAD_COOKIE,
      token,
      downloadCookieOptions()
    );
    res.cookies.set(PAYMENT_SESSION_COOKIE, record.id, paymentSessionCookieOptions());
    return res;
  } catch (err) {
    console.error('[razorpay/verify]', err);
    return NextResponse.json({ error: 'Payment verification failed.' }, { status: 500 });
  }
}
