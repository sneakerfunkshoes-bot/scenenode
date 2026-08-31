'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface AdminSummary {
  totalPageViews: number;
  uniqueVisitors: number;
  totalAnalyses: number;
  totalChatMessages: number;
  totalErrors: number;
  firstVisit: string;
  lastActivity: string;
  geminiConfigured: boolean;
  forceMock: boolean;
  nodeEnv: string;
  last14Days: Array<{
    date: string;
    pageViews: number;
    analyses: number;
    chats: number;
  }>;
  recentEvents: Array<{ type: string; at: string; meta?: string }>;
}

interface ScriptPayment {
  id: string;
  status: string;
  amount: number;
  utr?: string;
  createdAt: string;
  paidAt?: string;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

export function AdminPanel() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<AdminSummary | null>(null);
  const [pendingPayments, setPendingPayments] = useState<ScriptPayment[]>([]);
  const [paymentActionId, setPaymentActionId] = useState<string | null>(null);
  const [unknownEffects, setUnknownEffects] = useState<
    Array<{
      id: string;
      at: string;
      sourceUrl: string;
      timestamp: number;
      description: string;
      primaryMatchName?: string;
      confidence?: number;
    }>
  >([]);
  const [librarySize, setLibrarySize] = useState<number | null>(null);

  const loadUnknown = useCallback(async () => {
    const res = await fetch('/api/admin/unknown-effects', {
      cache: 'no-store',
      credentials: 'include',
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      librarySize?: number;
      items?: Array<{
        id: string;
        at: string;
        sourceUrl: string;
        timestamp: number;
        description: string;
        primaryMatchName?: string;
        confidence?: number;
      }>;
    };
    setLibrarySize(data.librarySize ?? null);
    setUnknownEffects(data.items ?? []);
  }, []);

  const loadPayments = useCallback(async () => {
    const res = await fetch('/api/admin/payments', { cache: 'no-store', credentials: 'include' });
    if (!res.ok) return;
    const data = (await res.json()) as { pending?: ScriptPayment[] };
    setPendingPayments(data.pending ?? []);
  }, []);

  const loadStats = useCallback(async (options?: { showSessionError?: boolean }) => {
    const res = await fetch('/api/admin/stats', { cache: 'no-store', credentials: 'include' });
    if (res.status === 401) {
      setAuthenticated(false);
      if (options?.showSessionError) {
        setError('Session could not be established. Please try again.');
      }
      return;
    }
    if (!res.ok) throw new Error('Failed to load stats');
    const data = (await res.json()) as AdminSummary;
    setStats(data);
    setAuthenticated(true);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const configRes = await fetch('/api/admin/login', {
          cache: 'no-store',
          credentials: 'include',
        });
        const config = (await configRes.json()) as { configured?: boolean };
        if (config.configured === false) {
          setError('Admin access is not configured on this server. Set ADMIN_PASSWORD in .env.local.');
          setAuthenticated(false);
          return;
        }
        await loadStats();
        await loadPayments();
        await loadUnknown();
      } catch {
        setAuthenticated(false);
      }
    })();
  }, [loadStats, loadPayments, loadUnknown]);

  const actOnPayment = async (paymentId: string, action: 'approve' | 'reject') => {
    setPaymentActionId(paymentId);
    try {
      await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentId, action }),
      });
      await loadPayments();
    } finally {
      setPaymentActionId(null);
    }
  };

  const onLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error || 'Login failed.');
        return;
      }

      setPassword('');
      setError('');
      await loadStats({ showSessionError: true });
      await loadPayments();
      await loadUnknown();
    } catch {
      setError('Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    setAuthenticated(false);
    setStats(null);
    router.push('/');
  };

  if (authenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        Loading admin…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-4">
        <form
          onSubmit={onLogin}
          className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
        >
          <p className="text-sm font-semibold text-white">scenenode admin</p>
          <p className="mt-1 text-xs text-zinc-500">Enter admin password to continue.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-4 w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
            placeholder="Password"
            autoComplete="current-password"
          />
          {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={loading || !password}
            className="mt-4 w-full rounded-lg bg-zinc-200 px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <Link href="/" className="mt-4 block text-center text-xs text-zinc-500 hover:text-zinc-300">
            Back to site
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-5 py-8 text-zinc-200 md:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white">scenenode admin</h1>
            <p className="text-sm text-zinc-500">Usage overview and system health</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs hover:border-zinc-600">
              Home
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs hover:border-zinc-600"
            >
              Sign out
            </button>
          </div>
        </div>

        {stats ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Page views" value={stats.totalPageViews} />
              <StatCard label="Unique visitors" value={stats.uniqueVisitors} />
              <StatCard label="Analyses run" value={stats.totalAnalyses} />
              <StatCard label="Chat messages" value={stats.totalChatMessages} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <StatCard label="Errors logged" value={stats.totalErrors} />
              <StatCard label="Gemini API" value={stats.geminiConfigured ? 'Configured' : 'Missing key'} />
              <StatCard label="Environment" value={stats.nodeEnv} />
            </div>

            <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Last 14 days</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left text-xs">
                  <thead className="text-zinc-500">
                    <tr>
                      <th className="pb-2 pr-4">Date</th>
                      <th className="pb-2 pr-4">Views</th>
                      <th className="pb-2 pr-4">Analyses</th>
                      <th className="pb-2">Chats</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.last14Days.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-3 text-zinc-500">
                          No activity yet.
                        </td>
                      </tr>
                    ) : (
                      stats.last14Days.map((day) => (
                        <tr key={day.date} className="border-t border-zinc-900">
                          <td className="py-2 pr-4">{day.date}</td>
                          <td className="py-2 pr-4">{day.pageViews}</td>
                          <td className="py-2 pr-4">{day.analyses}</td>
                          <td className="py-2">{day.chats}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Script payments (pending)</p>
              {pendingPayments.length === 0 ? (
                <p className="mt-3 text-xs text-zinc-500">No pending UPI verifications.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {pendingPayments.map((payment) => (
                    <li
                      key={payment.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-900 px-3 py-2"
                    >
                      <div className="text-xs">
                        <p className="text-zinc-300">
                          ₹{payment.amount} · Order {payment.id}
                        </p>
                        <p className="text-zinc-600">{new Date(payment.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={paymentActionId === payment.id}
                          onClick={() => void actOnPayment(payment.id, 'approve')}
                          className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:border-zinc-500"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={paymentActionId === payment.id}
                          onClick={() => void actOnPayment(payment.id, 'reject')}
                          className="rounded border border-zinc-800 px-2 py-1 text-xs text-zinc-500 hover:border-zinc-600"
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Unknown visual queue
                {librarySize != null ? ` · library ${librarySize} records` : ''}
              </p>
              {unknownEffects.length === 0 ? (
                <p className="mt-3 text-xs text-zinc-500">
                  No unmatched visuals yet. Unrecognized overlays and effects from analysis land here.
                </p>
              ) : (
                <ul className="mt-3 space-y-2 text-xs">
                  {unknownEffects.slice(0, 20).map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between gap-4 border-b border-zinc-900 pb-2"
                    >
                      <span className="text-zinc-300">
                        {item.description}
                        {item.primaryMatchName ? (
                          <span className="text-zinc-500"> — near {item.primaryMatchName}</span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-zinc-600">
                        {item.timestamp.toFixed(2)}s
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Recent activity</p>
              <ul className="mt-3 space-y-2 text-xs">
                {stats.recentEvents.length === 0 ? (
                  <li className="text-zinc-500">No events yet.</li>
                ) : (
                  stats.recentEvents.slice(0, 12).map((event, i) => (
                    <li key={`${event.at}-${i}`} className="flex justify-between gap-4 border-b border-zinc-900 pb-2">
                      <span className="text-zinc-300">
                        {event.type}
                        {event.meta ? <span className="text-zinc-500"> — {event.meta}</span> : null}
                      </span>
                      <span className="shrink-0 text-zinc-600">
                        {new Date(event.at).toLocaleString()}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <p className="mt-6 text-xs text-zinc-600">
              First visit: {new Date(stats.firstVisit).toLocaleString()} · Last activity:{' '}
              {new Date(stats.lastActivity).toLocaleString()}
              {stats.forceMock ? ' · Mock analysis mode is ON' : ''}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
