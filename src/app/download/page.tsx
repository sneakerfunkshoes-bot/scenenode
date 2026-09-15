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

// --- CRO Components ---

function UrgencyTimer({ onExpire }: { onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const TIMER_DURATION = 10 * 60 * 1000; // 10 minutes
    let expiryTimeStr = localStorage.getItem('scenenode_discount_expiry');
    const now = Date.now();

    if (!expiryTimeStr) {
      const newExpiry = now + TIMER_DURATION;
      localStorage.setItem('scenenode_discount_expiry', newExpiry.toString());
      expiryTimeStr = newExpiry.toString();
    }

    const expiryTime = parseInt(expiryTimeStr!, 10);

    const updateTimer = () => {
      const currentNow = Date.now();
      const diff = expiryTime - currentNow;

      if (diff <= 0) {
        setTimeLeft('00:00');
        onExpire();
        return false; // stop interval
      }

      const minutes = Math.floor((diff / 1000 / 60));
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      return true;
    };

    // Initial check
    if (!updateTimer()) return;

    const interval = setInterval(() => {
      if (!updateTimer()) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onExpire]);

  return (
    <div className="flex flex-col items-center space-y-2 py-4">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
        Special Discount Expires In:
      </span>
      <span className="font-mono text-3xl font-bold text-cyan-400 tabular-nums drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
        {timeLeft || '00:00'}
      </span>
    </div>
  );
}

function SocialProofTicker() {
  const [currentNotification, setCurrentNotification] = useState('');

  const NAMES = [
    'Rahul S.', 'Priya Sharma', 'Amit Patel', 'Fatima Khan',
    'Arjun Reddy', 'Ananya M.', 'Vikram Singh', 'Sneha K.',
    'Rohan V.', 'Ishita G.', 'Karan P.', 'Meera L.'
  ];
  const CITIES = [
    'Mumbai', 'Bengaluru', 'Delhi', 'Chennai', 'Kolkata',
    'Pune', 'Hyderabad', 'Jaipur', 'Ahmedabad', 'Surat'
  ];

  useEffect(() => {
    const getRandomNotification = () => {
      const name = NAMES[Math.floor(Math.random() * NAMES.length)];
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      return `${name} from ${city} just secured the bundle!`;
    };

    setCurrentNotification(getRandomNotification());

    const interval = setInterval(() => {
      setCurrentNotification(getRandomNotification());
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-10 items-center justify-center px-4 text-center">
        <p className="text-xs font-medium text-zinc-400 animate-pulse">
          🚀 {currentNotification}
        </p>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function DownloadScriptsPage() {
  const [busy, setBusy] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Check if already expired on load
    const expiryTimeStr = localStorage.getItem('scenenode_discount_expiry');
    if (expiryTimeStr) {
      const expiryTime = parseInt(expiryTimeStr, 10);
      if (Date.now() >= expiryTime) {
        setIsExpired(true);
      }
    }

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

  const currentPrice = isExpired ? 999 : SCRIPT_BUNDLE_PRICE_INR;
  const originalPrice = 999;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white font-jakarta">
      {/* Background Layers */}
      <div
        className="absolute inset-0 opacity-30 mix-blend-screen pointer-events-none"
        style={{
          backgroundImage: 'url(/images/blue-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: \`url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%234f46e5' stroke-width='1'%3E%3Cpath d='M40 0v40M0 40h40M40 40l20 20M60 60h20v20'/%3E%3C/g%3E%3C/svg%3E")\`,
          backgroundSize: '80px 80px'
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-20 md:px-12 flex flex-col md:flex-row items-center gap-12">
        {/* Product Visual (Left Side) */}
        <div className="w-full md:w-1/2 flex justify-center">
           <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-2xl">
                <div className="aspect-video w-full max-w-md rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden">
                   <img
                    src="/images/cats-laptops-hero.png"
                    alt="SceneNode Bundle"
                    className="object-cover w-full h-full opacity-80"
                   />
                </div>
                <div className="mt-4 text-center">
                   <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">Premium Assets Bundle</p>
                </div>
              </div>
           </div>
        </div>

        {/* Sales Content (Right Side) */}
        <div className="w-full md:w-1/2 space-y-8 text-center md:text-left">
          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-500">
              SceneNode · After Effects
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl leading-tight">
              SceneNode <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Script Bundle</span>
            </h1>
            <p className="text-lg leading-relaxed text-zinc-400 max-w-md">
              Complete .zip of SceneNode Auto Edit, Beat Mark, and Vault (.jsxbin).
              One payment unlocks instant download for this browser.
            </p>
          </div>

          {/* Pricing Section */}
          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="flex items-baseline gap-2">
              {!isExpired && <s className="text-zinc-500 text-xl">₹{originalPrice}</s>}
              <span className="text-4xl font-black text-white">₹{currentPrice}</span>
            </div>
            {!isExpired && (
              <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter">
                50% OFF
              </span>
            )}
            {isExpired && (
              <span className="bg-zinc-800 text-zinc-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter">
                Sale Ended
              </span>
            )}
          </div>

          {/* Action Area */}
          <div className="flex flex-col items-center md:items-start">
            {!unlocked && !isExpired && <UrgencyTimer onExpire={() => setIsExpired(true)} />}
            {unlocked && !isExpired && <div className="py-4 text-cyan-400 font-mono text-sm">✓ Discount applied</div>}

            {unlocked ? (
              <a
                href="/api/scripts/download"
                className="inline-flex w-full md:w-auto justify-center rounded-full bg-cyan-500 px-8 py-4 text-sm font-bold text-black transition hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                Download SceneNode-AE-Scripts.zip
              </a>
            ) : (
              <button
                type="button"
                onClick={() => void buy()}
                disabled={busy}
                className="inline-flex w-full md:w-auto justify-center rounded-full bg-[#0284C7] px-8 py-4 text-sm font-bold text-white transition hover:bg-[#0274B7] disabled:opacity-50 shadow-[0_0_20px_rgba(2,132,199,0.4)]"
              >
                {busy ? 'Opening checkout…' : `Pay ₹${currentPrice} with Razorpay`}
              </button>
            )}
          </div>

          {error ? <p className="text-sm text-red-400 font-medium">{error}</p> : null}
        </div>
      </div>

      {/* Reseller Footer */}
      <footer className="relative z-10 mt-20 pb-24 text-center px-6">
        <p className="text-xs text-zinc-500 max-w-lg mx-auto leading-relaxed">
          Resell this bundle and earn ₹{RESELLER_COMMISSION_INR} per sale. Minimum UPI payout ₹{MIN_PAYOUT_INR}.{' '}
          <Link href="/dashboard/reseller" className="text-cyan-400 font-semibold hover:underline">
            Open reseller dashboard
          </Link>
        </p>
      </footer>

      <SocialProofTicker />
    </main>
  );
}
