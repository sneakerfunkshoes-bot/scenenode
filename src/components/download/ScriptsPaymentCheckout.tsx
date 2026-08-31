'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Loader2, QrCode } from 'lucide-react';

type PaymentStatus = 'none' | 'pending' | 'paid' | 'rejected';

interface ScriptsPaymentCheckoutProps {
  onUnlocked?: () => void;
  className?: string;
}

export function ScriptsPaymentCheckout({ onUnlocked, className }: ScriptsPaymentCheckoutProps) {
  const [status, setStatus] = useState<PaymentStatus>('none');
  const [exactAmount, setExactAmount] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [intentPath, setIntentPath] = useState('/api/scripts/payment/intent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const unlockIfPaid = useCallback(async () => {
    const res = await fetch('/api/scripts/payment/unlock', {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { unlocked?: boolean };
    return Boolean(data.unlocked);
  }, []);

  const refreshStatus = useCallback(async () => {
    const res = await fetch('/api/scripts/payment/status', {
      cache: 'no-store',
      credentials: 'include',
    });
    if (!res.ok) return;

    const data = (await res.json()) as {
      status?: PaymentStatus;
      unlocked?: boolean;
      orderId?: string;
      amount?: number;
    };

    if (typeof data.amount === 'number') setExactAmount(data.amount.toFixed(2));
    if (data.status) setStatus(data.status);

    if (data.status === 'paid' || data.unlocked) {
      const unlocked = await unlockIfPaid();
      if (unlocked) {
        setStatus('paid');
        onUnlocked?.();
      }
    }
  }, [onUnlocked, unlockIfPaid]);

  const startCheckout = useCallback(async () => {
    if (loading || qrDataUrl) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/scripts/payment/start', {
        method: 'POST',
        credentials: 'include',
      });
      const body = (await res.json()) as {
        error?: string;
        orderId?: string;
        qrDataUrl?: string;
        intentPath?: string;
        amount?: number;
        amountLabel?: string;
      };

      if (!res.ok || !body.qrDataUrl || !body.orderId) {
        throw new Error(body.error || 'Could not start checkout.');
      }

      const label = body.amountLabel || (body.amount != null ? body.amount.toFixed(2) : null);
      setExactAmount(label);
      setQrDataUrl(body.qrDataUrl);
      if (body.intentPath) setIntentPath(body.intentPath);
      setStatus('pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed.');
    } finally {
      setLoading(false);
    }
  }, [loading, qrDataUrl]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (status !== 'pending') return;
    const timer = window.setInterval(() => void refreshStatus(), 2000);
    return () => window.clearInterval(timer);
  }, [status, refreshStatus]);

  if (status === 'paid') {
    return (
      <div className={className}>
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-300">
          Payment confirmed — downloads unlocked.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-sm font-semibold text-zinc-200">Complete your purchase</p>
        <p className="mt-1 text-xs text-zinc-500">
          Pay the exact amount shown. Verification is automatic from your bank SMS.
        </p>

        {!qrDataUrl ? (
          <button
            type="button"
            onClick={() => void startCheckout()}
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
            {loading ? 'Preparing secure checkout…' : 'Start checkout'}
          </button>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="text-center">
              <p className="text-xs text-zinc-500">Pay exactly</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-white">
                ₹{exactAmount}
              </p>
            </div>

            <div className="flex flex-col items-center rounded-xl border border-zinc-800 bg-black/50 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt={`UPI QR for ₹${exactAmount}`}
                width={220}
                height={220}
                className="rounded-lg"
              />
              <p className="mt-3 text-xs text-zinc-500">Scan with any UPI app</p>
            </div>

            <a
              href={intentPath}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              <ExternalLink className="h-4 w-4" />
              Open UPI App & Pay ₹{exactAmount}
            </a>

            <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Waiting for bank confirmation… keep this page open
            </div>
          </div>
        )}

        {error ? <p className="mt-3 text-center text-xs text-red-400">{error}</p> : null}
      </div>
    </div>
  );
}
