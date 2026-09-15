'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { payWithRazorpay } from '@/lib/razorpay-checkout';
import {
  MIN_PAYOUT_INR,
  PLATFORM_SHARE_INR,
  RESELLER_COMMISSION_INR,
  SCRIPT_BUNDLE_PRICE_INR,
} from '@/lib/script-catalog';

export default function DownloadScriptsPage() {
  const [busy, setBusy] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetch('/api/scripts/payment/status?product=scripts', {
      cache: 'no-store',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: { unlocked?: boolean }) => {
        if (data.unlocked) setUnlocked(true);
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  const buy = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const paid = await payWithRazorpay({ product: 'scripts' });
      if (paid) setUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#09090B] px-6 py-16 text-white md:px-12">
      <div className="mx-auto max-w-xl space-y-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
          SceneNode · After Effects
        </p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Script bundle — ₹{SCRIPT_BUNDLE_PRICE_INR}
        </h1>
        <p className="text-sm leading-relaxed text-zinc-400">
          Complete .zip of SceneNode Auto Edit, Beat Mark, and Vault (.jsxbin). One payment unlocks
          download for this browser.
        </p>

        <ul className="space-y-2 text-sm text-zinc-400">
          <li>· Selling price ₹{SCRIPT_BUNDLE_PRICE_INR}</li>
          <li>· Reseller commission ₹{RESELLER_COMMISSION_INR} per sale (UPI payout)</li>
          <li>· Platform share ₹{PLATFORM_SHARE_INR}</li>
        </ul>

        {unlocked ? (
          <a
            href="/api/scripts/download"
            className="inline-flex rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-cyan-400"
          >
            Download SceneNode-AE-Scripts.zip
          </a>
        ) : (
          <button
            type="button"
            onClick={() => void buy()}
            disabled={busy}
            className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {busy ? 'Opening checkout…' : `Pay ₹${SCRIPT_BUNDLE_PRICE_INR} with Razorpay`}
          </button>
        )}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <p className="text-xs text-zinc-500">
          Resell this bundle and earn ₹{RESELLER_COMMISSION_INR} per sale. Minimum UPI payout ₹
          {MIN_PAYOUT_INR}.{' '}
          <Link href="/dashboard/reseller" className="text-cyan-400 hover:underline">
            Open reseller dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
