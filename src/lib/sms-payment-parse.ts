import { UPI_AMOUNT_INR } from '@/lib/upi-amounts';

function checkoutPrefix(): string {
  return String(UPI_AMOUNT_INR);
}

/** Extract INR amount from bank/UPI credit SMS text. */
export function extractPaymentAmount(smsText: string): number | null {
  const base = checkoutPrefix();
  const checkoutPattern = new RegExp(`(?:rs\\.?|inr|₹)\\s*(${base}\\.[0-9]{2})`, 'i');
  const checkoutMatch = smsText.match(checkoutPattern);
  if (checkoutMatch?.[1]) {
    return Number(checkoutMatch[1]);
  }

  const barePattern = new RegExp(`\\b(${base}\\.[0-9]{2})\\b`);
  const bareCheckout = smsText.match(barePattern);
  if (bareCheckout?.[1] && /credited|received|upi|deposited|payment/i.test(smsText)) {
    return Number(bareCheckout[1]);
  }

  const patterns = [
    /(?:rs\.?|inr|₹)\s*([0-9]+(?:\.[0-9]{1,2})?)/i,
    /(?:credited|received|paid|debited)\s+(?:with\s+)?(?:rs\.?|inr|₹)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i,
    /([0-9]+(?:\.[0-9]{1,2})?)\s*(?:rs\.?|inr)/i,
  ];

  for (const pattern of patterns) {
    const match = smsText.match(pattern);
    if (match?.[1]) {
      const amount = Number(match[1]);
      if (Number.isFinite(amount) && amount > 0) return amount;
    }
  }

  return null;
}

export function extractSmsText(body: unknown): string {
  if (!body || typeof body !== 'object') {
    return typeof body === 'string' ? body : '';
  }

  const data = body as Record<string, unknown>;
  const candidates = [
    data.message,
    data.text,
    data.body,
    data.sms,
    data.content,
    data.msg,
    data.sender,
    typeof data.data === 'string' ? data.data : null,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }

  try {
    return JSON.stringify(body);
  } catch {
    return '';
  }
}

export function extractSmsSender(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const data = body as Record<string, unknown>;
  const sender = data.sender ?? data.from;
  return typeof sender === 'string' ? sender : undefined;
}
