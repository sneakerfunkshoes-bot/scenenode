'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, X } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onContinueWithGoogle: () => void;
  onContinueWithEmail: () => void;
}

export function AuthModal({
  open,
  onClose,
  onContinueWithGoogle,
  onContinueWithEmail,
}: AuthModalProps) {
  const [mode, setMode] = useState<'options' | 'email'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setMode('options');
      setEmail('');
      setPassword('');
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const finish = async (handler: () => void) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);
    handler();
  };

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
            aria-label="Close authentication"
            className="absolute inset-0 bg-[#050505]/78 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
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

            <div className="mb-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#64748B]">
                scenenode
              </p>
              <h2
                id="auth-title"
                className="mt-2 font-display text-2xl font-bold tracking-tight text-[#E2E8F0]"
              >
                {mode === 'options' ? 'Get started free' : 'Continue with Email'}
              </h2>
              <p className="mt-1.5 font-body text-sm text-[#94A3B8]">
                scenenode is free. Sign in to start inspecting edits.
              </p>
            </div>

            {mode === 'options' ? (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => finish(onContinueWithGoogle)}
                  className="flex items-center justify-center gap-3 rounded-xl border border-[#E2E8F0]/30 bg-[#E2E8F0]/[0.08] px-4 py-3.5 font-body text-sm font-medium text-[#E2E8F0] transition hover:border-[#E2E8F0]/55 hover:bg-[#E2E8F0]/14 disabled:opacity-55"
                >
                  <GoogleIcon />
                  {loading ? 'Continuing…' : 'Continue with Google'}
                </button>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-[#E2E8F0]/12" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#64748B]">
                    or
                  </span>
                  <div className="h-px flex-1 bg-[#E2E8F0]/12" />
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setMode('email')}
                  className="flex items-center justify-center gap-3 rounded-xl border border-[#E2E8F0]/15 bg-[#050505]/70 px-4 py-3.5 font-body text-sm font-medium text-[#94A3B8] transition hover:border-[#E2E8F0]/35 hover:text-[#E2E8F0] disabled:opacity-55"
                >
                  <Mail size={18} />
                  Continue with Email
                </button>
              </div>
            ) : (
              <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  finish(onContinueWithEmail);
                }}
              >
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#64748B]">
                    Email
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@studio.com"
                    className="w-full rounded-xl border border-[#E2E8F0]/18 bg-[#050505]/90 px-3 py-3 font-body text-sm text-[#E2E8F0] outline-none placeholder:text-[#64748B] focus:border-zinc-500"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#64748B]">
                    Password
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#E2E8F0]/18 bg-[#050505]/90 px-3 py-3 font-body text-sm text-[#E2E8F0] outline-none placeholder:text-[#64748B] focus:border-zinc-500"
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 rounded-full bg-zinc-200 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.16em] text-[#050505] disabled:opacity-55"
                >
                  {loading ? 'Continuing…' : 'Continue'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('options')}
                  className="mt-1 font-body text-xs text-[#64748B] transition hover:text-[#94A3B8]"
                >
                  ← Back
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#E2E8F0"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#94A3B8"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#CBD5E1"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#F8FAFC"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
