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

      {/* Top Header */}
      <div className="max-w-5xl w-full text-center space-y-2 mt-6 z-10">
        <span className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">SCENENODE • AFTER EFFECTS</span>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Script Bundle</h1>
      </div>

      {/* Main 2-Column High-Conversion Grid Layout */}
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto z-10 items-start">

        {/* LEFT COLUMN: Image, Timer, Pricing, and Instant Pay Button (Zero Friction) */}
        <div className="lg:col-span-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-6 sticky top-6">

          {/* Product Preview Card - Fixed Overlap with auto height & padding */}
          <div className="w-full bg-zinc-800 rounded-xl border border-zinc-700 flex flex-col items-center justify-center p-6 text-center shadow-inner space-y-3 relative overflow-hidden">
            <img
              src="/images/panel.png"
              alt="SceneNode Preview"
              className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
            />
            <div className="relative z-10 space-y-1">
              <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">PRO SUITE</span>
              <h3 className="text-xl font-bold text-white">SceneNode Scripts</h3>
              <p className="text-xs text-zinc-400">Auto Edit • Beat Mark • Vault</p>
            </div>
          </div>

          {/* Timer Banner */}
          {!isExpired && !unlocked && (
            <div className="bg-zinc-800/40 border border-zinc-700 rounded-xl p-3 text-center flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">⚡ Offer Ends In:</span>
              <div className="text-white font-mono font-bold tracking-wider text-base">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
            </div>
          )}
          {isExpired && !unlocked && (
            <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-3 text-center">
              <span className="text-xs text-red-400 font-medium">⚠️ Sale ended. Standard price applied.</span>
            </div>
          )}

          {/* Pricing Area */}
          <div className="flex items-baseline space-x-3">
            {!isExpired && !unlocked && (
              <>
                <span className="text-3xl font-extrabold text-white">₹{currentPrice}</span>
                <span className="text-base text-zinc-500 line-through">₹{expiredPrice}</span>
                <span className="bg-zinc-100 text-black text-xs px-2 py-1 rounded-md font-semibold border border-zinc-200">50% OFF</span>
              </>
            )}
            {(isExpired || unlocked) && (
              <span className="text-3xl font-extrabold text-white">₹{unlocked ? 'Paid' : expiredPrice}</span>
            )}
          </div>

          {/* Action Button - RIGHT UP FRONT */}
          {unlocked ? (
            <a
              href="/api/scripts/download"
              className="w-full block bg-white hover:bg-zinc-200 text-black font-bold py-4 px-6 rounded-xl transition duration-200 shadow-lg shadow-white/10 text-center cursor-pointer text-base"
            >
              Download SceneNode-AE-Scripts.zip
            </a>
          ) : (
            <button
              onClick={() => void buy()}
              disabled={busy}
              className="w-full bg-white hover:bg-zinc-200 text-black font-semibold py-4 px-6 rounded-xl transition duration-200 shadow-lg shadow-white/10 text-center cursor-pointer text-base disabled:opacity-50"
            >
              {busy ? 'Opening checkout...' : `Pay ₹${currentPrice} with Razorpay`}
            </button>
          )}

          {error && <p className="text-center text-sm text-red-400 font-medium">{error}</p>}

          {/* Details list */}
          <div className="border-t border-zinc-800/60 pt-4 space-y-2 text-xs text-zinc-500">
            <div className="flex justify-between"><span>Selling price:</span> <span className="text-zinc-300">{unlocked ? 'Paid' : `₹${currentPrice}`}</span></div>
            <div className="flex justify-between"><span>Reseller commission:</span> <span className="text-zinc-300">₹200 (UPI)</span></div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 space-y-6 backdrop-blur-sm">

            <div className="border-b border-zinc-800/80 pb-3">
              <h2 className="text-xl font-bold tracking-tight text-white">Scripts Overview</h2>
            </div>

            {/* Script 1 */}
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="text-zinc-500">01.</span> SceneNode Auto Edit
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Stop wasting hours manually slicing raw footage frame by frame to match your project's tempo. This powerful automation script instantly analyzes your visual pacing and structures your clips into a seamless rhythm. It cuts down hours of tedious timeline assembly into a single click of execution.
              </p>
            </div>

            <div className="border-t border-zinc-800/60"></div>

            {/* Script 2 */}
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="text-zinc-500">02.</span> SceneNode Beat Mark
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Ditch the exhausting process of scrubbing through audio tracks and listening closely to place manual markers one by one. This script instantly scans your music file and snaps timeline markers directly to audio transients and beats. It guarantees pinpoint rhythm synchronization for every cut instantly.
              </p>
            </div>

            <div className="border-t border-zinc-800/60"></div>

            {/* Script 3 */}
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="text-zinc-500">03.</span> SceneNode Vault
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Stop digging through cluttered folders or rebuilding complex custom animations from scratch for every new project. This lightning-fast preset vault stores and applies your go-to design assets, effects, and styles instantly. It supercharges your daily editing workflow and keeps your creative momentum flowing without interruptions.
              </p>
            </div>

            <div className="border-t border-zinc-800/60 pt-4 text-xs text-zinc-500 italic">
              Complete .zip of SceneNode Auto Edit, Beat Mark, and Vault. One payment unlocks download for this browser instantly.
            </div>
          </div>
        </div>

      </div>

      {/* Live Purchase Social Proof Ticker */}
      <div className="w-full max-w-xl bg-zinc-900/80 border border-zinc-800 rounded-lg p-2.5 text-center z-10 my-4 shadow-lg">
        <p className="text-xs text-zinc-400 animate-pulse">
          🔥 <span className="font-semibold text-white">{activeBuyer.name}</span> from <span className="font-semibold text-white">{activeBuyer.location}</span> just secured the scripts!
        </p>
      </div>

      {/* Footer / Reseller link */}
      <div className="text-center pb-4 z-10">
        <Link href="/dashboard/reseller" className="text-zinc-500 hover:text-white transition-colors text-xs underline underline-offset-4">
          Refer and earn. Open dashboard
        </Link>
      </div>
    </main>
  );
}
