import 'server-only';
import { UPI_PAYEE_ID, UPI_PAYEE_NAME } from '@/lib/upi-config.server';
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

export function getUpiPayeeId(): string {
  return process.env.UPI_PAYEE_ID?.trim() || UPI_PAYEE_ID;
}

export function getUpiPayeeName(): string {
  return process.env.UPI_PAYEE_NAME?.trim() || UPI_PAYEE_NAME;
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
