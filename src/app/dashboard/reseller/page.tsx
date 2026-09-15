'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MIN_PAYOUT_INR, RESELLER_COMMISSION_INR, SCRIPT_BUNDLE_PRICE_INR } from '@/lib/script-catalog';

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function ResellerDashboard() {
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [link, setLink] = useState('');
  const [code, setCode] = useState('');
  const [available, setAvailable] = useState(0);
  const [earned, setEarned] = useState(0);
  const [saleCount, setSaleCount] = useState(0);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/reseller/me', { cache: 'no-store', credentials: 'include' });
    const data = (await res.json()) as {
      code?: string;
      link?: string;
      available?: number;
      earned?: number;
      saleCount?: number;
      withdrawals?: Withdrawal[];
    };
    setCode(data.code ?? '');
    setLink(data.link ?? '');
    setAvailable(data.available ?? 0);
    setEarned(data.earned ?? 0);
    setSaleCount(data.saleCount ?? 0);
    setWithdrawals(data.withdrawals ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/reseller/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          upiId,
          upiName,
          amount: available,
          commissionType: 'script_resell',
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Withdrawal failed');
      setMessage('Withdrawal request sent to admin.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#09090B] p-6 text-white md:p-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h1 className="mb-2 text-xl font-bold">Script Reseller Dashboard</h1>
          <p className="mb-4 text-sm text-zinc-400">
            Sell the SceneNode script bundle for ₹{SCRIPT_BUNDLE_PRICE_INR}. You earn ₹
            {RESELLER_COMMISSION_INR} on every successful sale, paid out to your UPI.
          </p>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-cyan-400">
            <span className="truncate">{link || 'Loading your tracking link…'}</span>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="shrink-0 rounded bg-zinc-800 px-3 py-1.5 text-xs text-white hover:bg-zinc-700"
            >
              {copied ? 'Copied' : 'Copy Link'}
            </button>
          </div>
          {code ? <p className="mt-2 text-[11px] text-zinc-500">Your code: {code}</p> : null}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div>
              <p className="mb-1 text-xs text-zinc-400">Available for UPI payout</p>
              <p className="text-4xl font-bold">₹{available}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {saleCount} sale{saleCount === 1 ? '' : 's'} · ₹{earned} earned total
              </p>
            </div>
            <p className="mt-4 text-[11px] text-zinc-500">
              Minimum payout: ₹{MIN_PAYOUT_INR} (1 sale)
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 text-sm font-bold">Withdraw via UPI</h2>
            <form onSubmit={(e) => void handleWithdrawRequest(e)} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Your UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="username@okhdfcbank"
                  required
                  className="w-full rounded border border-zinc-800 bg-zinc-950 p-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-400">Confirmed account name</label>
                <input
                  type="text"
                  value={upiName}
                  onChange={(e) => setUpiName(e.target.value)}
                  placeholder="As per bank records"
                  required
                  className="w-full rounded border border-zinc-800 bg-zinc-950 p-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={available < MIN_PAYOUT_INR || loading}
                className="w-full rounded bg-cyan-500 py-2 text-xs font-semibold text-black transition-all hover:bg-cyan-400 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : `Request ₹${available || MIN_PAYOUT_INR}+ UPI payout`}
              </button>
              {message ? <p className="text-center text-xs text-green-400">{message}</p> : null}
              {error ? <p className="text-center text-xs text-red-400">{error}</p> : null}
            </form>
          </div>
        </div>

        {withdrawals.length > 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-3 text-sm font-bold">Payout history</h2>
            <ul className="space-y-2 text-xs text-zinc-400">
              {withdrawals.map((w) => (
                <li key={w.id} className="flex justify-between border-b border-zinc-800 pb-2">
                  <span>
                    ₹{w.amount} · {w.status}
                  </span>
                  <span>{new Date(w.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Link href="/download" className="block text-center text-xs text-zinc-500 hover:text-zinc-300">
          Buy the bundle
        </Link>
      </div>
    </main>
  );
}
