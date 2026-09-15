'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { payWithRazorpay } from '@/lib/razorpay-checkout';
import {
  MIN_PAYOUT_INR,
  RESELLER_COMMISSION_INR,
} from '@/lib/script-catalog';

const TIMER_DURATION = 10 * 60 * 1000; // 10 minutes

const BUYERS = [
  { name: 'Rahul Sharma', location: 'Maharashtra' },
  { name: 'Priya Patel', location: 'Gujarat' },
  { name: 'Amit Verma', location: 'Delhi' },
  { name: 'Sneha Iyer', location: 'Karnataka' },
  { name: 'Arjun Reddy', location: 'Telangana' },
  { name: 'Ananya Das', location: 'West Bengal' },
  { name: 'Rohan Nair', location: 'Kerala' },
  { name: 'Neha Gupta', location: 'Uttar Pradesh' },
  { name: 'Karan Malhotra', location: 'Punjab' },
  { name: 'Divya Rao', location: 'Tamil Nadu' }
];

export default function DownloadPage() {
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_DURATION);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [currentBuyerIndex, setCurrentBuyerIndex] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let expiryTime = localStorage.getItem('scenenode_discount_expiry');
    const now = Date.now();

    if (!expiryTime) {
      const newExpiry = now + TIMER_DURATION;
      localStorage.setItem('scenenode_discount_expiry', newExpiry.toString());
      expiryTime = newExpiry.toString();
    }

    const expiryMs = parseInt(expiryTime, 10);
    const remaining = expiryMs - now;

    if (remaining <= 0) {
      setIsExpired(true);
      setTimeLeft(0);
    } else {
      setTimeLeft(remaining);
    }

    const interval = setInterval(() => {
      const currentNow = Date.now();
      const currentRemaining = expiryMs - currentNow;

      if (currentRemaining <= 0) {
        setIsExpired(true);
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(currentRemaining);
      }
    }, 1000);

    void fetch('/api/scripts/payment/status?product=scripts', {
      cache: 'no-store',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data: { unlocked?: boolean }) => {
        if (data.unlocked) setUnlocked(true);
      })
      .catch(() => {});

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const tickerInterval = setInterval(() => {
      setCurrentBuyerIndex((prevIndex) => (prevIndex + 1) % BUYERS.length);
    }, 9000);

    return () => clearInterval(tickerInterval);
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

  const minutes = Math.floor((timeLeft / 1000) / 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);
  const activeBuyer = BUYERS[currentBuyerIndex];

  const salePrice = 249;
  const expiredPrice = 499;
  const currentPrice = isExpired ? expiredPrice : salePrice;

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white font-sans flex flex-col items-center justify-between p-6">
      {/* Background Accent Layer - Minimalist Gray/White Grid */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-20 md:px-12 flex flex-col md:flex-row items-center gap-12">
        {/* Product Visual (Left Side) */}
        <div className="w-full md:w-1/2 flex justify-center">
           <div className="relative group">
              <div className="absolute -inset-1 bg-zinc-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl">
                <div className="aspect-video w-full max-w-md rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden">
                   <img
                    src="/images/panel.png"
                    alt="SceneNode After Effects"
                    className="object-cover w-full h-full opacity-90"
                   />
                </div>
                <div className="mt-4 text-center">
                   <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Professional Suite</p>
                </div>
              </div>
           </div>
        </div>

        {/* Sales Content (Right Side) */}
        <div className="w-full md:w-1/2 space-y-8 text-center md:text-left">
          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              SCENENODE • AFTER EFFECTS
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl leading-tight">
              Scripts
            </h1>

            {/* Product Descriptions */}
            <div className="space-y-6 text-zinc-400 text-sm leading-relaxed">
              <div className="space-y-2">
                <h3 className="text-white font-bold text-base">SceneNode Auto Edit</h3>
                <p>Stop wasting hours manually slicing raw footage frame by frame to match your project's tempo. This powerful automation script instantly analyzes your visual pacing and structures your clips into a seamless rhythm. It cuts down hours of tedious timeline assembly into a single click of execution.</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-bold text-base">SceneNode Beat Mark</h3>
                <p>Ditch the exhausting process of scrubbing through audio tracks and listening closely to place manual markers one by one. This script instantly scans your music file and snaps timeline markers directly to audio transients and beats. It guarantees pinpoint rhythm synchronization for every cut instantly.</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-bold text-base">SceneNode Vault</h3>
                <p>Stop digging through cluttered folders or rebuilding complex custom animations from scratch for every new project. This lightning-fast preset vault stores and applies your go-to design assets, effects, and styles instantly. It supercharges your daily editing workflow and keeps your creative momentum flowing without interruptions.</p>
              </div>
            </div>

            <p className="text-zinc-500 text-xs italic pt-4">
              Complete .zip of SceneNode Auto Edit, Beat Mark, and Vault.
              One payment unlocks instant download for this browser.
            </p>
          </div>

          {/* Pricing Section */}
          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="flex items-baseline gap-2">
              {!isExpired && !unlocked && <s className="text-zinc-600 text-xl">₹{expiredPrice}</s>}
              <span className="text-4xl font-black text-white">₹{currentPrice}</span>
            </div>
            {!isExpired && !unlocked && (
              <span className="bg-zinc-100 text-black text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter">
                50% OFF
              </span>
            )}
            {isExpired && !unlocked && (
              <span className="bg-zinc-800 text-zinc-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter">
                Sale Ended
              </span>
            )}
          </div>

          {/* Action Area */}
          <div className="flex flex-col items-center md:items-start space-y-6">
            {!unlocked && !isExpired && (
              <div className="flex flex-col items-center space-y-2 py-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Special Discount Expires In:
                </span>
                <span className="font-mono text-3xl font-bold text-white tabular-nums">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
              </div>
            )}

            {unlocked ? (
              <a
                href="/api/scripts/download"
                className="inline-flex w-full md:w-auto justify-center rounded-full bg-white px-8 py-4 text-sm font-bold text-black transition hover:bg-zinc-200 shadow-lg shadow-white/10"
              >
                Download SceneNode-AE-Scripts.zip
              </a>
            ) : (
              <button
                type="button"
                onClick={() => void buy()}
                disabled={busy}
                className="inline-flex w-full md:w-auto justify-center rounded-full bg-white px-8 py-4 text-sm font-bold text-black transition hover:bg-zinc-200 disabled:opacity-50 shadow-lg shadow-white/10"
              >
                {busy ? 'Opening checkout...' : `Pay ₹${currentPrice} with Razorpay`}
              </button>
            )}
          </div>

          {error && <p className="text-sm text-red-400 font-medium">{error}</p>}
        </div>
      </div>

      {/* Live Purchase Social Proof Ticker */}
      <div className="relative z-10 w-full max-w-xl bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 text-center my-6">
        <p className="text-xs text-zinc-400 animate-pulse">
          🔥 <span className="font-semibold text-white">{activeBuyer.name}</span> from <span className="font-semibold text-white">{activeBuyer.location}</span> just secured the scripts!
        </p>
      </div>

      {/* Footer / Reseller link */}
      <footer className="relative z-10 mt-20 pb-24 text-center px-6">
        <div className="space-y-4">
           <Link href="/dashboard/reseller" className="text-zinc-400 font-semibold hover:text-white transition-colors text-xs underline underline-offset-4">
             Refer and earn. Open dashboard
           </Link>
        </div>
      </footer>
    </main>
  );
}
