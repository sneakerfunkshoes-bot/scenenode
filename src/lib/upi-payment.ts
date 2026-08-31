import 'server-only';
import {
  formatInrAmount,
  UPI_AMOUNT_INR,
  UPI_AMOUNT_MAX,
  UPI_AMOUNT_MIN,
  amountsEqual,
  isCheckoutAmountRange,
  pickUniqueCheckoutAmount,
} from '@/lib/upi-amounts';

export {
  UPI_AMOUNT_INR,
  UPI_AMOUNT_MAX,
  UPI_AMOUNT_MIN,
  amountsEqual,
  formatInrAmount,
  isCheckoutAmountRange,
  pickUniqueCheckoutAmount,
};

/** Server-only. Never expose via NEXT_PUBLIC_* or client responses. */
function getUpiPayeeId(): string {
  const id = process.env.UPI_PAYEE_ID?.trim();
  if (!id) {
    throw new Error('UPI_PAYEE_ID is not configured.');
  }
  return id;
}

function getUpiPayeeName(): string {
  return process.env.UPI_PAYEE_NAME?.trim() || 'scenenode';
}

/** Builds the UPI deep link. Call only from server code. */
export function buildUpiPaymentUri(
  orderId: string,
  amount: number,
  note = 'SceneNode AE Scripts'
): string {
  const params = new URLSearchParams({
    pa: getUpiPayeeId(),
    pn: getUpiPayeeName(),
    am: formatInrAmount(amount),
    cu: 'INR',
    tr: orderId,
    tn: note,
  });

  return `upi://pay?${params.toString()}`;
}
