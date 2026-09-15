'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PayoutRequest {
  id: string;
  code: string;
  upiId: string;
  upiName: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'REJECTED';
}

export default function AdminResellerRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const auth = await fetch('/api/admin/login', { cache: 'no-store', credentials: 'include' });
    const authBody = (await auth.json()) as { authenticated?: boolean };
    if (!authBody.authenticated) {
      router.replace('/admin');
      return;
    }
    const res = await fetch('/api/admin/reseller-payouts', {
      cache: 'no-store',
      credentials: 'include',
    });
    if (res.status === 401) {
      router.replace('/admin');
      return;
    }
    const data = (await res.json()) as { requests?: PayoutRequest[] };
    setRequests(data.requests ?? []);
    setReady(true);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const mark = async (id: string, action: 'paid' | 'rejected') => {
    await fetch('/api/admin/reseller-payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, action }),
    });
    await load();
  };

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090B] text-zinc-400">
        Loading payouts…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090B] p-6 text-white md:p-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Reseller payout requests</h1>
            <p className="text-sm text-zinc-400">
              Pay ₹300 per attributed script sale to the UPI handle, then mark settled.
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs hover:border-zinc-600"
          >
            Back to admin
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950 text-xs uppercase tracking-wider text-zinc-400">
                <th className="p-4">Reseller</th>
                <th className="p-4">UPI handle</th>
                <th className="p-4">Owed</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-sm">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-zinc-500">
                    No withdrawal requests yet.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id}>
                    <td className="p-4">
                      <p className="font-medium">{req.upiName}</p>
                      <p className="font-mono text-[10px] text-zinc-500">{req.code}</p>
                    </td>
                    <td className="p-4 font-mono text-cyan-400">{req.upiId}</td>
                    <td className="p-4 font-bold">₹{req.amount}</td>
                    <td className="p-4">
                      <span
                        className={`rounded px-2 py-1 text-[10px] font-bold ${
                          req.status === 'PENDING'
                            ? 'border border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
                            : req.status === 'PAID'
                              ? 'border border-green-500/20 bg-green-500/10 text-green-400'
                              : 'border border-zinc-700 bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void mark(req.id, 'paid')}
                            className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-500"
                          >
                            Mark paid
                          </button>
                          <button
                            type="button"
                            onClick={() => void mark(req.id, 'rejected')}
                            className="rounded border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-500"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-500">Settled</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
