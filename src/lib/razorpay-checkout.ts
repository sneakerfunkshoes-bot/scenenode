'use client';

import { RAZORPAY_AMOUNT_INR } from '@/lib/upi-amounts';

export { RAZORPAY_AMOUNT_INR };

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
}

let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Razorpay script failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpay = '1';
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Could not load Razorpay checkout.'));
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export async function fetchUnlockStatus(): Promise<boolean> {
  try {
    const res = await fetch('/api/scripts/payment/status', {
      cache: 'no-store',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { unlocked?: boolean; status?: string };
    return Boolean(data.unlocked || data.status === 'paid');
  } catch {
    return false;
  }
}

export async function unlockAfterPayment(): Promise<boolean> {
  const res = await fetch('/api/scripts/payment/unlock', {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { unlocked?: boolean };
  return Boolean(data.unlocked);
}

/**
 * Opens Razorpay Checkout for ₹249. Resolves true when payment is verified + unlocked.
 */
export async function payWithRazorpay(options?: {
  description?: string;
  onDismiss?: () => void;
}): Promise<boolean> {
  await loadRazorpayScript();

  const orderRes = await fetch('/api/razorpay/order', {
    method: 'POST',
    credentials: 'include',
  });
  const orderBody = (await orderRes.json()) as {
    error?: string;
    keyId?: string;
    orderId?: string;
    amount?: number;
    currency?: string;
    paymentId?: string;
  };

  if (!orderRes.ok || !orderBody.keyId || !orderBody.orderId) {
    throw new Error(orderBody.error || 'Could not create Razorpay order.');
  }

  const keyId = orderBody.keyId;
  const orderId = orderBody.orderId;
  const paymentId = orderBody.paymentId;
  const amount = orderBody.amount ?? RAZORPAY_AMOUNT_INR * 100;
  const currency = orderBody.currency || 'INR';

  return new Promise<boolean>((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Razorpay checkout unavailable.'));
      return;
    }

    let settled = false;

    const rzp = new window.Razorpay({
      key: keyId,
      amount,
      currency,
      name: 'SceneNode',
      description: options?.description || `Unlock SceneNode · ₹${RAZORPAY_AMOUNT_INR}`,
      order_id: orderId,
      theme: { color: '#0ea5e9' },
      handler: (response) => {
        void (async () => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentId,
              }),
            });
            const verifyBody = (await verifyRes.json()) as {
              unlocked?: boolean;
              error?: string;
            };
            if (!verifyRes.ok || !verifyBody.unlocked) {
              throw new Error(verifyBody.error || 'Payment verification failed.');
            }
            settled = true;
            resolve(true);
          } catch (err) {
            settled = true;
            reject(err instanceof Error ? err : new Error('Payment verification failed.'));
          }
        })();
      },
      modal: {
        ondismiss: () => {
          options?.onDismiss?.();
          if (!settled) {
            settled = true;
            resolve(false);
          }
        },
      },
    });

    rzp.open();
  });
}

/** If already unlocked, returns true. Otherwise opens Razorpay and unlocks on success. */
export async function ensurePaidAccess(options?: {
  description?: string;
}): Promise<boolean> {
  if (await fetchUnlockStatus()) return true;
  return payWithRazorpay(options);
}
