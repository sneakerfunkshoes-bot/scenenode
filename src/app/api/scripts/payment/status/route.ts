import { NextResponse } from 'next/server';
import { getPaymentById } from '@/lib/script-payments';
import { getPaymentSessionId, hasBundleAccess, hasDownloadAccess } from '@/lib/scripts-download-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const product = new URL(req.url).searchParams.get('product');
  if (product === 'scripts') {
    return NextResponse.json({
      status: hasBundleAccess(req) ? 'paid' : 'none',
      unlocked: hasBundleAccess(req),
    });
  }

  if (hasDownloadAccess(req)) {
    return NextResponse.json({ status: 'paid', unlocked: true });
  }

  const paymentId = getPaymentSessionId(req);
  if (!paymentId) {
    return NextResponse.json({ status: 'none', unlocked: false });
  }

  const payment = await getPaymentById(paymentId);
  if (!payment) {
    return NextResponse.json({ status: 'none', unlocked: false });
  }

  return NextResponse.json({
    orderId: payment.id,
    status: payment.status,
    unlocked: payment.status === 'paid' && payment.product !== 'scripts',
    amount: payment.amount,
    product: payment.product,
  });
}
