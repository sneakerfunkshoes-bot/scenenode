'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { payWithRazorpay } from '@/lib/razorpay-checkout';
import {
  MIN_PAYOUT_INR,
  PLATFORM_SHARE_INR,
  RESELLER_COMMISSION_INR,
  SCRIPT_BUNDLE_PRICE_INR,
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

    // Check payment status on load
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
  const currentPrice = isExpired ? 999 : SCRIPT_BUNDLE_PRICE_INR;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white font-sans flex flex-col items-center justify-between p-6">
      {/* Background Accent Layer */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

      {/* Top Header */}
      <div className="max-w-xl w-full text-center space-y-2 mt-8 z-10">
        <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold">SCENENODE • AFTER EFFECTS</span>
        <h1 className="text-3xl font-bold tracking-tight">Script Bundle</h1>
      </div>

      {/* Main Container */}
      <div className="max-w-xl w-full bg-[#0B132B]/90 border border-cyan-900/40 rounded-2xl p-6 shadow-2xl backdrop-blur-md my-auto space-y-6 z-10">

        {/* Timer Banner */}
        {!isExpired && !unlocked && (
          <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-3 text-center flex items-center justify-between">
            <span className="text-xs text-cyan-300 font-medium">⚡ Special Discount Expires In:</span>
            <div className="text-cyan-400 font-mono font-bold tracking-wider text-lg">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </div>
        )}
        {isExpired && !unlocked && (
          <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3 text-center">
            <span className="text-xs text-red-400 font-medium">⚠️ Flash sale ended. Standard pricing applied for life.</span>
          </div>
        )}

        {/* Pricing Area */}
        <div className="flex items-baseline space-x-3">
          {!isExpired && !unlocked && (
            <>
              <span className="text-3xl font-extrabold text-white">₹{currentPrice}</span>
              <span className="text-lg text-gray-500 line-through">₹999</span>
              <span className="bg-cyan-500/10 text-cyan-400 text-xs px-2 py-1 rounded-md font-semibold border border-cyan-500/20">50% OFF</span>
            </>
          )}
          {(isExpired || unlocked) && (
            <span className="text-3xl font-extrabold text-white">₹{isExpired ? '999' : currentPrice}</span>
          )}
        </div>

        <p className="text-gray-400 text-sm leading-relaxed">
          Complete .zip of SceneNode Auto Edit, Beat Mark, and Vault (.jsxbin). One payment unlocks download for this browser.
        </p>

        {/* Action Button */}
        {unlocked ? (
          <a
            href="/api/scripts/download"
            className="w-full block bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3.5 px-6 rounded-xl transition duration-200 shadow-lg shadow-cyan-500/20 text-center cursor-pointer"
          >
            Download SceneNode-AE-Scripts.zip
          </a>
        ) : (
          <button
            onClick={() => void buy()}
            disabled={busy}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3.5 px-6 rounded-xl transition duration-200 shadow-lg shadow-blue-600/20 text-center cursor-pointer disabled:opacity-50"
          >
            {busy ? 'Opening checkout...' : `Pay ₹${currentPrice} with Razorpay`}
          </button>
        )}

        {error && <p className="text-center text-sm text-red-400 font-medium">{error}</p>}

        {/* Details list */}
        <div className="border-t border-gray-800/60 pt-4 space-y-2 text-xs text-gray-400">
          <div>• Selling price {unlocked ? 'Paid' : `₹${currentPrice}`}</div>
          <div>• Reseller commission ₹{RESELLER_COMMISSION_INR} per sale (UPI payout)</div>
          <div>• Platform share {unlocked ? 'Paid' : `₹${isExpired ? '499' : PLATFORM_SHARE_INR}`}</div>
        </div>
      </div>

      {/* Live Purchase Social Proof Ticker */}
      <div className="w-full max-w-xl bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 text-center z-10 my-2">
        <p className="text-xs text-cyan-300 animate-pulse">
          🔥 <span className="font-semibold text-white">{activeBuyer.name}</span> from <span className="font-semibold text-white">{activeBuyer.location}</span> just secured the bundle!
        </p>
      </div>

      {/* Footer / Reseller link */}
      <div className="text-center pb-4 z-10">
        <Link href="/dashboard/reseller" className="text-cyan-400 hover:underline text-xs">
          Resell this bundle and earn ₹{RESELLER_COMMISSION_INR} per sale. Minimum UPI payout ₹{MIN_PAYOUT_INR}. Open reseller dashboard
        </Link>
      </div>
    </main>
  );
}
