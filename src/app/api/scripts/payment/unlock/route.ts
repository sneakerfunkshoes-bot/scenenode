import { NextResponse } from 'next/server';
import { getPaymentById } from '@/lib/script-payments';
import {
  BUNDLE_COOKIE,
  DOWNLOAD_COOKIE,
  createDownloadToken,
  downloadCookieOptions,
  getPaymentSessionId,
  hasBundleAccess,
  hasDownloadAccess,
} from '@/lib/scripts-download-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const product = new URL(req.url).searchParams.get('product');
  const wantBundle = product === 'scripts';

  if (wantBundle ? hasBundleAccess(req) : hasDownloadAccess(req)) {
    return NextResponse.json({ unlocked: true, status: 'paid' });
  }

  const paymentId = getPaymentSessionId(req);
  if (!paymentId) {
    return NextResponse.json({ unlocked: false, status: 'none' });
  }

  const payment = await getPaymentById(paymentId);
  if (!payment || payment.status !== 'paid') {
    return NextResponse.json({
      unlocked: false,
      status: payment?.status ?? 'none',
    });
  }

  const isBundle = payment.product === 'scripts';
  if (wantBundle && !isBundle) {
    return NextResponse.json({ unlocked: false, status: 'none' });
  }

  const token = createDownloadToken(payment.id, isBundle ? 'bundle' : 'download');
  if (!token) {
    return NextResponse.json({ error: 'Download unlock unavailable.' }, { status: 503 });
  }

  const res = NextResponse.json({ unlocked: true, status: 'paid', product: payment.product });
  res.cookies.set(
    isBundle ? BUNDLE_COOKIE : DOWNLOAD_COOKIE,
    token,
    downloadCookieOptions()
  );
  return res;
}
