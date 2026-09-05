'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { RAZORPAY_AMOUNT_INR, ensurePaidAccess, fetchUnlockStatus } from '@/lib/razorpay-checkout';

interface ScriptsPaymentCheckoutProps {
  onUnlocked?: () => void;
  className?: string;
}

export function ScriptsPaymentCheckout({ onUnlocked, className }: ScriptsPaymentCheckoutProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const ok = await fetchUnlockStatus();
    if (ok) {
      setUnlocked(true);
      onUnlocked?.();
    }
  }, [onUnlocked]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pay = async () => {
    if (loading || unlocked) return;
    setLoading(true);
    setError('');
    try {
      const ok = await ensurePaidAccess({
        description: `Vault presets · ₹${RAZORPAY_AMOUNT_INR}`,
      });
      if (ok) {
        setUnlocked(true);
        onUnlocked?.();
      } else {
        setError('Payment cancelled. Tap Pay to try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed.');
    } finally {
      setLoading(false);
    }
  };

  if (unlocked) {
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
        <p className="text-center text-sm font-semibold text-zinc-200">Unlock SceneNode Vault</p>
        <p className="mt-1 text-center text-xs text-zinc-500">
          One-time payment unlocks AE presets and inspect analysis.
        </p>

        <div className="mt-4 rounded-lg border border-zinc-800 bg-black/50 p-4 text-center">
          <p className="text-xs text-zinc-500">Amount</p>
          <p className="mt-1 text-3xl font-extrabold text-white">₹{RAZORPAY_AMOUNT_INR}</p>
        </div>

        <button
          type="button"
          onClick={() => void pay()}
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? 'Opening Razorpay…' : `Pay ₹${RAZORPAY_AMOUNT_INR}`}
        </button>

        {error ? <p className="mt-3 text-center text-xs text-red-400">{error}</p> : null}
      </div>
    </div>
  );
}
