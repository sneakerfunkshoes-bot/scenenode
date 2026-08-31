'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, QrCode, X } from 'lucide-react';
import { downloadAeScripts } from '@/lib/download-ae-scripts';
import { UPI_AMOUNT_INR } from '@/lib/upi-amounts';

type PaymentStatus = 'none' | 'awaiting_utr' | 'pending' | 'paid' | 'rejected';

interface AeScriptsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AeScriptsPanel({ open, onClose }: AeScriptsPanelProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('none');
  const [utr, setUtr] = useState('');
  const [utrSubmitting, setUtrSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const refreshStatus = useCallback(async () => {
    const res = await fetch('/api/scripts/payment/status', {
      cache: 'no-store',
      credentials: 'include',
    });
    if (!res.ok) return;

    const data = (await res.json()) as { status?: PaymentStatus; unlocked?: boolean };
    if (data.status) setPaymentStatus(data.status);

    if (data.status === 'paid' || data.unlocked) {
      await fetch('/api/scripts/payment/unlock', {
        method: 'POST',
        credentials: 'include',
      });
      setPaymentStatus('paid');
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setQrDataUrl(null);
      setQrLoading(false);
      setPaymentStatus('none');
      setUtr('');
      setUtrSubmitting(false);
      setMessage('');
      setError('');
      setDownloading(false);
      return;
    }

    void refreshStatus();
  }, [open, refreshStatus]);

  useEffect(() => {
    if (!open || paymentStatus !== 'pending') return;

    const timer = window.setInterval(() => {
      void refreshStatus();
    }, 4000);

    return () => window.clearInterval(timer);
  }, [open, paymentStatus, refreshStatus]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const revealQr = async () => {
    if (qrDataUrl || qrLoading) return;

    setQrLoading(true);
    setError('');
    try {
      const startRes = await fetch('/api/scripts/payment/start', {
        method: 'POST',
        credentials: 'include',
      });
      if (!startRes.ok) {
        throw new Error('Could not start payment session.');
      }

      const startData = (await startRes.json()) as { qrDataUrl?: string };
      if (!startData.qrDataUrl) {
        throw new Error('Could not start payment session.');
      }

      setQrDataUrl(startData.qrDataUrl);
      setPaymentStatus('pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate payment QR.');
    } finally {
      setQrLoading(false);
    }
  };

  const submitUtr = async (event: React.FormEvent) => {
    event.preventDefault();
    setUtrSubmitting(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/scripts/payment/submit-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ utr }),
      });

      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        status?: PaymentStatus;
      };

      if (!res.ok) {
        setError(body.error || 'Could not submit payment reference.');
        return;
      }

      setPaymentStatus(body.status ?? 'pending');
      setMessage(body.message || 'Payment submitted. Waiting for verification…');
      await refreshStatus();
    } catch {
      setError('Could not submit payment reference.');
    } finally {
      setUtrSubmitting(false);
    }
  };

  const onDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      const unlockRes = await fetch('/api/scripts/payment/unlock', {
        method: 'POST',
        credentials: 'include',
      });
      const unlockData = (await unlockRes.json()) as { unlocked?: boolean; error?: string };
      if (!unlockRes.ok || !unlockData.unlocked) {
        setError(unlockData.error || 'Payment not verified yet.');
        return;
      }
      await downloadAeScripts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  const canDownload = paymentStatus === 'paid';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 sm:items-center sm:pb-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label="Close download panel"
            className="absolute inset-0 bg-[#050505]/78 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ae-scripts-title"
            initial={{ opacity: 0, y: 48, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#E2E8F0]/18 p-7 md:p-8"
            style={{
              background:
                'linear-gradient(165deg, rgba(226,232,240,0.1) 0%, rgba(12,12,12,0.94) 42%, rgba(5,5,5,0.98) 100%)',
              boxShadow: '0 28px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(226,232,240,0.14)',
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E2E8F0]/55 to-transparent"
              aria-hidden
            />

            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-[#64748B] transition hover:bg-[#E2E8F0]/10 hover:text-[#E2E8F0]"
            >
              <X size={18} />
            </button>

            <div className="mb-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#64748B]">
                scenenode
              </p>
              <h2
                id="ae-scripts-title"
                className="mt-2 font-display text-2xl font-bold tracking-tight text-[#E2E8F0]"
              >
                SceneNode AE Scripts
              </h2>
              <p className="mt-1.5 font-body text-sm text-[#94A3B8]">
                Pay ₹{UPI_AMOUNT_INR} via UPI to unlock the full After Effects script pack.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void revealQr()}
              disabled={qrLoading || Boolean(qrDataUrl)}
              className="w-full rounded-2xl border border-[#E2E8F0]/20 bg-[#050505]/70 p-5 text-left transition hover:border-[#E2E8F0]/45 hover:bg-[#050505]/90 disabled:opacity-60"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-body text-sm font-semibold text-[#E2E8F0]">
                    After Effects Script Pack
                  </p>
                  <p className="mt-1 font-body text-xs text-[#94A3B8]">
                    Auto Edit · Beat Mark · Vault
                  </p>
                  <p className="mt-3 font-display text-lg font-bold text-white">
                    ₹{UPI_AMOUNT_INR}
                  </p>
                </div>
                <span className="rounded-full border border-[#E2E8F0]/25 p-2 text-[#94A3B8]">
                  <QrCode size={18} />
                </span>
              </div>
              <p className="mt-3 font-body text-[11px] text-[#64748B]">
                {qrDataUrl ? 'QR generated below' : 'Tap card to generate payment QR'}
              </p>
            </button>

            <AnimatePresence>
              {qrLoading ? (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 text-center font-body text-xs text-[#94A3B8]"
                >
                  Generating QR…
                </motion.p>
              ) : null}

              {qrDataUrl ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mt-5 flex flex-col items-center rounded-2xl border border-[#E2E8F0]/15 bg-[#050505]/80 p-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt={`UPI payment QR for ₹${UPI_AMOUNT_INR}`}
                    width={220}
                    height={220}
                    className="rounded-xl"
                  />
                  <p className="mt-3 font-body text-xs text-[#94A3B8]">
                    Scan with any UPI app · ₹{UPI_AMOUNT_INR} fixed
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {qrDataUrl && paymentStatus !== 'paid' ? (
              <form onSubmit={submitUtr} className="mt-5 space-y-3">
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#64748B]">
                    UPI transaction reference (UTR)
                  </span>
                  <input
                    type="text"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    placeholder="Enter 12-digit UTR after payment"
                    className="mt-1.5 w-full rounded-xl border border-[#E2E8F0]/18 bg-[#050505]/90 px-3 py-3 font-body text-sm text-[#E2E8F0] outline-none placeholder:text-[#64748B] focus:border-zinc-500"
                    disabled={paymentStatus === 'pending'}
                  />
                </label>
                {paymentStatus !== 'pending' ? (
                  <button
                    type="submit"
                    disabled={utrSubmitting || !utr.trim()}
                    className="w-full rounded-full border border-[#E2E8F0]/35 bg-[#E2E8F0]/[0.04] px-4 py-1.5 font-body text-[13px] font-medium text-[#E2E8F0] transition hover:border-[#E2E8F0]/60 disabled:opacity-50"
                  >
                    {utrSubmitting ? 'Submitting…' : 'Submit payment reference'}
                  </button>
                ) : (
                  <p className="text-center font-body text-xs text-[#94A3B8]">
                    Verifying payment… download unlocks once confirmed.
                  </p>
                )}
              </form>
            ) : null}

            {message ? <p className="mt-3 text-center font-body text-xs text-[#94A3B8]">{message}</p> : null}
            {error ? <p className="mt-3 text-center font-body text-xs text-red-400">{error}</p> : null}

            {canDownload ? (
              <button
                type="button"
                onClick={() => void onDownload()}
                disabled={downloading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-[#E2E8F0]/35 bg-[#E2E8F0]/[0.04] px-4 py-1.5 font-body text-[13px] font-medium text-[#E2E8F0] transition hover:border-[#E2E8F0]/60 disabled:opacity-50"
              >
                <Download size={15} />
                {downloading ? 'Downloading…' : 'Download ZIP'}
              </button>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
