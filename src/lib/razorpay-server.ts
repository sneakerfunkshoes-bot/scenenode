import 'server-only';
import Razorpay from 'razorpay';
import { createHmac, timingSafeEqual } from 'crypto';
import { RAZORPAY_AMOUNT_INR, RAZORPAY_AMOUNT_PAISE } from '@/lib/upi-amounts';

export { RAZORPAY_AMOUNT_INR, RAZORPAY_AMOUNT_PAISE };

export function getRazorpayKeyId(): string {
  const key =
    process.env.RAZORPAY_KEY_ID?.trim() ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  if (!key) throw new Error('RAZORPAY_KEY_ID is not configured.');
  return key;
}

export function getRazorpayKeySecret(): string {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) throw new Error('RAZORPAY_KEY_SECRET is not configured.');
  return secret;
}

export function getRazorpayClient(): Razorpay {
  return new Razorpay({
    key_id: getRazorpayKeyId(),
    key_secret: getRazorpayKeySecret(),
  });
}

export function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const body = `${params.orderId}|${params.paymentId}`;
  const expected = createHmac('sha256', getRazorpayKeySecret())
    .update(body)
    .digest('hex');

  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(params.signature, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
