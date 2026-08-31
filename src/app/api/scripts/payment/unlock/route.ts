import { NextResponse } from 'next/server';
import { getPaymentById } from '@/lib/script-payments';
import {
  DOWNLOAD_COOKIE,
  createDownloadToken,
  downloadCookieOptions,
  getPaymentSessionId,
  hasDownloadAccess,
} from '@/lib/scripts-download-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (hasDownloadAccess(req)) {
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

  const token = createDownloadToken(payment.id);
  if (!token) {
    return NextResponse.json({ error: 'Download unlock unavailable.' }, { status: 503 });
  }

  const res = NextResponse.json({ unlocked: true, status: 'paid' });
  res.cookies.set(DOWNLOAD_COOKIE, token, downloadCookieOptions());
  return res;
}
