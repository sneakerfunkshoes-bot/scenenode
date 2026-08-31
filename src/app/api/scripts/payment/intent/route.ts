import { NextResponse } from 'next/server';
import { getPaymentById } from '@/lib/script-payments';
import { buildUpiPaymentUri } from '@/lib/upi-payment';
import { getPaymentSessionId } from '@/lib/scripts-download-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Redirects to the UPI deep link without putting the VPA in client HTML/JSON.
 * The payee id only appears in the redirect Location (and inside the QR image).
 */
export async function GET(req: Request) {
  try {
    const paymentId = getPaymentSessionId(req);
    if (!paymentId) {
      return NextResponse.json({ error: 'No payment session.' }, { status: 401 });
    }

    const payment = await getPaymentById(paymentId);
    if (!payment || payment.status === 'rejected') {
      return NextResponse.json({ error: 'Payment session not found.' }, { status: 404 });
    }

    const upiUri = buildUpiPaymentUri(payment.id, payment.amount);
    // Custom scheme — avoid NextResponse.redirect URL validation issues
    return new NextResponse(null, {
      status: 302,
      headers: { Location: upiUri },
    });
  } catch {
    return NextResponse.json({ error: 'Could not open UPI.' }, { status: 500 });
  }
}
